import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { BookingForm } from '../../booking/components/BookingForm'

function Arrow({
  diagonal = false,
  className = '',
}: {
  diagonal?: boolean
  className?: string
}) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      {diagonal ? (
        <path d="M5 19 19 5M5 5h14v14" />
      ) : (
        <path d="M4 12h16m-6-6 6 6-6 6" />
      )}
    </svg>
  )
}

function Spark({ className = '' }: { className?: string }) {
  return (
    <svg
      className={className}
      width="32"
      height="32"
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 1c0 14-5 19-19 19 14 0 19 5 19 19 0-14 5-19 19-19C25 20 20 15 20 1Z"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="m6 6 28 28M6 34 34 6" stroke="currentColor" strokeWidth=".7" />
    </svg>
  )
}

const services = [
  {
    name: 'Manicura en gel',
    description:
      'Tu color favorito. Un brillo impecable. El clásico que siempre se siente bien.',
    detail: '60 min · Color & cuidado',
    image: '/images/red-manicure.webp',
    className: 'gel',
  },
  {
    name: 'Extensiones Gel X',
    description:
      'La forma, el largo y la actitud. Uñas ligeras que se sienten como tuyas.',
    detail: '90 min · Forma & longitud',
    image: '/images/satin-nails.webp',
    className: 'extensions',
  },
  {
    name: 'Nail art a tu medida',
    description: 'Pequeñas obras de arte, creadas a mano. Tan únicas como tú.',
    detail: 'Personalizado · Diseño & detalle',
    image: '/images/red-polish.webp',
    className: 'art',
  },
]

const works = [
  {
    image: '/images/red-manicure.webp',
    title: 'The signature red',
    category: 'Rojo clásico',
    className: 'work-one',
  },
  {
    image: '/images/satin-nails.webp',
    title: 'Satin & shine',
    category: 'Gel X',
    className: 'work-two',
  },
  {
    image: '/images/red-polish.webp',
    title: 'Little red rituals',
    category: 'Nail art',
    className: 'work-three',
  },
  {
    image: '/images/red-manicure.webp',
    title: 'Cherry on top',
    category: 'Nail art',
    className: 'work-four',
  },
]

function Modal({
  children,
  onClose,
  label,
}: {
  children: ReactNode
  onClose: () => void
  label: string
}) {
  const dialog = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const element = dialog.current
    const previousFocus = document.activeElement as HTMLElement | null
    element?.showModal()
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = overflow
      previousFocus?.focus()
    }
  }, [])
  return (
    <dialog
      ref={dialog}
      className="modal"
      aria-label={label}
      onCancel={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <button
        className="modal-close"
        onClick={onClose}
        aria-label="Cerrar ventana"
      >
        ×
      </button>
      {children}
    </dialog>
  )
}

