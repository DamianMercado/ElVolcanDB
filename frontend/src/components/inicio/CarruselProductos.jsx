import { useRef } from 'react'
import { Link } from 'react-router-dom'
import { TarjetaProducto } from '../productos/TarjetaProducto.jsx'
import { EsqueletoTarjetaProducto } from '../ui/Esqueleto.jsx'

export function CarruselProductos({
  titulo,
  subtitulo,
  productos = [],
  cargando = false,
  alAgregar,
  rutaVerTodos = '/productos',
  textoVerTodos = 'Ver todos',
  mensajeVacio = 'No encontramos productos disponibles en esta categoría por el momento.',
}) {
  const pistaRef = useRef(null)

  const desplazar = (direccion) => {
    const pista = pistaRef.current
    if (!pista) return
    const paso = Math.max(pista.clientWidth * 0.78, 280)
    pista.scrollBy({
      left: direccion * paso,
      behavior: 'smooth',
    })
  }

  return (
    <section className="mx-auto w-full max-w-6xl px-5 py-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            {titulo}
          </h2>
          {subtitulo && (
            <p className="mt-1 text-sm text-white/70 sm:text-base">
              {subtitulo}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden items-center gap-2 sm:flex">
            <button
              type="button"
              onClick={() => desplazar(-1)}
              aria-label={`Desplazar ${titulo} hacia la izquierda`}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-[#FF4500] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A8E8]"
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
              onClick={() => desplazar(1)}
              aria-label={`Desplazar ${titulo} hacia la derecha`}
              className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-white/12 text-white transition hover:bg-[#FF4500] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00A8E8]"
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
          </div>

          <Link
            to={rutaVerTodos}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#00A8E8]/15 px-4 py-2 text-xs font-bold text-[#67D4FA] no-underline transition hover:bg-[#00A8E8]/25 hover:text-white sm:text-sm"
          >
            <span>{textoVerTodos}</span>
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>

      {cargando ? (
        <div
          role="status"
          aria-label={`Cargando ${titulo}`}
          className="ocultar-scrollbar flex gap-5 overflow-x-auto pb-2"
        >
          {[0, 1, 2].map((indice) => (
            <div
              key={indice}
              className="w-[82%] shrink-0 snap-start sm:w-[46%] lg:w-[31.5%]"
            >
              <EsqueletoTarjetaProducto />
            </div>
          ))}
        </div>
      ) : productos.length === 0 ? (
        <div className="rounded-2xl bg-[#0D2B4A]/70 px-6 py-10 text-center text-sm text-white/75">
          {mensajeVacio}
        </div>
      ) : (
        <div
          ref={pistaRef}
          className="ocultar-scrollbar flex snap-x snap-mandatory gap-5 overflow-x-auto pt-1 pb-4"
        >
          {productos.map((prod) => (
            <div
              key={prod.codigo || prod.id}
              className="w-[82%] shrink-0 snap-start sm:w-[46%] lg:w-[31.5%]"
            >
              <TarjetaProducto producto={prod} alAgregar={alAgregar} />
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default CarruselProductos
