import { Link, useLocation } from 'react-router-dom'
import { fechaDeHoy } from '../../utils/formato.js'

export function CabeceraAdminNav({
  titulo = 'Panel de administración',
  subtitulo = `Resumen del día · ${fechaDeHoy()}`,
  accionesDerecha = null,
}) {
  const { pathname } = useLocation()
  const enPanelPrincipal = pathname === '/administradora'
  const enProductos = pathname.startsWith('/administradora/productos')

  return (
    <header className="mb-6 flex flex-col gap-4 border-b border-[#dde5ef] pb-4 md:flex-row md:items-center md:justify-between">
      <div>
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-[#e8eef8] px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-[#2358b9]">
            Flujo de Administración
          </span>
        </div>
        <h2 className="text-2xl font-bold text-[#1d3963]">{titulo}</h2>
        <p className="mt-0.5 text-sm text-[#5b6776]">{subtitulo}</p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <Link
          to="/administradora"
          className={`rounded-lg px-4 py-2 text-sm font-semibold no-underline transition ${
            enPanelPrincipal
              ? 'bg-[#2358b9] text-white shadow-sm'
              : 'border border-[#c5d1e0] bg-white text-[#2358b9] hover:bg-[#f0f5fc]'
          }`}
        >
          Resumen y Operaciones
        </Link>
        <Link
          to="/administradora/productos"
          className={`rounded-lg px-4 py-2 text-sm font-semibold no-underline transition ${
            enProductos
              ? 'bg-[#2358b9] text-white shadow-sm'
              : 'border border-[#c5d1e0] bg-white text-[#2358b9] hover:bg-[#f0f5fc]'
          }`}
        >
          Catálogo de Productos (CRUD)
        </Link>
        {accionesDerecha}
      </div>
    </header>
  )
}

export default CabeceraAdminNav
