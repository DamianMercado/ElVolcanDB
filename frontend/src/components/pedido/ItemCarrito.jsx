import { formatearPesos } from '../../utils/formato'
import { ControlCantidad } from '../ui/ControlCantidad'

export function ItemCarrito({
  item,
  alDisminuir,
  alAumentar,
  alEliminar,
}) {
  const { producto, cantidad } = item

  return (
    <div className="flex items-center gap-3 rounded-lg border border-white/15 bg-white/10 p-3">
      {producto.imagen && (
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-white p-1">
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="max-h-full max-w-full object-contain"
          />
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <strong className="truncate text-sm font-bold text-white">
          {producto.nombre}
        </strong>
        <span className="text-xs font-bold text-[#00A8E8]">
          {formatearPesos(producto.precio * cantidad)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <ControlCantidad
          cantidad={cantidad}
          alDisminuir={() => alDisminuir(producto.codigo)}
          alAumentar={() => alAumentar(producto.codigo)}
        />

        <button
          type="button"
          onClick={() => alEliminar(producto.codigo)}
          title="Quitar"
          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-red-400/30 bg-red-500/15 text-xs font-bold text-red-300 transition hover:bg-red-500/30 hover:text-white"
        >
          ✕
        </button>
      </div>
    </div>
  )
}

export default ItemCarrito
