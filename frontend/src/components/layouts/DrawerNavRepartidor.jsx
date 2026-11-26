import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../../context/Carrito.jsx'
import { useSesion } from '../../context/Sesion.jsx'

const logoVolcan =
  'https://res.cloudinary.com/hsr9lgyw/image/upload/elVolcan.svg'

function IconoMenuDrawer({ tipo }) {
  const acento = '#00A8E8'
  const acentoSuave = 'rgba(0, 168, 232, 0.18)'

  const propsSvg = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'h-5 w-5 shrink-0',
    'aria-hidden': 'true',
  }

  switch (tipo) {
    case 'inicio':
      return (
        <svg {...propsSvg}>
          <path d="M3.5 10.5 12 3.8l8.5 6.7" />
          <path d="M5.5 9.5v9.2a1.3 1.3 0 0 0 1.3 1.3h10.4a1.3 1.3 0 0 0 1.3-1.3V9.5" />
          <rect
            x="9.8"
            y="13.5"
            width="4.4"
            height="6.5"
            rx="0.9"
            stroke={acento}
            fill={acentoSuave}
          />
        </svg>
      )

    case 'productos':
      return (
        <svg {...propsSvg}>
          <path d="M12 3.5 20 7.8v8.4L12 20.5 4 16.2V7.8L12 3.5Z" />
          <path d="M4 7.8 12 12l8-4.2" />
          <path d="M12 12v8.5" />
          <path d="M8 5.7 16 9.9" stroke={acento} />
        </svg>
      )

    case 'carrito':
      return (
        <svg {...propsSvg}>
          <path d="M3.5 5h2.2l2.1 9.5a1.5 1.5 0 0 0 1.5 1.2h8.5a1.5 1.5 0 0 0 1.4-1.1l1.3-5.6H6.6" />
          <circle cx="9.5" cy="19.2" r="1.4" stroke={acento} fill={acentoSuave} />
          <circle cx="17.2" cy="19.2" r="1.4" stroke={acento} fill={acentoSuave} />
        </svg>
      )

    case 'seguimiento':
      return (
        <svg {...propsSvg}>
          <path d="M12 20.5s6-5.3 6-10.2a6 6 0 1 0-12 0c0 4.9 6 10.2 6 10.2Z" />
          <circle cx="12" cy="10.2" r="2.2" stroke={acento} fill={acentoSuave} />
        </svg>
      )

    case 'repartidor':
      return (
        <svg {...propsSvg}>
          <path d="M3.5 7.5h10.5v8.5H3.5V7.5Z" />
          <path d="M14 10h3.6l2.9 3.2V16H14v-6Z" />
          <circle cx="7.5" cy="17.5" r="1.8" stroke={acento} fill={acentoSuave} />
          <circle cx="17" cy="17.5" r="1.8" stroke={acento} fill={acentoSuave} />
        </svg>
      )

    case 'admin':
      return (
        <svg {...propsSvg}>
          <path d="M4 7h16" />
          <path d="M4 12h16" />
          <path d="M4 17h16" />
          <circle cx="9" cy="7" r="2" stroke={acento} fill={acentoSuave} />
          <circle cx="15" cy="12" r="2" stroke={acento} fill={acentoSuave} />
          <circle cx="10.5" cy="17" r="2" stroke={acento} fill={acentoSuave} />
        </svg>
      )

    case 'catalogo-admin':
      return (
        <svg {...propsSvg}>
          <rect x="5" y="4.5" width="14" height="16" rx="2" />
          <path d="M9 4.5V3.8A1.3 1.3 0 0 1 10.3 2.5h3.4A1.3 1.3 0 0 1 15 3.8v.7" />
          <path d="M8.5 10h7" stroke={acento} />
          <path d="M8.5 14h7" />
          <path d="M8.5 17.5h4.5" />
        </svg>
      )

    default:
      return (
        <svg {...propsSvg}>
          <circle cx="12" cy="12" r="7.5" />
          <circle cx="12" cy="12" r="2.2" stroke={acento} fill={acentoSuave} />
        </svg>
      )
  }
}

