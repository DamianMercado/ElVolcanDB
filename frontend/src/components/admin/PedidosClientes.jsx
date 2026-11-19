import { useState } from 'react'
import { InsigniaEstado } from '../ui/InsigniaEstado.jsx'

const obtenerVarianteEstadoPedido = (estado) => {
  const norm = String(estado || '')
    .replace(' ', '-')
    .toLowerCase()
  if (norm === 'entregado') return 'pedido-entregado'
  if (norm === 'en-ruta') return 'pedido-en-ruta'
  return 'pedido-pendiente'
}

export function PedidosClientes({ pedidos, repartidores, alAsignar }) {
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
        </select>
        <span className="text-xs text-[#6e7a89]">
          {pedidosFiltrados.length} pedidos
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="bg-[#f3f6fa] text-left text-xs uppercase text-[#4a5c73]">
              <th className="border-b border-[#eef2f7] px-3 py-2.5">N°</th>
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
            </tr>
          </thead>
          <tbody>
            {pedidosFiltrados.map((pedido) => (
              <tr
                key={pedido.id}
                className="border-b border-[#eef2f7] hover:bg-slate-50/70"
              >
                <td className="px-3 py-2.5 font-semibold text-[#1d3963]">
                  #{pedido.id}
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
              </tr>
            ))}
            {pedidosFiltrados.length === 0 && (
              <tr>
                <td
                  colSpan={6}
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
