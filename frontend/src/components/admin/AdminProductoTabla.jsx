import { Link } from 'react-router-dom'
import { Miniatura } from '../ui/Miniatura.jsx'
import { InsigniaEstado } from '../ui/InsigniaEstado.jsx'
import { estadoStock, formatearPesos } from '../../utils/formato.js'

const obtenerVarianteEstado = (estado) => {
  const norm = estado.toLowerCase()
  if (norm === 'ok') return 'stock-ok'
  if (norm === 'bajo') return 'stock-bajo'
  return 'stock-critico'
}

export function AdminProductoTabla({
  productos = [],
  confirmandoId = null,
  alSolicitarEliminar,
  alCancelarEliminar,
  alConfirmarEliminar,
  eliminando = false,
}) {
  if (productos.length === 0) {
    return (
      <div className="rounded-[10px] border border-dashed border-[#c5d1e0] bg-white p-10 text-center">
        <p className="text-sm text-[#5b6776]">
          No hay productos registrados que coincidan con tu búsqueda.
        </p>
        <Link
          to="/administradora/productos/nuevo"
          className="mt-3 inline-block rounded-lg bg-[#2358b9] px-4 py-2 text-xs font-semibold text-white no-underline transition hover:bg-[#1b4592]"
        >
          Crear el primer producto
        </Link>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-[10px] border border-[#e3eaf3] bg-white shadow-sm">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="border-b border-[#eef2f7] bg-[#f3f6fa] text-xs font-semibold uppercase tracking-wide text-[#4a5c73]">
          <tr>
            <th className="px-4 py-3">Producto</th>
            <th className="px-4 py-3">Código</th>
            <th className="px-4 py-3">Categoría</th>
            <th className="px-4 py-3">Stock / Mín.</th>
            <th className="px-4 py-3 text-right">Precio</th>
            <th className="px-4 py-3 text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eef2f7]">
          {productos.map((p) => {
            const estado = estadoStock(p)
            const idProducto = p.id ?? p.codigo
            return (
              <tr key={idProducto} className="transition hover:bg-[#f9fbff]">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Miniatura
                      src={p.imagen}
                      nombre={p.nombre}
                      className="h-11 w-11 shrink-0 rounded-lg border border-[#e3eaf3] bg-white object-contain p-1"
                    />
                    <div>
                      <p className="font-semibold text-[#1d3963]">{p.nombre}</p>
                      {p.descripcion && (
                        <p className="line-clamp-1 max-w-xs text-xs text-[#6e7a89]">
                          {p.descripcion}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs font-semibold text-[#2358b9]">
                  {p.codigo}
                </td>
                <td className="px-4 py-3">
                  <span className="inline-block rounded-full bg-[#eef4fc] px-2.5 py-0.5 text-xs font-semibold capitalize text-[#1d3963]">
                    {p.categoria || 'cilindros'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800">
                      {p.stock}
                    </span>
                    <span className="text-xs text-[#6e7a89]">
                      / mín. {p.minimo ?? 10}
                    </span>
                    <InsigniaEstado variante={obtenerVarianteEstado(estado)}>
                      {estado}
                    </InsigniaEstado>
                  </div>
                </td>
                <td className="px-4 py-3 text-right font-bold text-[#1d3963]">
                  {formatearPesos(p.precio)}
                </td>
                <td className="px-4 py-3 text-right">
                  {confirmandoId === idProducto ? (
                    <div className="inline-flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1">
                      <span className="text-xs font-semibold text-[#a12a22]">
                        ¿Eliminar?
                      </span>
                      <button
                        type="button"
                        disabled={eliminando}
                        onClick={() => alConfirmarEliminar(idProducto)}
                        className="cursor-pointer rounded bg-[#d9534f] px-2.5 py-1 text-xs font-bold text-white transition hover:bg-[#b9382c] disabled:opacity-50"
                      >
                        Sí
                      </button>
                      <button
                        type="button"
                        disabled={eliminando}
                        onClick={alCancelarEliminar}
                        className="cursor-pointer rounded border border-[#c5d1e0] bg-white px-2.5 py-1 text-xs font-semibold text-[#4a5c73] transition hover:bg-slate-100"
                      >
                        No
                      </button>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2">
                      <Link
                        to={`/administradora/productos/${idProducto}/editar`}
                        className="rounded-md border border-[#2358b9] bg-white px-3 py-1.5 text-xs font-semibold text-[#2358b9] no-underline transition hover:bg-[#eef4fc]"
                      >
                        Editar
                      </Link>
                      <button
                        type="button"
                        onClick={() => alSolicitarEliminar(idProducto)}
                        className="cursor-pointer rounded-md border border-[#f5c6c4] bg-[#fdecea] px-3 py-1.5 text-xs font-semibold text-[#a12a22] transition hover:bg-[#f9d6d3]"
                      >
                        Eliminar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default AdminProductoTabla
