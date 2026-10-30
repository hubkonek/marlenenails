import { z } from 'zod'
import { bookingConfig } from './config'

const serviceSchema = z.enum(bookingConfig.services.map(service => service.name))
export const slotsSchema = z.object({
  service: serviceSchema,
  date: z.iso.date(),
})
export const bookingSchema = slotsSchema.extend({
  name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(7).max(20)
    .regex(/^[+()\d -]+$/).refine(phone => (phone.match(/\d/g) ?? []).length >= 7),
  email: z.union([z.email(), z.literal('')]).optional(),
  time: z.string().regex(/^(?:[01]\d|2[0-3]):[0-5]\d$/),
  notes: z.string().trim().max(500).optional(),
  website: z.string().max(2048).default(''),
})
export type SlotsInput = z.input<typeof slotsSchema>
export type BookingInput = z.input<typeof bookingSchema>
