import { describe, test } from 'bun:test'
import assert from 'node:assert/strict'
import { generateSlots, filterAvailableSlots, dateWindow, isBookableDate, localToInstant, dayInterval } from './schedule'
import { bookingSchema } from './validation'
import { createBookingService } from './service'
import type { CalendarClient, CalendarEvent } from './types'

const zone = 'America/Mexico_City'
const now = new Date('2026-07-20T18:00:00Z')
const input = {
  name: '  Ana López  ', phone: '+52 (55) 1234-5678', email: '',
  service: 'Manicura en gel', date: '2026-07-21', time: '16:00', notes: '', website: '',
}

function fixture(busy: Array<{ start: string; end: string }> = []) {
  const inserted: Array<CalendarEvent> = []
  const queries: Array<{ start: string; end: string }> = []
  const errors: Array<string> = []
  const client: CalendarClient = {
    async freeBusy(start, end) { queries.push({ start, end }); return busy },
    async insert(event) { inserted.push(event) },
  }
  const service = createBookingService({
    calendar: client, timeZone: zone, now: () => now,
    logError: (message) => { errors.push(message) },
  })
  return { service, client, inserted, queries, errors }
}

describe('studio schedule', () => {
  test('Tuesday–Saturday, 4–8 pm in 2-hour steps and the last slot fits the service', () => {
    const gel = generateSlots('2026-07-21', 'Manicura en gel', zone)
    assert.deepEqual(gel.map(slot => slot.time), ['16:00', '18:00'])
    assert.equal(generateSlots('2026-07-25', 'Extensiones Gel X', zone).at(-1)?.time, '18:00')
    assert.equal(generateSlots('2026-07-21', 'Nail art a tu medida', zone).at(-1)?.time, '18:00')
    assert.deepEqual(generateSlots('2026-07-26', 'Manicura en gel', zone), [])
    assert.deepEqual(generateSlots('2026-07-27', 'Manicura en gel', zone), [])
  })

  test('adjacent busy intervals do not block a slot; partial overlaps do', () => {
    const slots = generateSlots('2026-07-21', 'Manicura en gel', zone)
    const adjacent = [
      { start: '2026-07-21T21:00:00Z', end: '2026-07-21T22:00:00Z' },
      { start: '2026-07-21T23:00:00Z', end: '2026-07-22T00:00:00Z' },
    ]
    assert.equal(filterAvailableSlots(slots, adjacent)[0].time, '16:00')
    assert.ok(!filterAvailableSlots(slots, [{ start: '2026-07-21T22:30:00Z', end: '2026-07-21T22:45:00Z' }]).some(s => s.time === '16:00'))
  })

  test('resolves timezone offsets across DST and rejects nonexistent local times', () => {
    assert.equal(localToInstant('2026-01-15', '10:00', 'America/New_York')?.toISOString(), '2026-01-15T15:00:00.000Z')
    assert.equal(localToInstant('2026-07-15', '10:00', 'America/New_York')?.toISOString(), '2026-07-15T14:00:00.000Z')
    assert.equal(localToInstant('2026-03-08', '02:30', 'America/New_York'), null)
    assert.equal(localToInstant('2026-11-01', '01:30', 'America/New_York')?.toISOString(), '2026-11-01T05:30:00.000Z')
  })

  test('local day queries respect 23/25-hour DST days and midnight gaps', () => {
    assert.deepEqual(dayInterval('2026-03-08', 'America/New_York'), {
      start: '2026-03-08T05:00:00.000Z', end: '2026-03-09T04:00:00.000Z',
    })
    assert.deepEqual(dayInterval('2026-11-01', 'America/New_York'), {
      start: '2026-11-01T04:00:00.000Z', end: '2026-11-02T05:00:00.000Z',
    })
    assert.deepEqual(dayInterval('2026-09-06', 'America/Santiago'), {
      start: '2026-09-06T04:00:00.000Z', end: '2026-09-07T03:00:00.000Z',
    })
  })

  test('date window uses studio today: tomorrow through day 60, never today or day 61', () => {
    const bounds = dateWindow(new Date('2026-07-21T03:00:00Z'), zone)
    assert.deepEqual(bounds, { minDate: '2026-07-21', maxDate: '2026-09-18' })
    assert.equal(isBookableDate('2026-07-20', now, zone), false)
    assert.equal(isBookableDate('2026-07-21', now, zone), true)
    assert.equal(isBookableDate('2026-09-18', now, zone), true)
    assert.equal(isBookableDate('2026-09-19', now, zone), false)
    assert.equal(isBookableDate('2026-02-30', now, zone), false)
  })
})

