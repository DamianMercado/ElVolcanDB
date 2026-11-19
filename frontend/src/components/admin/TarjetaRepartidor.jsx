import { Link } from 'react-router-dom'

export function TarjetaRepartidor({ repartidor, pedidos = [] }) {
  const suyos = pedidos.filter((p) => p.repartidor === repartidor.nombre)
  const entregados = suyos.filter((p) => p.estado === 'Entregado').length
  const enRuta = suyos.length - entregados
  const avance = suyos.length
    ? Math.round((entregados / suyos.length) * 100)
    : 0

  return (
    <div className="rounded-lg border border-[#e3eaf3] bg-[#fafbfd] p-3.5">
      <div className="mb-2.5 flex items-center gap-2.5">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#2358b9] text-sm font-bold text-white">
          {repartidor.iniciales}
        </div>
        <div className="flex flex-col">
          <strong className="text-sm font-bold text-[#1d3963]">
            {repartidor.nombre}
          </strong>
          <small className="text-xs text-[#6e7a89]">{repartidor.ruta}</small>
        </div>
      </div>

      <div
        className="mb-2 h-2 overflow-hidden rounded-full bg-[#e3eaf3]"
        aria-label={`Avance ${avance}%`}
      >
        <div
          className="h-full bg-[#2358b9] transition-all duration-300"
          style={{ width: `${avance}%` }}
        />
      </div>

      <div className="flex items-center justify-between text-xs text-[#5b6776]">
        <span>
          {entregados} de {suyos.length} entregados · {enRuta} en ruta
        </span>
        <Link
          to="/repartidor"
          className="font-bold text-[#2358b9] hover:underline"
        >
          Ver GPS →
        </Link>
      </div>
    </div>
  )
}

export default TarjetaRepartidor
