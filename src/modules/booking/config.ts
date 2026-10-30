// Edit studio services and opening hours here; weekdays use Sunday = 0.
export const bookingConfig = {
  services: [
    { name: 'Manicura en gel', duration: 60 },
    { name: 'Extensiones Gel X', duration: 90 },
    { name: 'Nail art a tu medida', duration: 120 },
  ],
  openingHours: {
    1: { open: '16:00', close: '22:00' },
    2: { open: '16:00', close: '22:00' },
    3: { open: '16:00', close: '22:00' },
    4: { open: '16:00', close: '22:00' },
    5: { open: '16:00', close: '22:00' },
    6: { open: '16:00', close: '22:00' },
  } as Partial<Record<number, { open: string; close: string }>>,
  slotStepMinutes: 120,
  firstBookingDay: 1,
  lastBookingDay: 60,
} as const

export type ServiceName = (typeof bookingConfig.services)[number]['name']
