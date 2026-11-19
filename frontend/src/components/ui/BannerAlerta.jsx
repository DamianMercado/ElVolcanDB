export function BannerAlerta({
  mensaje,
  titulo,
  tipo = 'error',
  variante = 'oscuro',
  alCerrar,
  accionTexto,
  alAccionar,
  className = '',
}) {
  if (!mensaje) return null

  const esClaro = variante === 'claro' || variante === 'light'
  const esExito = tipo === 'exito' || tipo === 'success'
  const esInfo = tipo === 'info'

  let estiloActivo = 'border-red-400/50 bg-red-500/15 text-red-100'
  if (esClaro && !esExito && !esInfo) {
    estiloActivo = 'border-red-200 bg-red-50 text-red-800'
  } else if (esExito && !esClaro) {
    estiloActivo = 'border-emerald-400/50 bg-emerald-500/15 text-emerald-100'
  } else if (esExito && esClaro) {
    estiloActivo = 'border-teal-200 bg-teal-50 text-teal-900'
  } else if (esInfo) {
    estiloActivo = 'border-sky-300 bg-sky-50 text-sky-900'
  }

  return (
    <div
      role={!esExito && !esInfo ? 'alert' : 'status'}
      className={`rounded-lg border px-4 py-3 text-sm font-medium ${estiloActivo} ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          {titulo && (
            <strong className="mb-1 block font-semibold">{titulo}</strong>
          )}
          <p>{mensaje}</p>
        </div>
        {alCerrar && (
          <button
            type="button"
            onClick={alCerrar}
            className="cursor-pointer text-xs font-bold opacity-75 hover:opacity-100"
            aria-label="Cerrar aviso"
          >
            ✕
          </button>
        )}
      </div>
      {accionTexto && alAccionar && (
        <button
          type="button"
          onClick={alAccionar}
          className="mt-2 inline-block cursor-pointer rounded bg-red-700 px-3 py-1 text-xs font-semibold text-white hover:bg-red-800"
        >
          {accionTexto}
        </button>
      )}
    </div>
  )
}

export default BannerAlerta
