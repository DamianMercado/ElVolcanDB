import { useState } from 'react'
import { InsigniaEstado } from '../ui/InsigniaEstado.jsx'
import { EsqueletoSolicitudesStock } from '../ui/Esqueleto.jsx'

export function SolicitarStock({
  productos,
  solicitudes,
  cargandoSolicitudes = false,
  codigo,
  alCambiarCodigo,
  alSolicitar,
  alRecibir,
}) {
  const [cantidad, setCantidad] = useState('')
  const [nota, setNota] = useState('')
  const [error, setError] = useState('')

  const producto = productos.find((p) => p.codigo === codigo)
  const sugerido = producto
    ? Math.max(producto.minimo * 2 - producto.stock, 0)
    : 0

  function enviar(evento) {
    evento.preventDefault()

    const numero = Number(cantidad)
    if (!producto) {
      setError('Elige un producto.')
      return
    }
    if (!Number.isInteger(numero) || numero <= 0) {
      setError('La cantidad debe ser un número entero mayor que 0.')
      return
    }

    alSolicitar(codigo, numero, nota.trim())
    setCantidad('')
    setNota('')
    setError('')
  }

  const nombreDe = (cod) =>
    productos.find((p) => p.codigo === cod)?.nombre ?? cod

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
      <form className="flex flex-col gap-3" onSubmit={enviar}>
        <label className="flex flex-col gap-1 text-sm text-[#2d3e50]">
          Producto
          <select
            value={codigo}
            onChange={(e) => alCambiarCodigo(e.target.value)}
            className="rounded-md border border-[#c5d1e0] bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-[#2358b9] focus:outline-none"
          >
            <option value="">Selecciona un producto…</option>
            {productos.map((p) => (
              <option key={p.codigo} value={p.codigo}>
                {p.codigo} · {p.nombre}
              </option>
            ))}
          </select>
        </label>

        {producto && (
          <p className="-mt-1 text-xs text-[#5b6776]">
            Stock actual: <strong>{producto.stock}</strong> · Mínimo:{' '}
            {producto.minimo}
            {sugerido > 0 && (
              <>
                {' '}
                · Sugerido:{' '}
                <button
                  type="button"
                  className="cursor-pointer border-0 bg-transparent p-0 font-semibold text-[#2358b9] underline"
                  onClick={() => setCantidad(String(sugerido))}
                >
                  {sugerido} unidades
                </button>
              </>
            )}
          </p>
        )}

        <label className="flex flex-col gap-1 text-sm text-[#2d3e50]">
          Cantidad
          <input
            type="number"
            min="1"
            value={cantidad}
            onChange={(e) => setCantidad(e.target.value)}
            placeholder="Ej: 50"
            className="rounded-md border border-[#c5d1e0] bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-[#2358b9] focus:outline-none"
          />
        </label>

        <label className="flex flex-col gap-1 text-sm text-[#2d3e50]">
          Observación (opcional)
          <input
            type="text"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej: entrega urgente"
            className="rounded-md border border-[#c5d1e0] bg-white px-2.5 py-2 text-sm text-slate-900 focus:border-[#2358b9] focus:outline-none"
          />
        </label>

        {error && (
          <p className="m-0 text-xs font-medium text-[#b9382c]">{error}</p>
        )}

        <button
          type="submit"
          className="cursor-pointer self-start rounded-md bg-[#2358b9] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1b4592]"
        >
          Enviar solicitud
        </button>
      </form>

      <div>
        <h3 className="mb-3.5 text-base font-bold text-[#1d3963]">
          Solicitudes realizadas
        </h3>
        {cargandoSolicitudes ? (
          <EsqueletoSolicitudesStock cantidad={3} />
        ) : (
          <>
            {solicitudes.length === 0 && (
              <p className="py-5 text-center text-sm text-[#7a8696]">
                Aún no hay solicitudes.
              </p>
            )}
            <div className="flex flex-col gap-2">
              {solicitudes.map((s) => (
                <div
                  className="flex items-center justify-between gap-2.5 rounded-lg border border-[#e3eaf3] bg-[#fafbfd] px-3.5 py-2.5"
                  key={s.id}
                >
                  <div className="flex flex-col gap-0.5">
                    <strong className="text-sm font-semibold text-slate-800">
                      {s.cantidad} × {nombreDe(s.codigo)}
                    </strong>
                    <small className="text-xs text-[#6e7a89]">
                      {s.fecha}
                      {s.nota && ` · ${s.nota}`}
                    </small>
                  </div>
                  {s.estado === 'Pendiente' ? (
                    <button
                      type="button"
                      className="cursor-pointer rounded-md border border-[#2358b9] bg-white px-3 py-1.5 text-xs font-semibold text-[#2358b9] transition hover:bg-[#eef4fc]"
                      onClick={() => alRecibir(s.id)}
                    >
                      Marcar recibida
                    </button>
                  ) : (
                    <InsigniaEstado variante="stock-ok">Recibida</InsigniaEstado>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default SolicitarStock
