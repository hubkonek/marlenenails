import { createServerFn } from '@tanstack/react-start'
import type { BookingInput, SlotsInput } from './validation'

// Validate inside the service so invalid requests also return our typed errors.
export const getAvailableSlots = createServerFn({ method: 'GET' })
  .validator((data: SlotsInput) => data)
  .handler(async ({ data }) => {
    const { bookingService } = await import('./booking.server')
    return bookingService.getAvailableSlots(data)
  })

export const createBooking = createServerFn({ method: 'POST' })
  .validator((data: BookingInput) => data)
  .handler(async ({ data }) => {
    const { createBookingOnServer } = await import('./booking.server')
    return createBookingOnServer(data)
  })

export const getBookingSettings = createServerFn({ method: 'GET' })
  .handler(async () => {
    const { bookingService } = await import('./booking.server')
    return bookingService.getSettings()
  })
