import { Link } from 'react-router-dom'
import { estadoStock, formatearPesos } from '../../utils/formato.js'
import { InsigniaEstado } from '../ui/InsigniaEstado.jsx'

const obtenerVarianteEstado = (estado) => {
  const norm = estado.toLowerCase()
  if (norm === 'ok') return 'stock-ok'
  if (norm === 'bajo') return 'stock-bajo'
  return 'stock-critico'
}

export function TablaStock({ productos, solicitudes, alSolicitar }) {
  const yaSolicitados = solicitudes
    .filter((s) => s.estado === 'Pendiente')
    .map((s) => s.codigo)

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-[#f3f6fa] text-left text-xs uppercase text-[#4a5c73]">
            <th className="border-b border-[#eef2f7] px-3 py-2.5">Código</th>
            <th className="border-b border-[#eef2f7] px-3 py-2.5">Producto</th>
            <th className="border-b border-[#eef2f7] px-3 py-2.5">Precio</th>
            <th className="border-b border-[#eef2f7] px-3 py-2.5">Stock</th>
            <th className="border-b border-[#eef2f7] px-3 py-2.5">Mínimo</th>
            <th className="border-b border-[#eef2f7] px-3 py-2.5">Estado</th>
            <th className="border-b border-[#eef2f7] px-3 py-2.5 text-right">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody>
          {productos.map((producto) => {
            const estado = estadoStock(producto)
            return (
              <tr
                key={producto.codigo}
                className="border-b border-[#eef2f7] hover:bg-slate-50/70"
              >
                <td className="px-3 py-2.5 font-mono text-xs font-semibold text-[#1d3963]">
                  {producto.codigo}
                </td>
                <td className="px-3 py-2.5 font-medium text-slate-800">
                  {producto.nombre}
                </td>
                <td className="px-3 py-2.5 text-slate-700">
                  {formatearPesos(producto.precio)}
                </td>
                <td className="px-3 py-2.5 font-semibold text-slate-900">
                  {producto.stock}
                </td>
                <td className="px-3 py-2.5 font-semibold text-slate-600">
                  {producto.minimo}
                </td>
                <td className="px-3 py-2.5">
                  <InsigniaEstado variante={obtenerVarianteEstado(estado)}>
                    {estado}
                  </InsigniaEstado>
                  {yaSolicitados.includes(producto.codigo) && (
                    <InsigniaEstado variante="solicitado" className="ml-1.5">
                      Solicitado
                    </InsigniaEstado>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      className="cursor-pointer rounded-md border border-[#2358b9] bg-white px-3 py-1.5 text-xs font-semibold text-[#2358b9] transition hover:bg-[#eef4fc]"
                      onClick={() =>
                        alSolicitar && alSolicitar(producto.codigo)
                      }
                    >
                      Solicitar
                    </button>
                    {producto.id && (
                      <Link
                        to={`/administradora/productos/${producto.id}/editar`}
                        className="rounded-md bg-[#eef4fc] px-2.5 py-1.5 text-xs font-semibold text-[#1d3963] no-underline transition hover:bg-[#dce8f8]"
                      >
                        Editar
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default TablaStock