describe('booking validation', () => {
  test('trims names, supports optional email and accepts honeypot for silent handling', () => {
    assert.equal(bookingSchema.parse(input).name, 'Ana López')
    assert.equal(bookingSchema.safeParse({ ...input, email: undefined }).success, true)
    assert.equal(bookingSchema.safeParse({ ...input, website: 'https://spam.invalid' }).success, true)
    assert.equal(bookingSchema.safeParse({ ...input, name: 'ab', phone: '1234567' }).success, true)
    assert.equal(bookingSchema.safeParse({ ...input, name: 'a'.repeat(80), phone: '1'.repeat(20) }).success, true)
  })
  test('rejects name and phone bounds, malformed email/date/time, and long notes', () => {
    for (const patch of [
      { name: ' a ' }, { name: ' ' }, { name: 'a'.repeat(81) },
      { phone: '123456' }, { phone: '1'.repeat(21) }, { phone: 'call me!' },
      { phone: '-------' }, { email: 'bad-email' }, { notes: 'a'.repeat(501) },
      { service: 'Unknown' }, { date: '2026-02-30' }, { time: '25:00' },
    ]) assert.equal(bookingSchema.safeParse({ ...input, ...patch }).success, false, JSON.stringify(patch))
  })
})

describe('booking service with mocked Google client', () => {
  test('occupied slot returns slot_taken without inserting', async () => {
    const f = fixture([{ start: '2026-07-21T22:30:00Z', end: '2026-07-21T23:00:00Z' }])
    assert.deepEqual(await f.service.createBooking(input), { ok: false, error: 'slot_taken' })
    assert.equal(f.inserted.length, 0)
  })
  test('free slot inserts exact start/end/timeZone, summary and contact details', async () => {
    const f = fixture()
    assert.deepEqual(await f.service.createBooking({ ...input, email: 'ana@example.com', notes: 'Rojo' }), {
      ok: true, data: { start: '2026-07-21T22:00:00.000Z', service: input.service },
    })
    assert.deepEqual(f.inserted[0], {
      summary: 'Manicura en gel — Ana López',
      description: 'Teléfono: +52 (55) 1234-5678\nCorreo: ana@example.com\nNotas: Rojo',
      start: { dateTime: '2026-07-21T22:00:00.000Z', timeZone: zone },
      end: { dateTime: '2026-07-21T23:00:00.000Z', timeZone: zone },
    })
    assert.deepEqual(f.queries, [{ start: '2026-07-21T06:00:00.000Z', end: '2026-07-22T06:00:00.000Z' }])
  })
  test('availability filters busy times and queries the full local day', async () => {
    const f = fixture([{ start: '2026-07-21T22:00:00Z', end: '2026-07-21T23:00:00Z' }])
    const result = await f.service.getAvailableSlots({ service: input.service, date: input.date })
    assert.ok(result.ok)
    assert.ok(!result.data.slots.includes('16:00'))
    assert.equal(result.data.slots[0], '18:00')
    assert.equal(f.inserted.length, 0)
  })
  test('Google errors become generic errors and sanitized server logs', async () => {
    const f = fixture()
    f.client.freeBusy = async () => { throw new Error('SECRET_PRIVATE_KEY@example.invalid') }
    const result = await f.service.createBooking(input)
    assert.deepEqual(result, { ok: false, error: 'unavailable' })
    assert.ok(!JSON.stringify([result, f.errors]).includes('SECRET'))
    assert.equal(f.errors.length, 1)
  })
  test('insert errors are generic too', async () => {
    const f = fixture()
    f.client.insert = async () => { throw new Error('SECRET') }
    assert.deepEqual(await f.service.createBooking(input), { ok: false, error: 'unavailable' })
    assert.ok(!f.errors.join().includes('SECRET'))
  })
  test('honeypot succeeds without querying Google, even when not configured', async () => {
    const f = fixture()
    assert.equal((await f.service.createBooking({ ...input, website: 'spam' })).ok, true)
    assert.equal(f.queries.length, 0)
    assert.equal(f.inserted.length, 0)
    const missing = createBookingService({ calendar: null, timeZone: null, now: () => now })
    assert.equal((await missing.createBooking({ ...input, website: 'spam' })).ok, true)
  })
  test('missing configuration and invalid input return typed errors', async () => {
    const missing = createBookingService({ calendar: null, timeZone: null, now: () => now })
    assert.deepEqual(await missing.createBooking(input), { ok: false, error: 'not_configured' })
    assert.deepEqual(await missing.getAvailableSlots({ service: input.service, date: input.date }), { ok: false, error: 'not_configured' })
    const f = fixture()
    assert.deepEqual(await f.service.createBooking({ ...input, date: '2026-07-20' }), { ok: false, error: 'invalid_input' })
    assert.deepEqual(await f.service.createBooking({ ...input, time: '10:15' }), { ok: false, error: 'invalid_input' })
    assert.deepEqual(await f.service.createBooking({ ...input, name: 'a' }), { ok: false, error: 'invalid_input' })
    assert.equal(f.queries.length, 0)
  })
})