export function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [booking, setBooking] = useState<string | null>(null)
  const [filter, setFilter] = useState('Todos')
  const [lightbox, setLightbox] = useState<(typeof works)[number] | null>(null)
  const [review, setReview] = useState(0)
  const reviews = [
    {
      quote:
        'No es solo cómo quedan mis uñas, es cómo me siento cuando salgo. Marlene tiene ese don de hacerte sentir especial.',
      name: 'Andrea M.',
      service: 'Manicura en gel',
    },
    {
      quote:
        'Encontré mi rojo perfecto y mi momento favorito del mes. Cada detalle está hecho con muchísimo cuidado.',
      name: 'Sofía R.',
      service: 'Extensiones Gel X',
    },
    {
      quote:
        'Llegué con una idea y salí con algo aún más bonito. Se nota el amor en cada pequeño detalle.',
      name: 'Valentina G.',
      service: 'Nail art personalizado',
    },
  ]
  const closeMenu = () => setMenuOpen(false)
  return (
    <>
      <a className="skip-link" href="#main">
        Ir al contenido
      </a>
      <div className="announcement">
        <span>UN PEQUEÑO LUJO, SOLO PARA TI</span>
        <Spark />
        <span>HECHO CON AMOR, HASTA EL ÚLTIMO DETALLE</span>
      </div>
      <header className="header">
        <a
          className="wordmark"
          href="#"
          aria-label="Marlene Nails Studio, inicio"
        >
          marlene<span className="logo-star">✳</span>
          <small>NAILS STUDIO</small>
        </a>
        <nav
          id="mobile-menu"
          className={menuOpen ? 'nav open' : 'nav'}
          aria-label="Navegación principal"
        >
          <a href="#servicios" onClick={closeMenu}>
            Servicios
          </a>
          <a href="#estudio" onClick={closeMenu}>
            El estudio
          </a>
          <a href="#galeria" onClick={closeMenu}>
            Nuestro arte
          </a>
          <a href="#experiencia" onClick={closeMenu}>
            La experiencia
          </a>
        </nav>
        <button
          className="header-book"
          onClick={() => setBooking('Manicura en gel')}
        >
          Reserva tu cita <Arrow diagonal />
        </button>
        <button
          className="menu-toggle"
          aria-expanded={menuOpen}
          aria-controls="mobile-menu"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <span />
          <span />
        </button>
      </header>
      <main id="main">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <div className="eyebrow">
              <span className="little-line" /> MÁS QUE UÑAS, UN RITUAL PARA TI
            </div>
            <h1 id="hero-title">
              El arte de
              <br />
              sentirte <em>tú.</em>
            </h1>
            <p>
              Uñas que expresan quién eres.
              <br />
              Un espacio para pausar, cuidarte y brillar.
            </p>
            <div className="hero-actions">
              <button
                className="button button-red"
                onClick={() => setBooking('Manicura en gel')}
              >
                Reserva tu momento <Arrow diagonal />
              </button>
              <a className="text-link" href="#servicios">
                Explora los servicios <span>↓</span>
              </a>
            </div>
            <div className="hero-note">
              <Spark />
              <span>
                Diseños únicos. Cuidado consciente.
                <br />
                <strong>Todo el amor, en tus manos.</strong>
              </span>
            </div>
          </div>
          <div className="hero-visual">
            <img
              className="hero-image"
              src="/images/red-manicure.webp"
              alt="Manicura rojo cereza brillante sobre satén y rosas rojas"
              fetchPriority="high"
              width="1181"
              height="1332"
            />
            <div className="image-shade" />
            <div className="image-label">
              <span>THE RED EDIT</span>
              <span>01 — MARLENE SIGNATURE</span>
            </div>
            <div className="round-seal">
              <span>HECHO CON AMOR</span>
              <Spark />
              <span>HASTA TUS UÑAS</span>
            </div>
            <div className="hero-caption">Un rojo. Mil formas de ser tú.</div>
          </div>
          <span className="hero-side-note">
            NAIL ART, WITH A PERSONAL TOUCH.
          </span>
        </section>
        <div className="values-strip" aria-label="Nuestra esencia">
          <span>TUS UÑAS, TU ESENCIA</span>
          <Spark />
          <span>EL LUJO ESTÁ EN LOS DETALLES</span>
          <Spark />
          <span>UN MOMENTO SOLO PARA TI</span>
          <Spark />
          <span>ARTE HECHO A MANO</span>
          <Spark />
        </div>
        <section className="section services-section" id="servicios">
          <div className="section-heading">
            <div>
              <span className="eyebrow">01 / ELIGE TU RITUAL</span>
              <h2>
                Pequeños detalles.
                <br />
                <em>Grandes sensaciones.</em>
              </h2>
            </div>
            <p>
              Desde un rojo que nunca falla hasta un diseño
              <br className="desktop-break" /> que no existe en nadie más.
              Encuentra lo tuyo.
            </p>
          </div>
          <div className="service-grid">
            {services.map((service, index) => (
              <article className="service-card" key={service.name}>
                <button
                  className={`service-image ${service.className}`}
                  onClick={() => setBooking(service.name)}
                  aria-label={`Elegir ${service.name}`}
                >
                  <img
                    src={service.image}
                    alt={
                      service.name === 'Nail art a tu medida'
                        ? 'Inspiración de color rojo con esmalte y rosas'
                        : `Inspiración de ${service.name.toLowerCase()} en rojo`
                    }
                    loading="lazy"
                  />
                  <span className="service-number">0{index + 1}</span>
                  <span className="image-arrow">
                    <Arrow diagonal />
                  </span>
                </button>
                <div className="service-meta">{service.detail}</div>
                <h3>
                  <button onClick={() => setBooking(service.name)}>
                    {service.name}
                  </button>
                </h3>
                <p>{service.description}</p>
              </article>
            ))}
          </div>
          <p className="service-footnote">
            <Spark /> Cada servicio incluye preparación, cuidado de cutícula y
            mucho amor.
          </p>
        </section>
        <section className="studio-section" id="estudio">
          <div className="studio-photo">
            <img
              src="/images/red-polish.webp"
              alt="Esmalte rojo intenso junto a una rosa sobre satén rojo"
              loading="lazy"
            />
            <div className="photo-note">Beauty is in the little things.</div>
          </div>
          <div className="studio-copy">
            <span className="eyebrow">02 / BIENVENIDA A TU ESPACIO</span>
            <h2>
              Mucho más que
              <br />
              una cita de <em>uñas.</em>
            </h2>
            <p>
              Creemos en la magia de los pequeños rituales. En una buena
              conversación, una pausa sin prisas y ese color que te cambia el
              día.
            </p>
            <p>
              En Marlene, cada detalle tiene intención. Escuchamos tu estilo,
              cuidamos tus manos y creamos algo que se sienta auténticamente tú.
            </p>
            <div className="studio-signature">
              Con amor, Marlene <span>♡</span>
            </div>
            <div className="studio-principles">
              <span>
                <Spark /> Cuidado consciente
              </span>
              <span>
                <Spark /> Arte personalizado
              </span>
            </div>
          </div>
        </section>
        <section className="section gallery-section" id="galeria">
          <div className="section-heading">
            <div>
              <span className="eyebrow">03 / HECHAS PARA ROBAR MIRADAS</span>
              <h2>
                Un poco de <em>nuestro arte.</em>
              </h2>
            </div>
            <span className="gallery-note">
              Tu próxima inspiración está aquí. <Arrow diagonal />
            </span>
          </div>
          <div className="gallery-filters" aria-label="Filtrar galería">
            {['Todos', 'Rojo clásico', 'Gel X', 'Nail art'].map((category) => (
              <button
                key={category}
                className={filter === category ? 'active' : ''}
                aria-pressed={filter === category}
                onClick={() => setFilter(category)}
              >
                {category}
              </button>
            ))}
          </div>
          <div className="gallery-grid">
            {works
              .filter((work) => filter === 'Todos' || work.category === filter)
              .map((work) => (
                <button
                  className={`gallery-item ${work.className}`}
                  key={work.title}
                  onClick={() => setLightbox(work)}
                  aria-label={`Ampliar ${work.title}`}
                >
                  <img src={work.image} alt={work.title} loading="lazy" />
                  <span>
                    {work.title}
                    <Arrow diagonal />
                  </span>
                </button>
              ))}
          </div>
          <p className="gallery-disclaimer">
            Imágenes de inspiración creadas para nuestro universo rojo.
          </p>
        </section>
        <section className="experience-section" id="experiencia">
          <span className="eyebrow">04 / LO MÁS BONITO ES CÓMO TE SIENTES</span>
          <Spark />
          <h2>
            Las uñas enamoran.
            <br />
            <em>La experiencia se queda.</em>
          </h2>
          <div className="review-stars" aria-label="5 de 5 estrellas">
            ★★★★★
          </div>
          <blockquote key={review}>“{reviews[review].quote}”</blockquote>
          <span className="review-name">{reviews[review].name}</span>
          <span className="review-service">
            {reviews[review].service} · Reseña ilustrativa
          </span>
          <div className="review-pagination">
            {reviews.map((item, index) => (
              <button
                key={item.name}
                className={review === index ? 'active' : ''}
                onClick={() => setReview(index)}
                aria-label={`Leer reseña ${index + 1}`}
                aria-pressed={review === index}
              />
            ))}
          </div>
        </section>
        <section className="booking-banner">
          <div>
            <span className="eyebrow">TE MERECES ESTE MOMENTO</span>
            <h2>
              Tu próximo crush.
              <br />
              <em>Tus propias uñas.</em>
            </h2>
          </div>
          <div className="booking-banner-action">
            <button
              className="button button-cream"
              onClick={() => setBooking('Manicura en gel')}
            >
              Hagamos algo bonito <Arrow diagonal />
            </button>
            <p>Elige tu ritual. Nosotras ponemos el amor.</p>
          </div>
          <Spark className="banner-spark" />
        </section>
      </main>
      <footer className="footer">
        <div className="footer-top">
          <a className="wordmark" href="#">
            marlene<span className="logo-star">✳</span>
            <small>NAILS STUDIO</small>
          </a>
          <span>
            Un espacio para ti.
            <br />
            Arte para tus manos.
          </span>
          <nav aria-label="Navegación del pie">
            <a href="#servicios">Servicios</a>
            <a href="#estudio">El estudio</a>
            <a href="#galeria">Nuestro arte</a>
            <button onClick={() => setBooking('Manicura en gel')}>
              Reserva tu cita <Arrow diagonal />
            </button>
          </nav>
        </div>
        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} Marlene Nails Studio.</span>
          <span>
            HECHO CON AMOR, HASTA EL ÚLTIMO DETALLE{' '}
            <span className="footer-heart">♡</span>
          </span>
          <a href="#main">Volver arriba ↑</a>
        </div>
      </footer>
      {booking && (
        <BookingModal
          initialService={booking}
          onClose={() => setBooking(null)}
        />
      )}
      {lightbox && (
        <Modal label={lightbox.title} onClose={() => setLightbox(null)}>
          <div className="lightbox">
            <img src={lightbox.image} alt={lightbox.title} />
            <div>
              <h3>{lightbox.title}</h3>
              <p>{lightbox.category} · The red edit</p>
              <button
                className="text-link"
                onClick={() => {
                  setLightbox(null)
                  setBooking('Nail art a tu medida')
                }}
              >
                Quiero inspirarme en este look <Arrow diagonal />
              </button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}

function BookingModal({
  initialService,
  onClose,
}: {
  initialService: string
  onClose: () => void
}) {
  return (
    <Modal label="Agenda tu cita en Marlene" onClose={onClose}>
      <BookingForm initialService={initialService} onClose={onClose} />
    </Modal>
  )
}
