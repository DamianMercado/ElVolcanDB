import { useState } from 'react'
import { Link } from 'react-router-dom'
import { InsigniaEstado } from '../ui/InsigniaEstado.jsx'

const obtenerVarianteEstadoPedido = (estado) => {
  const norm = String(estado || '')
    .replace(' ', '-')
    .toLowerCase()
  if (norm === 'entregado') return 'pedido-entregado'
  if (norm === 'en-ruta') return 'pedido-en-ruta'
  if (norm === 'cancelada') return 'stock-critico'
  return 'pedido-pendiente'
}

export function PedidosClientes({ pedidos, repartidores, alAsignar, alCancelar }) {
  const [filtro, setFiltro] = useState('Todos')

  const pedidosFiltrados =
    filtro === 'Todos' ? pedidos : pedidos.filter((p) => p.estado === filtro)

  return (
    <>
      <div className="mb-3 flex flex-wrap items-center gap-2.5 text-sm text-[#4a5c73]">
        <label htmlFor="filtro-estado" className="font-medium">
          Mostrar:
        </label>
        <select
          id="filtro-estado"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          className="rounded-md border border-[#c5d1e0] bg-white px-2.5 py-1.5 text-sm text-slate-800 focus:border-[#2358b9] focus:outline-none"
        >
          <option>Todos</option>
          <option>Pendiente</option>
          <option>En ruta</option>
          <option>Entregado</option>
          <option>Cancelada</option>
        </select>
        <span className="text-xs text-[#6e7a89]">
          {pedidosFiltrados.length} pedidos
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#f3f6fa] text-left text-xs uppercase text-[#4a5c73]">
              <th className="border-b border-[#eef2f7] px-3 py-2.5">Código</th>
              <th className="border-b border-[#eef2f7] px-3 py-2.5">Cliente</th>
              <th className="border-b border-[#eef2f7] px-3 py-2.5">
                Dirección
              </th>
              <th className="border-b border-[#eef2f7] px-3 py-2.5">
                Cilindros / productos
              </th>
              <th className="border-b border-[#eef2f7] px-3 py-2.5">Estado</th>
              <th className="border-b border-[#eef2f7] px-3 py-2.5">
                Repartidor
              </th>
              <th className="border-b border-[#eef2f7] px-3 py-2.5">
                Seguimiento
              </th>
            </tr>
          </thead>
          <tbody>
            {pedidosFiltrados.map((pedido) => (
              <tr
                key={pedido.id}
                className="border-b border-[#eef2f7] hover:bg-slate-50/70"
              >
                <td className="px-3 py-2.5 font-semibold text-[#1d3963]">
                  {pedido.codigo || `#${pedido.id}`}
                </td>
                <td className="px-3 py-2.5 font-medium text-slate-800">
                  {pedido.cliente}
                </td>
                <td className="px-3 py-2.5 text-slate-600">
                  {pedido.direccion}
                </td>
                <td className="px-3 py-2.5 text-slate-700">{pedido.detalle}</td>
                <td className="px-3 py-2.5">
                  <InsigniaEstado
                    variante={obtenerVarianteEstadoPedido(pedido.estado)}
                  >
                    {pedido.estado}
                  </InsigniaEstado>
                </td>
                <td className="px-3 py-2.5">
                  {pedido.repartidor ? (
                    <span className="font-medium text-slate-800">
                      {pedido.repartidor}
                    </span>
                  ) : pedido.estado === 'Cancelada' ? (
                    <span className="text-xs text-slate-400">—</span>
                  ) : (
                    <select
                      defaultValue=""
                      onChange={(e) =>
                        alAsignar && alAsignar(pedido.id, e.target.value)
                      }
                      aria-label={`Asignar repartidor al pedido ${pedido.id}`}
                      className="rounded-md border border-[#c5d1e0] bg-white px-2.5 py-1.5 text-xs text-slate-800 focus:border-[#2358b9] focus:outline-none"
                    >
                      <option value="" disabled>
                        Asignar…
                      </option>
                      {repartidores.map((r) => (
                        <option key={r.nombre} value={r.nombre}>
                          {r.nombre}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-3 py-2.5">
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/seguimiento/${encodeURIComponent(pedido.codigo || pedido.id)}`}
                      className="rounded-md border border-[#2358b9]/30 bg-blue-50 px-2.5 py-1 text-xs font-semibold text-[#2358b9] no-underline transition hover:bg-blue-100"
                    >
                      Ver mapa
                    </Link>
                    {alCancelar &&
                      pedido.estado !== 'Entregado' &&
                      pedido.estado !== 'Cancelada' && (
                        <button
                          type="button"
                          onClick={() => alCancelar(pedido.id)}
                          className="cursor-pointer rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                        >
                          Cancelar
                        </button>
                      )}
                  </div>
                </td>
              </tr>
            ))}
            {pedidosFiltrados.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="py-5 text-center text-sm text-[#7a8696]"
                >
                  No hay pedidos con ese estado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  )
}

export default PedidosClientes
