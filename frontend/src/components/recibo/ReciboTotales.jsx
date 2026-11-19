import { formatearPesos } from '../../utils/formato.js'

export function ReciboTotales({
  pedido,
  esPagado,
  esEfectivo,
  esTarjetaRepartidor,
}) {
  return (
    <>
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col justify-between gap-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 text-xs">
            <span className="mb-1 block font-bold text-[#0A2540]">
              Observaciones / Instrucciones:
            </span>
            <div className="text-slate-700">
              {pedido.direccionDetalle?.observacion ? (
                <p>
                  <strong>Indicaciones de entrega:</strong>{' '}
                  {pedido.direccionDetalle.observacion}
                </p>
              ) : (
                <p>Sin observaciones adicionales.</p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-xs font-extrabold tracking-wide text-[#0A2540]">
              GRACIAS POR SU PREFERENCIA
            </p>
            <div className="flex flex-wrap gap-2 text-[11px] font-mono">
              <span
                className={`rounded border px-2 py-1 ${
                  esEfectivo
                    ? 'border-[#2358b9] bg-blue-50 font-bold text-[#2358b9]'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                [{esEfectivo ? 'X' : ' '}] EFECTIVO
              </span>
              <span
                className={`rounded border px-2 py-1 ${
                  esTarjetaRepartidor
                    ? 'border-[#2358b9] bg-blue-50 font-bold text-[#2358b9]'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                [{esTarjetaRepartidor ? 'X' : ' '}] TARJETA AL REPARTIDOR (POS)
              </span>
              <span
                className={`rounded border px-2 py-1 ${
                  esPagado
                    ? 'border-[#2358b9] bg-blue-50 font-bold text-[#2358b9]'
                    : 'border-slate-200 text-slate-500'
                }`}
              >
                [{esPagado ? 'X' : ' '}] WEBPAY / EN LÍNEA
              </span>
            </div>
          </div>
        </div>

        <div>
          <table className="w-full border-collapse border border-slate-200 text-xs">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 px-3 py-2 font-bold text-[#0A2540]">
                  SUBTOTAL
                </td>
                <td className="px-3 py-2 text-right font-semibold text-slate-800">
                  {formatearPesos(pedido.total)}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 px-3 py-2 font-bold text-[#0A2540]">
                  ENVÍO / MANIPULACIÓN
                </td>
                <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                  GRATIS
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 px-3 py-2 font-bold text-[#0A2540]">
                  IMPUESTO (IVA INCL.)
                </td>
                <td className="px-3 py-2 text-right font-medium text-slate-600">
                  INCLUIDO
                </td>
              </tr>
              <tr className="border-b border-slate-200 bg-[#0A2540] text-white">
                <td className="px-3 py-2.5 text-sm font-extrabold">TOTAL</td>
                <td className="px-3 py-2.5 text-right text-sm font-extrabold">
                  {formatearPesos(pedido.total)}
                </td>
              </tr>
              {esEfectivo && (
                <>
                  <tr className="border-b border-slate-200">
                    <td className="bg-slate-100 px-3 py-2 font-bold text-[#0A2540]">
                      IMPORTE RECIBIDO
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-slate-800">
                      {formatearPesos(pedido.montoPaga || pedido.total)}
                    </td>
                  </tr>
                  <tr>
                    <td className="bg-slate-100 px-3 py-2 font-bold text-[#0A2540]">
                      VUELTO A ENTREGAR
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-slate-800">
                      {formatearPesos(pedido.vuelto || 0)}
                    </td>
                  </tr>
                </>
              )}
              {esPagado && (
                <tr>
                  <td className="bg-slate-100 px-3 py-2 font-bold text-[#0A2540]">
                    IMPORTE PAGADO
                  </td>
                  <td className="px-3 py-2 text-right font-bold text-emerald-700">
                    {formatearPesos(pedido.total)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-6 text-center text-xs text-slate-500">
        <p>
          Si tiene preguntas relacionadas con este recibo, comuníquese con Mesa
          de Ayuda: (02) 2800 4000, contacto@el-volcan.cl
        </p>
        <p className="mt-0.5 font-bold text-[#0A2540]">www.el-volcan.cl</p>
      </div>
    </>
  )
}

export default ReciboTotales
