import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const IMAGEN_CILINDRO_5 =
  'https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/CL001.webp'
const IMAGEN_CILINDRO_11 =
  'https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/CL002.webp'
const IMAGEN_CILINDRO_15 =
  'https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/CL003.webp'
const IMAGEN_MANGUERA =
  'https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/MG001.webp'
const IMAGEN_KIT =
  'https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/KC004.webp'
const IMAGEN_REGULADOR =
  'https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/RG001.webp'
const IMAGEN_DETECTOR =
  'https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/AC003.webp'

const ES_ENTORNO_PRUEBA =
  typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test'

const DIAPOSITIVAS = [
  {
    id: 'despacho-principal',
    insignia: 'Despacho a domicilio rápido y seguro',
    titulo: 'Llevamos tu pedido de gas directo a tu hogar',
    descripcion:
      'Cilindros de gas licuado, reguladores y mangueras certificadas con despacho por zonas y seguimiento GPS en tiempo real.',
    etiquetaCta: 'Haz tu pedido online',
    ruta: '/productos',
    etiquetaSecundaria: 'Ver Cilindros',
    rutaSecundaria: '/productos?categoria=Cilindros',
    fondo: 'from-[#071B30] via-[#0E3156] to-[#174673]',
    productosVisuales: [
      { src: IMAGEN_REGULADOR, alt: 'Regulador doméstico', etiqueta: 'Regulador' },
      { src: IMAGEN_CILINDRO_15, alt: 'Cilindro 15 kg', etiqueta: 'Gas 15 kg' },
      { src: IMAGEN_MANGUERA, alt: 'Manguera gas 1.5 m', etiqueta: 'Manguera' },
    ],
  },
  {
    id: 'cilindros-hogar',
    insignia: 'Energía para tu hogar y negocio',
    titulo: 'Cilindros de Gas GLP en todos los formatos',
    descripcion:
      'Recargas certificadas de 5, 11, 15 y 45 kg con despacho rápido por zonas y pago protegido con Webpay.',
    etiquetaCta: 'Ver Cilindros',
    ruta: '/productos?categoria=Cilindros',
    etiquetaSecundaria: 'Ver catálogo completo',
    rutaSecundaria: '/productos',
    fondo: 'from-[#06182B] via-[#0D2E50] to-[#174673]',
    productosVisuales: [
      { src: IMAGEN_CILINDRO_5, alt: 'Cilindro 5 kg', etiqueta: '5 kg' },
      { src: IMAGEN_CILINDRO_11, alt: 'Cilindro 11 kg', etiqueta: '11 kg' },
      { src: IMAGEN_CILINDRO_15, alt: 'Cilindro 15 kg', etiqueta: '15 kg' },
    ],
  },
  {
    id: 'seguridad-kits',
    insignia: 'Instalación segura y certificada SEC',
    titulo: 'Reguladores, Mangueras y Kits Completos',
    descripcion:
      'Todo lo que necesitas para renovar tu conexión de gas con máxima seguridad y respaldo profesional.',
    etiquetaCta: 'Explorar Kits y Accesorios',
    ruta: '/productos?categoria=Kits',
    etiquetaSecundaria: 'Ver Reguladores',
    rutaSecundaria: '/productos?categoria=Reguladores',
    fondo: 'from-[#081F36] via-[#12385E] to-[#0A2540]',
    productosVisuales: [
      { src: IMAGEN_KIT, alt: 'Kit conexión completo', etiqueta: 'Kit SEC' },
      { src: IMAGEN_REGULADOR, alt: 'Regulador doméstico', etiqueta: 'Regulador' },
      { src: IMAGEN_DETECTOR, alt: 'Detector de gas', etiqueta: 'Detector' },
    ],
  },
]

