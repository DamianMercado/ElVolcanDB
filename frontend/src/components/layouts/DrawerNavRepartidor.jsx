import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../../context/Carrito.jsx'
import { useSesion } from '../../context/Sesion.jsx'

const logoVolcan =
  'https://res.cloudinary.com/hsr9lgyw/image/upload/elVolcan.svg'

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
              <p className="text-[10px] text-[#2171ec] font-semibold italic">
                Gas a la puerta de tu hogar
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={alCerrar}
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20"
            title="Cerrar Menú"
          >
            ✕
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
              <p className="text-xs text-emerald-400 font-semibold">
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
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-left font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            <span className="text-base">🏠</span>
            <span>Inicio</span>
          </button>

          <button
            type="button"
            onClick={() => irA('/productos')}
            className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-left font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            <span className="text-base">📦</span>
            <span>Catálogo de Productos</span>
          </button>

          <button
            type="button"
            onClick={() => irA('/creacion-pedido')}
            className="flex w-full cursor-pointer items-center justify-between rounded-xl px-3.5 py-2.5 text-left font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            <div className="flex items-center gap-3">
              <span className="text-base">🛒</span>
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
              className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-left font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              <span className="text-base">📍</span>
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
            className="flex w-full items-center justify-between rounded-xl bg-emerald-600/30 border border-emerald-400/40 px-3.5 py-2.5 text-left font-bold text-emerald-300"
          >
            <div className="flex items-center gap-3">
              <span className="text-base">🚚</span>
              <span>Modo Repartidor GPS</span>
            </div>
            <span className="rounded-md bg-emerald-500 px-1.5 py-0.5 text-[10px] font-extrabold text-white uppercase">
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
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-left font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                <span className="text-base">⚙️</span>
                <span>Panel Administradora</span>
              </button>

              <button
                type="button"
                onClick={() => irA('/administradora/productos')}
                className="flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-left font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
              >
                <span className="text-base">📋</span>
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
              className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/20 px-4 py-2.5 text-xs font-bold text-red-300 transition hover:bg-red-500/30 hover:text-white"
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
