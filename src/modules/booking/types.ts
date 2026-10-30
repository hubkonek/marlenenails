import type { ServiceName } from './config'

export type BookingError = 'not_configured' | 'invalid_input' | 'slot_taken' | 'unavailable'
export type Result<T> = { ok: true; data: T } | { ok: false; error: BookingError }
export type BusyInterval = { start: string; end: string }
export type Slot = BusyInterval & { time: string }
export type BookingConfirmation = { start: string; service: ServiceName }
export type BookingSettings = { minDate: string; maxDate: string; timeZone: string }
export type CalendarEvent = {
  summary: string
  description: string
  start: { dateTime: string; timeZone: string }
  end: { dateTime: string; timeZone: string }
}
export interface CalendarClient {
  freeBusy: (start: string, end: string) => Promise<Array<BusyInterval>>
  insert: (event: CalendarEvent) => Promise<void>
}