export function CarruselHero() {
  const navigate = useNavigate()
  const [indiceActivo, setIndiceActivo] = useState(0)
  const [pausado, setPausado] = useState(false)

  const total = DIAPOSITIVAS.length

  const irAnterior = () => {
    setIndiceActivo((prev) => (prev - 1 + total) % total)
  }

  const irSiguiente = () => {
    setIndiceActivo((prev) => (prev + 1) % total)
  }

  useEffect(() => {
    if (pausado || ES_ENTORNO_PRUEBA) return undefined
    const temporizador = setInterval(() => {
      setIndiceActivo((prev) => (prev + 1) % total)
    }, 6500)
    return () => clearInterval(temporizador)
  }, [pausado, total])

  return (
    <header
      className="relative w-full overflow-hidden bg-[#06182B]"
      aria-roledescription="carousel"
      aria-label="Promociones principales de El Volcán"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
    >
      <div
        className="flex transition-transform duration-500 ease-out"
        style={{ transform: `translateX(-${indiceActivo * 100}%)` }}
      >
        {DIAPOSITIVAS.map((slide, indiceSlide) => {
          const TituloTag = indiceSlide === 0 ? 'h1' : 'h2'
          return (
            <div
              key={slide.id}
              className={`relative flex min-h-[300px] w-full shrink-0 items-center bg-gradient-to-r py-10 sm:min-h-[370px] sm:py-12 md:min-h-[420px] lg:min-h-[450px] ${slide.fondo}`}
            >
              <div
                className="pointer-events-none absolute -top-24 -right-24 h-80 w-80 rounded-full bg-[#00A8E8]/15 blur-3xl"
                aria-hidden="true"
              />
              <div
                className="pointer-events-none absolute -bottom-24 left-1/4 h-72 w-72 rounded-full bg-[#FF4500]/15 blur-3xl"
                aria-hidden="true"
              />

              <div className="relative z-10 mx-auto grid w-full max-w-6xl grid-cols-1 items-center gap-6 px-14 sm:px-16 md:grid-cols-12">
                <div className="text-left md:col-span-7">
                  <span className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#00A8E8]/15 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-[#67D4FA] sm:text-xs">
                    {slide.insignia}
                  </span>
                  <TituloTag className="text-2xl font-extrabold leading-tight tracking-tight text-white sm:text-3xl md:text-4xl lg:text-5xl">
                    {slide.titulo}
                  </TituloTag>
                  <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80 md:text-base">
                    {slide.descripcion}
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3 pb-4 sm:pb-0">
                    <button
                      type="button"
                      onClick={() => navigate(slide.ruta)}
                      className="cursor-pointer rounded-xl bg-gradient-to-r from-[#FF5A1F] via-[#FF4500] to-[#D83A00] px-5 py-2.5 text-xs font-bold text-white shadow-[0_8px_20px_rgba(255,69,0,0.38)] transition hover:-translate-y-0.5 hover:from-[#FF6B35] hover:to-[#E03D00] sm:px-6 sm:py-3 sm:text-sm"
                    >
                      {slide.etiquetaCta}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(slide.rutaSecundaria)}
                      className="cursor-pointer rounded-xl bg-white/15 px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-white/25 sm:px-5 sm:py-3 sm:text-sm"
                    >
                      {slide.etiquetaSecundaria}
                    </button>
                  </div>
                </div>

                <div className="hidden items-end justify-center gap-4 md:col-span-5 md:flex">
                  {slide.productosVisuales.map((prod, idx) => (
                    <div
                      key={prod.etiqueta}
                      className={`flex flex-col items-center rounded-2xl bg-[#F7F9FC] p-3 shadow-[0_14px_30px_rgba(0,0,0,0.4)] transition ${
                        idx === 1 ? '-translate-y-3 scale-105' : 'opacity-95'
                      }`}
                    >
                      <img
                        src={prod.src}
                        alt={prod.alt}
                        className="h-24 w-20 object-contain brightness-[1.05] contrast-[1.04] mix-blend-multiply lg:h-32 lg:w-24"
                      />
                      <span className="mt-1.5 rounded-full bg-[#0A2540] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                        {prod.etiqueta}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Flechas de navegación */}
      <button
        type="button"
        onClick={irAnterior}
        aria-label="Banner anterior"
        className="absolute top-1/2 left-3 z-20 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[#0A2540]/75 text-white shadow-md backdrop-blur-xs transition hover:bg-[#FF4500] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A8E8] sm:left-5 sm:h-11 sm:w-11"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M15 18l-6-6 6-6" />
        </svg>
      </button>

      <button
        type="button"
        onClick={irSiguiente}
        aria-label="Siguiente banner"
        className="absolute top-1/2 right-3 z-20 flex h-9 w-9 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-[#0A2540]/75 text-white shadow-md backdrop-blur-xs transition hover:bg-[#FF4500] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A8E8] sm:right-5 sm:h-11 sm:w-11"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-5 w-5"
          aria-hidden="true"
        >
          <path d="M9 18l6-6-6-6" />
        </svg>
      </button>

      {/* Indicadores */}
      <div className="absolute inset-x-0 bottom-4 z-20 flex items-center justify-center gap-2">
        {DIAPOSITIVAS.map((slide, idx) => {
          const activo = idx === indiceActivo
          return (
            <button
              key={slide.id}
              type="button"
              onClick={() => setIndiceActivo(idx)}
              aria-label={`Ir a diapositiva ${idx + 1}: ${slide.titulo}`}
              aria-current={activo ? 'true' : undefined}
              className={`h-2.5 cursor-pointer rounded-full transition-all duration-300 ${
                activo
                  ? 'w-8 bg-[#FF4500] shadow-[0_0_10px_rgba(255,69,0,0.6)]'
                  : 'w-2.5 bg-white/50 hover:bg-white/85'
              }`}
            />
          )
        })}
      </div>
    </header>
  )
}

export default CarruselHero