export function DrawerNavRepartidor({ abierto, alCerrar }) {
  const navigate = useNavigate()
  const { carrito } = useCarrito()
  const { usuario, cerrar } = useSesion()
  const cantidadTotal = carrito.reduce((acc, item) => acc + item.cantidad, 0)
  const rolNormalizado = String(usuario?.rol || usuario?.perfil || '').toLowerCase()
  const esAdmin = Boolean(usuario) && rolNormalizado === 'admin'
  const esCliente = Boolean(usuario) && rolNormalizado === 'cliente'

  if (!abierto) return null

  const nombreVisible = usuario
    ? `${usuario.nombres || usuario.nombre || ''} ${usuario.apellidos || ''}`.trim() ||
      'Repartidor El Volcán'
    : 'Carlos Ruiz (Demo)'
  const iniciales = nombreVisible
    .split(' ')
    .map((p) => p[0] || '')
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const irA = (ruta) => {
    alCerrar()
    navigate(ruta)
  }

  const manejarCerrarSesion = () => {
    cerrar()
    alCerrar()
    navigate('/')
  }

  const claseBotonNav =
    'flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-left font-medium text-white/85 transition hover:bg-white/10 hover:text-white'

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Fondo oscuro semitransparente con desenfoque */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={alCerrar}
        aria-hidden="true"
      />

      {/* Contenedor del Drawer deslizante */}
      <div className="relative z-50 flex h-full w-80 max-w-[85vw] flex-col bg-[#121212] text-white shadow-2xl transition-transform animate-in slide-in-from-left duration-300">
        {/* Cabecera del Drawer */}
        <div className="flex items-center justify-between border-b border-white/10 p-4">
          <div className="flex items-center gap-3">
            <img
              src={logoVolcan}
              alt="El Volcán"
              className="h-9 w-9 object-contain brightness-0 invert"
            />
            <div>
              <span className="text-base font-black tracking-wide text-white">
                El Volcán
              </span>
              <p className="text-[10px] font-semibold text-[#2171ec] italic">
                Gas a la puerta de tu hogar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={alCerrar}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
            title="Cerrar Menú"
            aria-label="Cerrar Menú"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Tarjeta de Identidad del Conductor */}
        <div className="border-b border-white/10 bg-white/5 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#2171ec] text-base font-bold text-white shadow">
              {iniciales}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">
                {nombreVisible}
              </p>
              <p className="text-xs font-semibold text-emerald-400">
                ● Conductor Repartidor Activo
              </p>
              <p className="text-[11px] text-white/50">
                {usuario?.email || 'Furgón Hyundai H-100 (KJ-WP-42)'}
              </p>
            </div>
          </div>
        </div>

        {/* Lista de Navegación del Navbar */}
        <nav className="flex-1 space-y-1 overflow-y-auto p-3 text-sm">
          <div className="px-3 py-1 text-[11px] font-bold tracking-wider text-white/40 uppercase">
            Navegación del Sistema
          </div>

          <button
            type="button"
            onClick={() => irA('/')}
            className={claseBotonNav}
          >
            <IconoMenuDrawer tipo="inicio" />
            <span>Inicio</span>
          </button>

          <button
            type="button"
            onClick={() => irA('/productos')}
            className={claseBotonNav}
          >
            <IconoMenuDrawer tipo="productos" />
            <span>Catálogo de Productos</span>
          </button>

          <button
            type="button"
            onClick={() => irA('/creacion-pedido')}
            className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-left font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <IconoMenuDrawer tipo="carrito" />
              <span>Carrito de Compras</span>
            </div>
            {cantidadTotal > 0 && (
              <span className="rounded-full bg-[#00A8E8] px-2 py-0.5 text-xs font-bold text-white">
                {cantidadTotal}
              </span>
            )}
          </button>

          {esCliente && (
            <button
              type="button"
              onClick={() => irA('/seguimiento')}
              className={claseBotonNav}
            >
              <IconoMenuDrawer tipo="seguimiento" />
              <span>Seguimiento de Clientes</span>
            </button>
          )}

          <div className="my-2 border-t border-white/10" />

          <div className="px-3 py-1 text-[11px] font-bold tracking-wider text-white/40 uppercase">
            Módulo Activo
          </div>

          <button
            type="button"
            onClick={alCerrar}
            className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-left font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <IconoMenuDrawer tipo="repartidor" />
              <span>Modo Repartidor GPS</span>
            </div>
            <span className="rounded-md bg-white/10 px-2 py-0.5 text-[10px] font-bold tracking-wide text-white/75 uppercase">
              En Vivo
            </span>
          </button>

          {esAdmin && (
            <>
              <div className="my-2 border-t border-white/10" />
              <div className="px-3 py-1 text-[11px] font-bold tracking-wider text-white/40 uppercase">
                Administración
              </div>

              <button
                type="button"
                onClick={() => irA('/administradora')}
                className={claseBotonNav}
              >
                <IconoMenuDrawer tipo="admin" />
                <span>Panel Administradora</span>
              </button>

              <button
                type="button"
                onClick={() => irA('/administradora/productos')}
                className={claseBotonNav}
              >
                <IconoMenuDrawer tipo="catalogo-admin" />
                <span>Catálogo Admin</span>
              </button>
            </>
          )}
        </nav>

        {/* Footer del Drawer */}
        <div className="border-t border-white/10 p-4">
          {usuario ? (
            <button
              type="button"
              onClick={manejarCerrarSesion}
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-red-500/20 px-4 py-2.5 text-xs font-bold text-red-300 transition hover:bg-red-500/30 hover:text-white"
            >
              <span>Cerrar Sesión</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => irA('/login')}
                className="flex-1 cursor-pointer rounded-xl bg-white/15 px-3 py-2 text-center text-xs font-bold text-white transition hover:bg-white/25"
              >
                Ingresar
              </button>
              <button
                type="button"
                onClick={() => irA('/register')}
                className="flex-1 cursor-pointer rounded-xl bg-[#00A8E8] px-3 py-2 text-center text-xs font-bold text-white transition hover:bg-[#0090c7]"
              >
                Registrarse
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DrawerNavRepartidor
