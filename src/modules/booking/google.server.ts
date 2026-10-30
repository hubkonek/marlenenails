import '@tanstack/react-start/server-only'
import { sign } from 'node:crypto'
import { z } from 'zod'
import type { CalendarClient } from './types'

type Credentials = { email: string; privateKey: string; calendarId: string }
type Options = { fetch?: typeof globalThis.fetch; now?: () => number }
const tokenSchema = z.object({
  access_token: z.string().min(1), expires_in: z.number().positive(),
})
const busySchema = z.object({
  calendars: z.record(z.string(), z.object({
    busy: z.array(z.object({
      start: z.iso.datetime({ offset: true }),
      end: z.iso.datetime({ offset: true }),
    }).refine(interval => Date.parse(interval.end) > Date.parse(interval.start))),
    errors: z.array(z.unknown()).optional(),
  })),
})
export function createGoogleCalendarClient(credentials: Credentials, options: Options = {}): CalendarClient {
  const request = options.fetch ?? globalThis.fetch
  const now = options.now ?? Date.now
  let cached: { token: string; expiresAt: number } | null = null
  let pendingToken: Promise<string> | null = null

  async function refreshToken() {
    const issuedAt = Math.floor(now() / 1000)
    const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url')
    const unsigned = [
      encode({ alg: 'RS256', typ: 'JWT' }),
      encode({
        iss: credentials.email,
        scope: 'https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.freebusy',
        aud: 'https://oauth2.googleapis.com/token',
        iat: issuedAt, exp: issuedAt + 3600,
      }),
    ].join('.')
    const signature = sign('RSA-SHA256', Buffer.from(unsigned),
      credentials.privateKey.replace(/\\n/g, '\n')).toString('base64url')
    const response = await request('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: `${unsigned}.${signature}`,
      }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) throw new Error('Calendar authorization failed')
    const token = tokenSchema.parse(await response.json())
    cached = { token: token.access_token, expiresAt: now() + token.expires_in * 1000 - 60_000 }
    return token.access_token
  }
  async function accessToken() {
    if (cached && cached.expiresAt > now()) return cached.token
    if (!pendingToken) pendingToken = refreshToken().finally(() => { pendingToken = null })
    return pendingToken
  }
  async function calendarRequest(path: string, body: unknown) {
    const token = await accessToken()
    const response = await request(`https://www.googleapis.com/calendar/v3/${path}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    })
    if (!response.ok) {
      if (response.status === 401) cached = null
      throw new Error('Calendar request failed')
    }
    return response
  }
  return {
    async freeBusy(start, end) {
      const response = await calendarRequest('freeBusy', {
        timeMin: start, timeMax: end, items: [{ id: credentials.calendarId }],
      })
      const parsed = busySchema.parse(await response.json())
      // A missing or inaccessible calendar must never be mistaken for a free day.
      if (!Object.hasOwn(parsed.calendars, credentials.calendarId)) throw new Error('Calendar availability failed')
      const calendar = parsed.calendars[credentials.calendarId]
      if (calendar.errors?.length) throw new Error('Calendar availability failed')
      return calendar.busy
    },
    async insert(event) {
      await calendarRequest(`calendars/${encodeURIComponent(credentials.calendarId)}/events?sendUpdates=none`, event)
    },
  }
}
