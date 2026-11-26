import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ListarProductos } from '../service/productoService.js'
import { useCarrito } from '../context/Carrito.jsx'
import { CarruselHero } from '../components/inicio/CarruselHero.jsx'
import { CarruselProductos } from '../components/inicio/CarruselProductos.jsx'
import { FiltroCategorias } from '../components/productos/FiltroCategorias.jsx'
import { BannerAlerta } from '../components/ui/BannerAlerta.jsx'
import { esperarEsqueleto } from '../components/ui/Esqueleto.jsx'

const IMAGEN_PROMO_CILINDRO =
  'https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/CL003.webp'
const IMAGEN_PROMO_KIT =
  'https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/KC004.webp'

const BENEFICIOS = [
  {
    id: 'despacho',
    titulo: 'Despacho a domicilio',
    descripcion: 'Entrega rápida por zonas con cobertura en toda la ciudad.',
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path d="M3 6h11v10H3z" />
        <path d="M14 9h4l3 3v4h-7V9z" />
        <circle cx="7.5" cy="17.5" r="2" />
        <circle cx="17.5" cy="17.5" r="2" />
      </svg>
    ),
  },
  {
    id: 'pago',
    titulo: 'Pago seguro Webpay',
    descripcion: 'Compra con débito o crédito con confirmación inmediata.',
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <rect x="3" y="5" width="18" height="14" rx="2.5" />
        <path d="M3 10h18" />
        <path d="M7 15h4" />
      </svg>
    ),
  },
  {
    id: 'seguridad',
    titulo: 'Certificación SEC',
    descripcion: 'Cilindros, reguladores y mangueras bajo normativa vigente.',
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path d="M12 3l7 3v5c0 4.5-3 8.2-7 10-4-1.8-7-5.5-7-10V6l7-3z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    id: 'gps',
    titulo: 'Seguimiento en vivo',
    descripcion: 'Sigue la ubicación real de tu repartidor hasta tu puerta.',
    icono: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-6 w-6"
        aria-hidden="true"
      >
        <path d="M12 21s-6.5-5.7-6.5-11A6.5 6.5 0 0 1 18.5 10c0 5.3-6.5 11-6.5 11z" />
        <circle cx="12" cy="10" r="2.3" />
      </svg>
    ),
  },
]

