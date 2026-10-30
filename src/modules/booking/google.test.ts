import { describe, test } from 'bun:test'
import assert from 'node:assert/strict'
import { generateKeyPairSync, verify } from 'node:crypto'
import { createGoogleCalendarClient } from './google.server'

const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 })
const pem = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString()
const calendarId = 'studio/calendar@example.invalid'
const credentials = { email: 'booking@example.invalid', privateKey: pem.replace(/\n/g, '\\n'), calendarId }
const start = '2026-07-21T16:00:00.000Z'
const end = '2026-07-21T17:00:00.000Z'

describe('Google Calendar REST adapter with mocked HTTP only', () => {
  test('signs an RS256 JWT, shares and caches token requests, and refreshes before expiry', async () => {
    const calls: Array<{ url: string; init?: RequestInit }> = []
    let milliseconds = Date.parse('2026-07-20T12:00:00Z')
    let tokens = 0
    const request: typeof fetch = async (url, init) => {
      calls.push({ url: String(url), init })
      if (String(url).includes('oauth2.googleapis.com')) {
        tokens++
        const form = new URLSearchParams(String(init?.body))
        assert.equal(form.get('grant_type'), 'urn:ietf:params:oauth:grant-type:jwt-bearer')
        const jwt = form.get('assertion')!
        const [header, payload, signature] = jwt.split('.')
        assert.deepEqual(JSON.parse(Buffer.from(header, 'base64url').toString()), { alg: 'RS256', typ: 'JWT' })
        const claims = JSON.parse(Buffer.from(payload, 'base64url').toString())
        assert.equal(claims.iss, credentials.email)
        assert.equal(claims.aud, 'https://oauth2.googleapis.com/token')
        assert.equal(claims.exp - claims.iat, 3600)
        assert.ok(verify('RSA-SHA256', Buffer.from(`${header}.${payload}`), publicKey, Buffer.from(signature, 'base64url')))
        return Response.json({ access_token: 'mock-token', expires_in: 3600 })
      }
      assert.equal(new Headers(init?.headers).get('Authorization'), 'Bearer mock-token')
      return Response.json({ calendars: { [calendarId]: { busy: [] } } })
    }
    const client = createGoogleCalendarClient(credentials, { fetch: request, now: () => milliseconds })
    await Promise.all([client.freeBusy(start, end), client.freeBusy(start, end)])
    assert.equal(tokens, 1)
    assert.deepEqual(JSON.parse(String(calls[1].init?.body)), {
      timeMin: start, timeMax: end, items: [{ id: calendarId }],
    })
    milliseconds += 3_539_000
    await client.freeBusy(start, end)
    assert.equal(tokens, 1)
    milliseconds += 2_000
    await client.freeBusy(start, end)
    assert.equal(tokens, 2)
    const event = {
      summary: 'Manicura en gel — Ana', description: 'Teléfono: 1234567',
      start: { dateTime: start, timeZone: 'America/Mexico_City' },
      end: { dateTime: end, timeZone: 'America/Mexico_City' },
    }
    await client.insert(event)
    assert.equal(calls.at(-1)?.url, `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=none`)
    assert.deepEqual(JSON.parse(String(calls.at(-1)?.init?.body)), event)
  })

  test('fails closed for inaccessible, missing and malformed calendar availability', async () => {
    for (const payload of [
      { calendars: {} },
      { calendars: { [calendarId]: { busy: [], errors: [{ reason: 'notFound' }] } } },
      { calendars: { [calendarId]: { busy: [{ start: 'bad', end }] } } },
      { calendars: { [calendarId]: { busy: [{ start: end, end: start }] } } },
    ]) {
      const request: typeof fetch = async url => String(url).includes('oauth2.googleapis.com')
        ? Response.json({ access_token: 'mock-token', expires_in: 3600 })
        : Response.json(payload)
      const client = createGoogleCalendarClient(credentials, { fetch: request })
      await assert.rejects(client.freeBusy(start, end))
    }
  })

  test('does not expose Google response bodies through HTTP errors', async () => {
    const request: typeof fetch = async url => String(url).includes('oauth2.googleapis.com')
      ? Response.json({ access_token: 'mock-token', expires_in: 3600 })
      : new Response('SECRET_RESPONSE', { status: 403 })
    const client = createGoogleCalendarClient(credentials, { fetch: request })
    await assert.rejects(client.freeBusy(start, end), { message: 'Calendar request failed' })
  })
})
