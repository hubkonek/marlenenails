import { bookingSchema, slotsSchema } from './validation'
import { dateWindow, dayInterval, filterAvailableSlots, generateSlots, isBookableDate } from './schedule'
import type { BookingConfirmation, BookingSettings, CalendarClient, Result } from './types'

type Dependencies = {
  calendar: CalendarClient | null
  timeZone: string | null
  now?: () => Date
  logError?: (message: string) => void
}
export function createBookingService({
  calendar, timeZone, now = () => new Date(), logError = () => {},
}: Dependencies) {
  function failure() {
    // Never log exception messages, response bodies, input or credentials.
    logError('Booking calendar operation failed')
    return { ok: false, error: 'unavailable' } as const
  }
  return {
    getSettings(): Result<BookingSettings> {
      if (!calendar || !timeZone) return { ok: false, error: 'not_configured' }
      return { ok: true, data: { ...dateWindow(now(), timeZone), timeZone } }
    },
    async getAvailableSlots(input: unknown): Promise<Result<{ slots: Array<string> }>> {
      const parsed = slotsSchema.safeParse(input)
      if (!parsed.success) return { ok: false, error: 'invalid_input' }
      if (!calendar || !timeZone) return { ok: false, error: 'not_configured' }
      const { date, service } = parsed.data
      if (!isBookableDate(date, now(), timeZone)) return { ok: false, error: 'invalid_input' }
      try {
        const slots = generateSlots(date, service, timeZone)
        if (!slots.length) return { ok: true, data: { slots: [] } }
        const range = dayInterval(date, timeZone)
        const busy = await calendar.freeBusy(range.start, range.end)
        return { ok: true, data: { slots: filterAvailableSlots(slots, busy).map(slot => slot.time) } }
      } catch {
        return failure()
      }
    },
    async createBooking(input: unknown): Promise<Result<BookingConfirmation>> {
      const parsed = bookingSchema.safeParse(input)
      if (!parsed.success) return { ok: false, error: 'invalid_input' }
      const data = parsed.data
      if (data.website) return {
        ok: true, data: { start: `${data.date}T${data.time}:00Z`, service: data.service },
      }
      if (!calendar || !timeZone) return { ok: false, error: 'not_configured' }
      if (!isBookableDate(data.date, now(), timeZone)) return { ok: false, error: 'invalid_input' }
      try {
        const slot = generateSlots(data.date, data.service, timeZone).find(item => item.time === data.time)
        if (!slot) return { ok: false, error: 'invalid_input' }
        const range = dayInterval(data.date, timeZone)
        // Always recheck immediately before inserting, never trust client availability.
        const busy = await calendar.freeBusy(range.start, range.end)
        if (!filterAvailableSlots([slot], busy).length) return { ok: false, error: 'slot_taken' }
        await calendar.insert({
          summary: `${data.service} — ${data.name}`,
          description: [`Teléfono: ${data.phone}`, `Correo: ${data.email || 'No indicado'}`,
            `Notas: ${data.notes || 'Sin notas'}`].join('\n'),
          start: { dateTime: slot.start, timeZone },
          end: { dateTime: slot.end, timeZone },
        })
        return { ok: true, data: { start: slot.start, service: data.service } }
      } catch {
        return failure()
      }
    },
  }
}
