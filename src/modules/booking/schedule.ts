import { bookingConfig } from './config'
import type { ServiceName } from './config'
import type { BusyInterval, Slot } from './types'

const formatters = new Map<string, Intl.DateTimeFormat>()
function formatter(timeZone: string) {
  let value = formatters.get(timeZone)
  if (!value) {
    value = new Intl.DateTimeFormat('en-CA', {
      timeZone, year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
    })
    formatters.set(timeZone, value)
  }
  return value
}
function partsAt(instant: Date, timeZone: string) {
  const parts = Object.fromEntries(formatter(timeZone).formatToParts(instant)
    .filter(part => part.type !== 'literal').map(part => [part.type, part.value]))
  return {
    date: `${parts.year}-${parts.month}-${parts.day}`,
    time: `${parts.hour}:${parts.minute}`,
    wall: Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day),
      Number(parts.hour), Number(parts.minute), Number(parts.second)),
  }
}
export function addDays(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`)
  value.setUTCDate(value.getUTCDate() + days)
  return value.toISOString().slice(0, 10)
}
export function dateWindow(now: Date, timeZone: string) {
  const today = partsAt(now, timeZone).date
  return {
    minDate: addDays(today, bookingConfig.firstBookingDay),
    maxDate: addDays(today, bookingConfig.lastBookingDay),
  }
}
export function isBookableDate(date: string, now: Date, timeZone: string) {
  const parsed = new Date(`${date}T00:00:00Z`)
  if (!Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date) return false
  const { minDate, maxDate } = dateWindow(now, timeZone)
  return date >= minDate && date <= maxDate
}

// Resolve offsets on both sides of a transition, then round-trip each candidate.
// Gaps have no matching instant; folds deterministically choose the earlier one.
export function localToInstant(date: string, time: string, timeZone: string): Date | null {
  const wall = Date.parse(`${date}T${time}:00Z`)
  if (!Number.isFinite(wall)) return null
  const offsets = new Set<number>()
  for (let hours = -36; hours <= 36; hours += 6) {
    const sample = wall + hours * 3_600_000
    offsets.add(partsAt(new Date(sample), timeZone).wall - sample)
  }
  const matches = [...offsets].map(offset => new Date(wall - offset))
    .filter(instant => {
      const parts = partsAt(instant, timeZone)
      return parts.date === date && parts.time === time
    }).sort((a, b) => a.getTime() - b.getTime())
  return matches[0] ?? null
}
function minutes(time: string) {
  const [hour, minute] = time.split(':').map(Number)
  return hour * 60 + minute
}
function clock(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, '0')}:${String(value % 60).padStart(2, '0')}`
}
export function generateSlots(date: string, service: ServiceName, timeZone: string): Array<Slot> {
  const hours = bookingConfig.openingHours[new Date(`${date}T00:00:00Z`).getUTCDay()]
  const duration = bookingConfig.services.find(item => item.name === service)?.duration
  if (!hours || !duration) return []
  const closing = localToInstant(date, hours.close, timeZone)
  if (!closing) return []
  const slots: Array<Slot> = []
  for (let value = minutes(hours.open); value + duration <= minutes(hours.close); value += bookingConfig.slotStepMinutes) {
    const time = clock(value)
    const start = localToInstant(date, time, timeZone)
    if (!start) continue
    const end = new Date(start.getTime() + duration * 60_000)
    if (end > closing) continue
    slots.push({ time, start: start.toISOString(), end: end.toISOString() })
  }
  return slots
}
export function filterAvailableSlots(slots: Array<Slot>, busy: Array<BusyInterval>) {
  return slots.filter(slot => !busy.some(interval =>
    Date.parse(slot.start) < Date.parse(interval.end) && Date.parse(slot.end) > Date.parse(interval.start)))
}
function startOfDay(date: string, timeZone: string): Date {
  // Some zones advance the clock at midnight: the day starts at the first
  // existing local minute, not at a fabricated midnight with yesterday's offset.
  for (let minute = 0; minute < 1440; minute++) {
    const instant = localToInstant(date, clock(minute), timeZone)
    if (instant) return instant
  }
  throw new Error('Local calendar day does not exist')
}
export function dayInterval(date: string, timeZone: string): BusyInterval {
  const start = startOfDay(date, timeZone)
  const end = startOfDay(addDays(date, 1), timeZone)
  return { start: start.toISOString(), end: end.toISOString() }
}
