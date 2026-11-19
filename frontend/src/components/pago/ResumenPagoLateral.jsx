import { formatearPesos } from '../../utils/formato.js'

export function ResumenPagoLateral({
  tituloProducto,
  descripcionPedido,
  total,
}) {
  return (
    <aside className="w-full lg:w-80">
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
        <div className="flex flex-col gap-2">
          <h2 className="text-lg font-bold text-slate-900">{tituloProducto}</h2>
          <p className="text-xs leading-relaxed text-slate-500">
            {descripcionPedido}
          </p>
          <div className="mt-1 text-xl font-extrabold text-slate-900">
            {formatearPesos(total)}
          </div>
        </div>

        <div className="my-5 h-px bg-slate-200" />

        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-600">Total</span>
          <span className="text-xl font-extrabold text-[#009688]">
            {formatearPesos(total)}
          </span>
        </div>
      </div>
    </aside>
  )
}

export default ResumenPagoLateral
