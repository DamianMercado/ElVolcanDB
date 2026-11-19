export function ReciboCabecera({
  pedido,
  numeroRecibo,
  esPagado,
  esEfectivo,
}) {
  return (
    <>
      {/* 1. Encabezado principal */}
      <div className="flex flex-col justify-between gap-6 border-b-2 border-[#0A2540] pb-6 md:flex-row">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-[#0A2540] md:text-3xl">
            RECIBO DE VENTAS
          </h1>
          <div className="text-xs leading-relaxed text-slate-600">
            <p className="font-bold text-slate-800">
              Distribuidora de Gas El Volcán Ltda.
            </p>
            <p>Av. Principal 1234, Santiago</p>
            <p>Región Metropolitana, Chile</p>
            <p>Mesa Central: (02) 2800 4000</p>
            <p>contacto@el-volcan.cl</p>
          </div>
        </div>

        <div className="w-full md:w-72">
          <table className="w-full border-collapse text-xs">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 px-3 py-2 font-bold text-[#0A2540]">
                  FECHA
                </td>
                <td className="px-3 py-2 text-right font-medium text-slate-800">
                  {pedido.fecha} {pedido.hora ? `· ${pedido.hora} hrs` : ''}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 px-3 py-2 font-bold text-[#0A2540]">
                  N.° DE RECIBO
                </td>
                <td className="px-3 py-2 text-right font-extrabold text-[#FF4500]">
                  {numeroRecibo}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 px-3 py-2 font-bold text-[#0A2540]">
                  N.° DE CLIENTE / RUT
                </td>
                <td className="px-3 py-2 text-right font-medium text-slate-800">
                  {pedido.rut || `CLI-${numeroRecibo}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Sección Vendedor/Repartidor y Datos de Entrega del Cliente */}
      <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <table className="w-full border-collapse border border-slate-200 text-xs">
            <tbody>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 px-3 py-2 font-bold text-[#0A2540]">
                  REPARTIDOR / MÓVIL
                </td>
                <td className="px-3 py-2 text-slate-800">
                  {pedido.repartidor || 'Por asignar en ruta'}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 px-3 py-2 font-bold text-[#0A2540]">
                  MÉTODO DE PAGO
                </td>
                <td className="px-3 py-2 text-slate-800">
                  {esPagado
                    ? 'Webpay Plus (Débito/Crédito en línea)'
                    : esEfectivo
                    ? 'Efectivo contra entrega'
                    : 'Tarjeta al repartidor (POS móvil)'}
                </td>
              </tr>
              <tr className="border-b border-slate-200">
                <td className="bg-slate-100 px-3 py-2 font-bold text-[#0A2540]">
                  ESTADO DE PAGO
                </td>
                <td className="px-3 py-2 font-semibold text-slate-900">
                  {esPagado ? 'PAGADO (Aprobado)' : 'PENDIENTE DE COBRO'}
                </td>
              </tr>
              <tr>
                <td className="bg-slate-100 px-3 py-2 font-bold text-[#0A2540]">
                  N.° TRANSACCIÓN / AUT
                </td>
                <td className="px-3 py-2 text-slate-800">
                  {pedido.codigoAutorizacion
                    ? `${pedido.codigoAutorizacion} / ${pedido.codigoTransaccion || 'OK'}`
                    : 'No aplica'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
          <span className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-[#2358b9]">
            A/A: Nombre / Receptor
          </span>
          <p className="text-sm font-bold text-slate-900">{pedido.cliente}</p>
          <p className="mt-1 text-slate-700">{pedido.direccion}</p>
          <p className="mt-1 text-slate-600">
            Teléfono: {pedido.telefono || 'No especificado'}
          </p>
          <p className="text-slate-600">
            Correo: {pedido.email || 'No especificado'}
          </p>
        </div>
      </div>
    </>
  )
}

export default ReciboCabecera
