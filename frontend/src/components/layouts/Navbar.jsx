import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useCarrito } from '../../context/Carrito.jsx'
import { useSesion } from '../../context/Sesion.jsx'
import { obtenerSesion } from '../../utils/token.js'
import { BotonCarritoNav } from './BotonCarritoNav.jsx'
import { AccionesUsuarioNav } from './AccionesUsuarioNav.jsx'

const logoVolcan =
  'https://res.cloudinary.com/hsr9lgyw/image/upload/elVolcan.svg'

export const Navbar = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { carrito, total } = useCarrito()
  const { cerrar } = useSesion()
  const [menuMovilAbierto, setMenuMovilAbierto] = useState(false)
  const [usuario, setUsuario] = useState(() => obtenerSesion())

  useEffect(() => {
    const sincronizarSesion = () => {
      setUsuario(obtenerSesion())
    }

    window.addEventListener('sesion_cambiada', sincronizarSesion)
    window.addEventListener('storage', sincronizarSesion)
    return () => {
      window.removeEventListener('sesion_cambiada', sincronizarSesion)
      window.removeEventListener('storage', sincronizarSesion)
    }
  }, [location.pathname])

  const cantidadTotal = carrito.reduce((acc, item) => acc + item.cantidad, 0)
  const esAdmin =
    String(usuario?.rol || usuario?.perfil || '').toLowerCase() === 'admin'

  const irA = (ruta) => {
    setMenuMovilAbierto(false)
    navigate(ruta)
  }

  const cerrarSesionActiva = () => {
    cerrar()
    setUsuario(null)
    setMenuMovilAbierto(false)
    navigate('/')
  }

  return (
    <nav className="sticky top-0 z-50 bg-[#0A2540] shadow-md print:hidden">
      <div className="relative flex h-16 w-full items-center justify-between px-5">
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault()
            irA('/')
          }}
          className="flex shrink-0 cursor-pointer items-center gap-3 text-white no-underline select-none"
        >
          <img
            src={logoVolcan}
            alt="El Volcán Logo"
            className="h-11 w-11 shrink-0 object-contain brightness-0 invert"
          />
          <span className="text-xl font-bold tracking-wide text-white">
            El Volcán
          </span>
          <span className="hidden border-l border-white/20 pl-2.5 text-xs italic text-[#00A8E8] xl:inline">
            Gas a la puerta de tu hogar.
          </span>
        </a>

        {/* Grupo derecho Escritorio */}
        <div className="hidden items-center gap-3 md:flex">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => irA('/')}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              Inicio
            </button>
            <button
              type="button"
              onClick={() => irA('/productos')}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              Productos
            </button>
            <button
              type="button"
              onClick={() => irA('/seguimiento')}
              className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              Seguimiento
            </button>
            <button
              type="button"
              onClick={() => irA('/repartidor')}
              className="flex items-center gap-1.5 cursor-pointer rounded-lg bg-emerald-600/30 border border-emerald-400/40 px-2.5 py-1.5 text-xs font-bold whitespace-nowrap text-emerald-300 transition hover:bg-emerald-600/50 hover:text-white"
            >
              <span>🚚 Reparto</span>
            </button>

            {esAdmin && (
              <div className="mx-1.5 flex items-center gap-1.5 border-x border-white/15 px-3">
                <button
                  type="button"
                  onClick={() => irA('/administradora')}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-white/85 transition hover:bg-white/10 hover:text-white"
                >
                  Panel Admin
                </button>
                <button
                  type="button"
                  onClick={() => irA('/administradora/productos')}
                  className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-white/85 transition hover:bg-white/10 hover:text-white"
                >
                  Catálogo Admin
                </button>
              </div>
            )}

            <BotonCarritoNav
              cantidadTotal={cantidadTotal}
              total={total}
              onClick={() => irA('/creacion-pedido')}
            />
          </div>

          <AccionesUsuarioNav
            usuario={usuario}
            alIrA={irA}
            alCerrarSesion={cerrarSesionActiva}
          />
        </div>

        {/* Controles para Móvil */}
        <div className="flex items-center gap-3 md:hidden">
          <BotonCarritoNav
            cantidadTotal={cantidadTotal}
            total={total}
            onClick={() => irA('/creacion-pedido')}
            esMovil
          />

          <button
            type="button"
            className="flex h-5 w-7 cursor-pointer flex-col justify-between bg-transparent p-0"
            onClick={() => setMenuMovilAbierto(!menuMovilAbierto)}
            aria-label="Menú de navegación"
          >
            <span
              className={`block h-0.5 w-full rounded bg-white transition ${
                menuMovilAbierto ? 'translate-y-2 rotate-45' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-full rounded bg-white transition ${
                menuMovilAbierto ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`block h-0.5 w-full rounded bg-white transition ${
                menuMovilAbierto ? '-translate-y-2 -rotate-45' : ''
              }`}
            />
          </button>
        </div>

        {/* Menú Móvil Desplegable */}
        {menuMovilAbierto && (
          <div className="absolute top-16 left-0 z-50 flex w-full flex-col gap-2 border-t border-white/10 bg-[#0A2540] p-5 shadow-2xl md:hidden">
            <button
              type="button"
              onClick={() => irA('/')}
              className="w-full cursor-pointer rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              Inicio
            </button>
            <button
              type="button"
              onClick={() => irA('/productos')}
              className="w-full cursor-pointer rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              Productos
            </button>
            <button
              type="button"
              onClick={() => irA('/seguimiento')}
              className="w-full cursor-pointer rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              Seguimiento de Despacho
            </button>
            <button
              type="button"
              onClick={() => irA('/repartidor')}
              className="w-full cursor-pointer rounded-lg px-3.5 py-2.5 text-left text-sm font-semibold text-emerald-400 transition hover:bg-white/10 hover:text-white"
            >
              🚚 Modo Repartidor (GPS en vivo)
            </button>
            {esAdmin && (
              <div className="flex flex-col gap-1 border-y border-white/15 py-2">
                <button
                  type="button"
                  onClick={() => irA('/administradora')}
                  className="w-full cursor-pointer rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                >
                  Panel Admin
                </button>
                <button
                  type="button"
                  onClick={() => irA('/administradora/productos')}
                  className="w-full cursor-pointer rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
                >
                  Catálogo Admin
                </button>
              </div>
            )}
            <button
              type="button"
              onClick={() => irA('/creacion-pedido')}
              className="w-full cursor-pointer rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              <span>Resumen de Pedido</span>
              {cantidadTotal > 0 && (
                <span className="ml-2 text-xs font-bold text-[#00A8E8]">
                  {`(${cantidadTotal}) $${total.toLocaleString('es-CL')}`}
                </span>
              )}
            </button>

            <AccionesUsuarioNav
              usuario={usuario}
              alIrA={irA}
              alCerrarSesion={cerrarSesionActiva}
              esMovil
            />
          </div>
        )}
      </div>
    </nav>
  )
}

export default Navbar
