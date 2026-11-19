import { formatearPesos } from '../../utils/formato.js'

export function ReciboTablaItems({ pedido }) {
  return (
    <div className="mt-6">
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className="w-full border-collapse text-left text-xs">
          <thead>
            <tr className="bg-[#0A2540] text-white">
              <th className="px-3.5 py-2.5 font-bold">N.° DE ARTÍCULO</th>
              <th className="px-3.5 py-2.5 font-bold">DESCRIPCIÓN</th>
              <th className="px-3.5 py-2.5 text-center font-bold">CANTIDAD</th>
              <th className="px-3.5 py-2.5 text-right font-bold">
                PRECIO UNITARIO
              </th>
              <th className="px-3.5 py-2.5 text-right font-bold">TOTAL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {pedido.items && pedido.items.length > 0 ? (
              pedido.items.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="px-3.5 py-2.5 font-mono font-semibold text-slate-700">
                    {it.producto?.codigo || `ART-${idx + 1}`}
                  </td>
                  <td className="px-3.5 py-2.5 font-medium text-slate-900">
                    {it.producto?.nombre || 'Producto de gas'}
                  </td>
                  <td className="px-3.5 py-2.5 text-center font-semibold text-slate-800">
                    {it.cantidad}
                  </td>
                  <td className="px-3.5 py-2.5 text-right text-slate-700">
                    {formatearPesos(it.producto?.precio || 0)}
                  </td>
                  <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                    {formatearPesos(
                      it.subtotal || (it.producto?.precio || 0) * it.cantidad
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-3.5 py-2.5 font-mono font-semibold text-slate-700">
                  EV-001
                </td>
                <td className="px-3.5 py-2.5 font-medium text-slate-900">
                  {pedido.detalle || 'Cilindro de gas'}
                </td>
                <td className="px-3.5 py-2.5 text-center font-semibold text-slate-800">
                  1
                </td>
                <td className="px-3.5 py-2.5 text-right text-slate-700">
                  {formatearPesos(pedido.total)}
                </td>
                <td className="px-3.5 py-2.5 text-right font-bold text-slate-900">
                  {formatearPesos(pedido.total)}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default ReciboTablaItems
