export function ControlesPruebaPago({
  alCargarTarjetaPrueba,
  alSimularRechazo,
  procesando,
}) {
  return (
    <div className="mt-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-3.5">
      <span className="mb-2 block text-xs font-semibold text-slate-500">
        Datos de prueba (Entorno de Pruebas):
      </span>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          onClick={() => alCargarTarjetaPrueba('debito')}
        >
          Tarjeta Débito
        </button>
        <button
          type="button"
          className="cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          onClick={() => alCargarTarjetaPrueba('credito')}
        >
          Tarjeta Crédito
        </button>
        <button
          type="button"
          className="cursor-pointer rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
          onClick={alSimularRechazo}
          disabled={procesando}
        >
          Simular Fallo
        </button>
      </div>
    </div>
  )
}

export default ControlesPruebaPago
