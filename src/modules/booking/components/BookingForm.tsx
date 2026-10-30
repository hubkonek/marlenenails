import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { bookingConfig } from '../config'
import type { ServiceName } from '../config'
import { createBooking, getAvailableSlots, getBookingSettings } from '../functions'
import type { BookingConfirmation, BookingError, BookingSettings } from '../types'

const messages: Record<BookingError, string> = {
  not_configured: 'Las reservas en línea aún no están disponibles. Por favor, contacta al estudio para agendar tu cita.',
  invalid_input: 'Revisa tus datos y elige una fecha y un horario disponibles.',
  slot_taken: 'Alguien acaba de reservar ese horario. Elige otro para tu momento.',
  unavailable: 'No pudimos conectar con el calendario. Inténtalo de nuevo en unos momentos.',
}
function formatTime12(value: string) {
  const [hour, minute] = value.split(':').map(Number)
  return `${hour % 12 || 12}:${String(minute).padStart(2, '0')} ${hour < 12 ? 'a. m.' : 'p. m.'}`
}
type SlotsState = {
  key: string
  status: 'loading' | 'ready' | 'error'
  values: Array<string>
  error?: BookingError
}

export function BookingForm({ initialService, onClose }: { initialService: string; onClose: () => void }) {
  const [service, setService] = useState<ServiceName>(
    bookingConfig.services.find(item => item.name === initialService)?.name ?? bookingConfig.services[0].name,
  )
  const [settings, setSettings] = useState<BookingSettings | null>(null)
  const [settingsError, setSettingsError] = useState<BookingError | null>(null)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [slots, setSlots] = useState<SlotsState | null>(null)
  const [revision, setRevision] = useState(0)
  const [settingsRevision, setSettingsRevision] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [submitError, setSubmitError] = useState<BookingError | null>(null)
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null)
  const key = `${service}|${date}`
  const currentSlots = slots?.key === key ? slots : null

  useEffect(() => {
    let cancelled = false
    setSettingsError(null)
    getBookingSettings().then(result => {
      if (cancelled) return
      if (result.ok) {
        setSettings(result.data)
        setDate(result.data.minDate)
      } else setSettingsError(result.error)
    }).catch(() => {
      if (!cancelled) setSettingsError('unavailable')
    })
    return () => { cancelled = true }
  }, [settingsRevision])

  useEffect(() => {
    if (!settings || !date) return
    let cancelled = false
    setTime('')
    setSlots({ key, status: 'loading', values: [] })
    getAvailableSlots({ data: { service, date } }).then(result => {
      if (cancelled) return
      if (result.ok) setSlots({ key, status: 'ready', values: result.data.slots })
      else setSlots({ key, status: 'error', values: [], error: result.error })
    }).catch(() => {
      if (!cancelled) setSlots({ key, status: 'error', values: [], error: 'unavailable' })
    })
    return () => { cancelled = true }
  }, [service, date, key, revision, settings])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submittingRef.current || !settings || !time || currentSlots?.status !== 'ready' || !currentSlots.values.includes(time)) return
    const form = new FormData(event.currentTarget)
    submittingRef.current = true
    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await createBooking({ data: {
        name: String(form.get('name') ?? ''),
        phone: String(form.get('phone') ?? ''),
        email: String(form.get('email') ?? ''),
        notes: String(form.get('notes') ?? ''),
        website: String(form.get('website') ?? ''),
        service, date, time,
      } })
      if (result.ok) setConfirmation(result.data)
      else {
        setSubmitError(result.error)
        if (result.error === 'slot_taken') {
          setTime('')
          setSlots(null)
          setRevision(value => value + 1)
        }
      }
    } catch {
      setSubmitError('unavailable')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  if (confirmation && settings) return (
    <div className="booking-modal booking-success" role="status">
      <span className="eyebrow">TU MOMENTO YA TIENE FECHA</span>
      <h2>¡Tu cita está <em>agendada!</em></h2>
      <p>{confirmation.service}</p>
      <p>{new Intl.DateTimeFormat('es-MX', {
        timeZone: settings.timeZone, dateStyle: 'full', timeStyle: 'short', hour12: true,
      }).format(new Date(confirmation.start))}</p>
      <p>Hora del estudio ({settings.timeZone}). ¡Te esperamos!</p>
      <button className="button button-red" onClick={onClose}>Listo, ¡nos vemos!</button>
    </div>
  )

  return (
    <div className="booking-modal">
      <span className="eyebrow">UN MOMENTO SOLO PARA TI</span>
      <h2>Hagamos algo<br /><em>bonito.</em></h2>
      {!settings && !settingsError && <p role="status">Cargando calendario…</p>}
      {settingsError && <div role="alert" className="booking-message">
        <p>{messages[settingsError]}</p>
        {settingsError !== 'not_configured' && <button type="button" className="back-button" onClick={() => setSettingsRevision(value => value + 1)}>Volver a intentar</button>}
      </div>}
      <form onSubmit={submit} aria-busy={submitting}>
        <p>Elige tu ritual y reserva tu momento. {settings && `Horarios del estudio (${settings.timeZone}).`}</p>
        <fieldset className="booking-fields" disabled={submitting || !settings}>
          <label>Tu nombre
            <input name="name" placeholder="¿Cómo te llamas?" autoComplete="name" required minLength={2} maxLength={80} />
          </label>
          <div className="form-row">
            <label>Tu teléfono
              <input name="phone" type="tel" autoComplete="tel" required minLength={7} maxLength={20} placeholder="55 1234 5678" />
            </label>
            <label>Tu correo (opcional)
              <input name="email" type="email" autoComplete="email" />
            </label>
          </div>
          <label>Tu ritual
            <select name="service" value={service} onChange={event => {
              setService(event.target.value as ServiceName)
              setTime('')
              setSubmitError(null)
            }}>
              {bookingConfig.services.map(item => <option key={item.name} value={item.name}>{item.name} · {item.duration} min</option>)}
            </select>
          </label>
          <label>Fecha de tu cita
            <input name="date" type="date" required min={settings?.minDate} max={settings?.maxDate} value={date} onChange={event => {
              setDate(event.target.value)
              setTime('')
              setSubmitError(null)
            }} />
          </label>
          <fieldset className="booking-times" aria-busy={Boolean(settings && date && (!currentSlots || currentSlots.status === 'loading'))}>
            <legend>Elige tu horario</legend>
            <div role="status" className="booking-message">
              {!date ? 'Elige una fecha para ver los horarios.' : settings && (!currentSlots || currentSlots.status === 'loading') ? 'Buscando horarios disponibles…' : null}
              {currentSlots?.status === 'ready' && !currentSlots.values.length && 'No hay horarios disponibles ese día'}
            </div>
            {currentSlots?.status === 'error' && <div role="alert" className="booking-message">
              <p>{messages[currentSlots.error ?? 'unavailable']}</p>
              {currentSlots.error !== 'not_configured' && <button className="back-button" type="button" onClick={() => setRevision(value => value + 1)}>Actualizar horarios</button>}
            </div>}
            {currentSlots?.status === 'ready' && <div className="booking-slots">
              {currentSlots.values.map(value => <label className="booking-slot" key={value}>
                <input type="radio" name="time" value={value} checked={time === value} required onChange={() => { setTime(value); setSubmitError(null) }} />
                <span>{formatTime12(value)}</span>
              </label>)}
            </div>}
          </fieldset>
          <label>¿Algo que quieras contarnos? (opcional)
            <textarea name="notes" rows={3} maxLength={500} placeholder="Tu idea, tu color favorito…" />
          </label>
          <div className="booking-honeypot" aria-hidden="true">
            <label>Sitio web<input name="website" tabIndex={-1} autoComplete="off" maxLength={2048} /></label>
          </div>
          <button className="button button-red" type="submit" disabled={!time || currentSlots?.status !== 'ready' || submitting}>
            {submitting ? 'Agendando tu cita…' : 'Agendar mi cita'}
          </button>
        </fieldset>
        {submitError && <p className="booking-message" role="alert">{messages[submitError]}</p>}
      </form>
    </div>
  )
}
