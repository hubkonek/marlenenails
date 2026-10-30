import '@tanstack/react-start/server-only'
import { env } from '../../env'
import { createGoogleCalendarClient } from './google.server'
import { createBookingService } from './service'

const configured = Boolean(env.GOOGLE_SERVICE_ACCOUNT_EMAIL && env.GOOGLE_PRIVATE_KEY &&
  env.GOOGLE_CALENDAR_ID && env.BOOKING_TIMEZONE)

export const bookingService = createBookingService({
  calendar: configured ? createGoogleCalendarClient({
    email: env.GOOGLE_SERVICE_ACCOUNT_EMAIL!,
    privateKey: env.GOOGLE_PRIVATE_KEY!,
    calendarId: env.GOOGLE_CALENDAR_ID!,
  }) : null,
  timeZone: configured ? env.BOOKING_TIMEZONE! : null,
  logError: message => console.error(message),
})

// Serialize the final availability check + insert within this server process.
// Google Calendar has no atomic "insert only if free"; see deployment notes.
let bookingQueue = Promise.resolve()
export async function createBookingOnServer(input: unknown) {
  const previous = bookingQueue
  let release!: () => void
  bookingQueue = new Promise<void>(resolve => { release = resolve })
  await previous
  try {
    return await bookingService.createBooking(input)
  } finally {
    release()
  }
}
