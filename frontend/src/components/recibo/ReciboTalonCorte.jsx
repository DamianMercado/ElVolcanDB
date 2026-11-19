import { formatearPesos } from '../../utils/formato.js'

export function ReciboTalonCorte({ pedido, numeroRecibo, esPagado }) {
  return (
    <>
      {/* Línea de corte para el talón */}
      <div className="relative my-7 flex items-center justify-center border-t-2 border-dashed border-slate-300">
        <span className="-top-2.5 bg-white px-3 text-[10px] font-bold tracking-widest text-slate-400">
          CORTE AQUÍ
        </span>
      </div>

      {/* Talón de Recepción y Entrega */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="flex flex-col justify-between gap-4 rounded-lg border border-slate-200 p-4 text-xs">
          <div>
            <div className="mb-2 border-b border-slate-200 pb-1.5 font-extrabold text-[#0A2540]">
              CLIENTE / RECEPTOR
            </div>
            <div className="space-y-1 text-slate-700">
              <p>
                <strong>A/A:</strong> {pedido.cliente}
              </p>
              <p>
                <strong>Dirección:</strong> {pedido.direccion}
              </p>
              <p>
                <strong>Teléfono:</strong>{' '}
                {pedido.telefono || 'No especificado'}
              </p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 pt-4">
            <div className="text-center">
              <div className="mb-1.5 border-t border-slate-400" />
              <span className="text-[10px] text-slate-500">
                Firma / RUT Recepción Conforme Cliente
              </span>
            </div>
            <div className="text-center">
              <div className="mb-1.5 border-t border-slate-400" />
              <span className="text-[10px] text-slate-500">
                Firma / Timbre Repartidor
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col justify-between gap-3 rounded-lg border border-slate-200 p-4 text-xs">
          <h2 className="text-sm font-extrabold text-[#0A2540]">
            RECIBO DE VENTAS
          </h2>
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="py-1.5 font-bold text-slate-600">FECHA</td>
                <td className="py-1.5 text-right text-slate-900">
                  {pedido.fecha}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-1.5 font-bold text-slate-600">
                  N.° DE RECIBO
                </td>
                <td className="py-1.5 text-right font-bold text-[#FF4500]">
                  {numeroRecibo}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="py-1.5 font-bold text-slate-600">
                  IMPORTE PAGADO
                </td>
                <td className="py-1.5 text-right font-bold text-slate-900">
                  {formatearPesos(pedido.total)}
                </td>
              </tr>
              <tr>
                <td className="py-1.5 font-bold text-slate-600">ESTADO</td>
                <td className="py-1.5 text-right font-bold text-slate-900">
                  {esPagado ? 'PAGADO' : 'POR COBRAR'}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="border-t border-slate-200 pt-2 text-[11px] text-slate-500">
            <p className="font-semibold text-slate-700">
              Distribuidora de Gas El Volcán Ltda.
            </p>
            <p>Av. Principal 1234, Santiago · (02) 2800 4000</p>
            <p className="font-bold text-[#0A2540]">www.el-volcan.cl</p>
          </div>
        </div>
      </div>
    </>
  )
}

export default ReciboTalonCorte