export function Inicio() {
  const { agregarAlCarrito } = useCarrito()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [categoriaActiva, setCategoriaActiva] = useState('todos')
  const [avisoError, setAvisoError] = useState('')

  useEffect(() => {
    let montado = true
    Promise.all([ListarProductos(), esperarEsqueleto()])
      .then(([datos]) => {
        if (montado && Array.isArray(datos)) {
          setProductos(datos)
          setAvisoError('')
        }
      })
      .catch(async (err) => {
        await esperarEsqueleto()
        if (montado) {
          setAvisoError(
            err?.message ||
              'En este momento no pudimos cargar los productos destacados.'
          )
        }
      })
      .finally(() => {
        if (montado) {
          setCargando(false)
        }
      })
    return () => {
      montado = false
    }
  }, [])

  // Ordenar cilindros primero en la vista general para mostrar lo más pedido al inicio
  const productosOrdenados = useMemo(() => {
    return [...productos].sort((a, b) => {
      const esCilA = String(a.categoria || '').toLowerCase() === 'cilindros'
      const esCilB = String(b.categoria || '').toLowerCase() === 'cilindros'
      if (esCilA && !esCilB) return -1
      if (!esCilA && esCilB) return 1
      return 0
    })
  }, [productos])

  const productosDestacados = useMemo(() => {
    if (categoriaActiva === 'todos') return productosOrdenados
    return productosOrdenados.filter(
      (p) =>
        String(p.categoria || '').toLowerCase() ===
        categoriaActiva.toLowerCase()
    )
  }, [productosOrdenados, categoriaActiva])

  const productosSeguridadYAccesorios = useMemo(() => {
    return productos.filter(
      (p) => String(p.categoria || '').toLowerCase() !== 'cilindros'
    )
  }, [productos])

  const tituloPrincipal =
    categoriaActiva === 'todos'
      ? 'Productos Destacados'
      : `Categoría: ${categoriaActiva}`

  const subtituloPrincipal =
    categoriaActiva === 'todos'
      ? 'Explora nuestros cilindros de gas y accesorios más solicitados'
      : `Descubre nuestra selección disponible en ${categoriaActiva}`

  const rutaVerCategoria =
    categoriaActiva === 'todos'
      ? '/productos'
      : `/productos?categoria=${encodeURIComponent(categoriaActiva)}`

  return (
    <div className="flex w-full flex-1 flex-col bg-gradient-to-b from-[#0A2540] via-[#0F3154] to-[#113a63]">
      {/* 1. Header con carrusel de imágenes (usando el banner principal del index) */}
      <CarruselHero />

      {/* 2. Barra de categorías a ancho completo */}
      <FiltroCategorias
        categoriaActiva={categoriaActiva}
        alCambiarCategoria={setCategoriaActiva}
      />

      {avisoError && (
        <div className="mx-auto w-full max-w-6xl px-5 pt-6">
          <BannerAlerta mensaje={avisoError} tipo="error" />
        </div>
      )}

      {/* 3. Carrusel principal de productos (reactivo a la categoría seleccionada) */}
      <CarruselProductos
        titulo={tituloPrincipal}
        subtitulo={subtituloPrincipal}
        productos={productosDestacados}
        cargando={cargando}
        alAgregar={agregarAlCarrito}
        rutaVerTodos={rutaVerCategoria}
        textoVerTodos={
          categoriaActiva === 'todos'
            ? 'Ver catálogo completo'
            : `Ver todo en ${categoriaActiva}`
        }
      />

      {/* 4. Banners destacados de tienda (2 columnas) */}
      <section className="mx-auto w-full max-w-6xl px-5 py-4">
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div className="relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#1C4773] via-[#133459] to-[#0B223C] p-6 shadow-[0_14px_30px_-8px_rgba(3,12,24,0.65)]">
            <div className="z-10 max-w-xs">
              <span className="inline-block rounded-md bg-[#FF4500] px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                Más pedido
              </span>
              <h3 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
                Cilindros GLP para cada necesidad
              </h3>
              <p className="mt-1.5 text-sm text-white/75">
                Formatos de 5, 11, 15 y 45 kg listos para despacho inmediato a tu hogar o comercio.
              </p>
              <Link
                to="/productos?categoria=Cilindros"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#00A8E8]/15 px-4 py-2 text-xs font-bold text-[#67D4FA] no-underline transition hover:bg-[#00A8E8]/25 hover:text-white sm:text-sm"
              >
                <span>Ver Cilindros</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="hidden h-40 w-36 shrink-0 items-center justify-center rounded-xl bg-[#F7F9FC] p-1.5 sm:flex">
              <img
                src={IMAGEN_PROMO_CILINDRO}
                alt="Cilindro gas licuado 15 kg"
                className="max-h-full max-w-full object-contain brightness-[1.05] contrast-[1.04] mix-blend-multiply"
              />
            </div>
          </div>

          <div className="relative flex items-center justify-between gap-4 overflow-hidden rounded-2xl bg-gradient-to-br from-[#194068] via-[#113052] to-[#091E36] p-6 shadow-[0_14px_30px_-8px_rgba(3,12,24,0.65)]">
            <div className="z-10 max-w-xs">
              <span className="inline-block rounded-md bg-[#00A8E8]/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#67D4FA]">
                Seguridad garantizada
              </span>
              <h3 className="mt-2 text-xl font-extrabold text-white sm:text-2xl">
                Kits de conexión y reguladores SEC
              </h3>
              <p className="mt-1.5 text-sm text-white/75">
                Equipa tu instalación con mangueras homologadas, reguladores y detectores de gas.
              </p>
              <Link
                to="/productos?categoria=Kits"
                className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-[#00A8E8]/15 px-4 py-2 text-xs font-bold text-[#67D4FA] no-underline transition hover:bg-[#00A8E8]/25 hover:text-white sm:text-sm"
              >
                <span>Explorar Kits</span>
                <span aria-hidden="true">→</span>
              </Link>
            </div>
            <div className="hidden h-40 w-36 shrink-0 items-center justify-center rounded-xl bg-[#F7F9FC] p-1.5 sm:flex">
              <img
                src={IMAGEN_PROMO_KIT}
                alt="Kit conexión completo"
                className="max-h-full max-w-full object-contain brightness-[1.05] contrast-[1.04] mix-blend-multiply"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 5. Segundo carrusel de productos: Accesorios, Reguladores y Seguridad */}
      <CarruselProductos
        titulo="Accesorios, Reguladores y Seguridad"
        subtitulo="Complementa tu pedido con implementos certificados para tu cocina o calefacción"
        productos={productosSeguridadYAccesorios}
        cargando={cargando}
        alAgregar={agregarAlCarrito}
        rutaVerTodos="/productos?categoria=Accesorios"
        textoVerTodos="Ver accesorios"
      />

      {/* 6. Franja de beneficios de compra */}
      <section className="mt-4 w-full bg-[#081D33]/75 py-10">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-4 px-5 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFICIOS.map((beneficio) => (
            <div
              key={beneficio.id}
              className="flex items-start gap-3.5 rounded-2xl bg-gradient-to-b from-[#163A5F]/90 to-[#0D2642]/90 p-5 shadow-md"
            >
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#00A8E8]/15 text-[#67D4FA]">
                {beneficio.icono}
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">
                  {beneficio.titulo}
                </h3>
                <p className="mt-1 text-xs leading-relaxed text-white/65">
                  {beneficio.descripcion}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}

export const Home = Inicio
export default Inicio
