/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from 'react'

const ES_ENTORNO_PRUEBA =
  typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test'

export const DURACION_ESQUELETO_MS = ES_ENTORNO_PRUEBA ? 0 : 2000

export function esperarEsqueleto(ms = DURACION_ESQUELETO_MS) {
  if (ms <= 0) return Promise.resolve()
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export function useEsperaEsqueleto(
  dependencia = null,
  ms = DURACION_ESQUELETO_MS
) {
  const [mostrandoEsqueleto, setMostrandoEsqueleto] = useState(() => ms > 0)

  useEffect(() => {
    if (ms <= 0) return undefined
    const temporizador = setTimeout(() => {
      setMostrandoEsqueleto(false)
    }, ms)
    return () => clearTimeout(temporizador)
  }, [dependencia, ms])

  return ms <= 0 ? false : mostrandoEsqueleto
}

export function BloqueEsqueleto({ className = '', variante = 'claro' }) {
  const claseEfecto =
    variante === 'oscuro' ? 'esqueleto-oscuro' : 'esqueleto-gris'

  return (
    <div
      className={`rounded-md ${claseEfecto} ${className}`}
      aria-hidden="true"
    />
  )
}

export function EsqueletoTarjetaProducto({ className = '' }) {
  return (
    <div
      className={`flex h-full w-full flex-col rounded-2xl bg-gradient-to-b from-[#1C4773] via-[#133459] to-[#0B223C] p-4 shadow-[0_14px_30px_-8px_rgba(3,12,24,0.65)] ${className}`}
      aria-hidden="true"
    >
      <BloqueEsqueleto
        variante="oscuro"
        className="mb-3.5 h-44 w-full rounded-xl"
      />
      <BloqueEsqueleto variante="oscuro" className="mb-2 h-4 w-1/3 rounded" />
      <BloqueEsqueleto variante="oscuro" className="mb-1.5 h-5 w-4/5" />
      <BloqueEsqueleto variante="oscuro" className="mt-1.5 h-7 w-2/5" />
      <BloqueEsqueleto variante="oscuro" className="mt-2 mb-4 h-3.5 w-1/2" />
      <BloqueEsqueleto
        variante="oscuro"
        className="mt-auto h-10 w-full rounded-xl"
      />
    </div>
  )
}

export function EsqueletoCatalogoProductos({ cantidad = 12 }) {
  return (
    <div
      role="status"
      aria-label="Cargando catálogo de productos"
      className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: cantidad }).map((_, indice) => (
        <EsqueletoTarjetaProducto key={indice} />
      ))}
    </div>
  )
}

export function EsqueletoTarjetasResumen({ cantidad = 4 }) {
  return (
    <div
      role="status"
      aria-label="Cargando resumen"
      className="mb-5 grid w-full grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4"
    >
      {Array.from({ length: cantidad }).map((_, indice) => (
        <div
          key={indice}
          className="flex flex-col gap-2 rounded-[10px] border-l-[5px] border-[#2358b9] bg-white p-4 shadow-sm"
        >
          <BloqueEsqueleto className="h-3.5 w-3/5" />
          <BloqueEsqueleto className="h-7 w-2/5" />
          <BloqueEsqueleto className="h-3 w-4/5" />
        </div>
      ))}
    </div>
  )
}

export function EsqueletoTabla({
  filas = 5,
  columnas = 6,
  conMiniatura = false,
}) {
  return (
    <div
      role="status"
      aria-label="Cargando registros de tabla"
      className="w-full overflow-x-auto rounded-[10px] border border-[#e3eaf3] bg-white"
    >
      <table className="w-full border-collapse text-left text-sm">
        <thead className="border-b border-[#eef2f7] bg-[#f3f6fa]">
          <tr>
            {Array.from({ length: columnas }).map((_, colIndice) => (
              <th key={colIndice} className="px-4 py-3">
                <BloqueEsqueleto className="h-3.5 w-3/4 min-w-[3.5rem]" />
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#eef2f7]">
          {Array.from({ length: filas }).map((_, filaIndice) => (
            <tr key={filaIndice}>
              {Array.from({ length: columnas }).map((__, colIndice) => (
                <td key={colIndice} className="px-4 py-3">
                  {colIndice === 0 && conMiniatura ? (
                    <div className="flex items-center gap-3">
                      <BloqueEsqueleto className="h-11 w-11 shrink-0 rounded-lg" />
                      <div className="flex w-full min-w-[8rem] flex-col gap-1.5">
                        <BloqueEsqueleto className="h-4 w-3/4" />
                        <BloqueEsqueleto className="h-3 w-full" />
                      </div>
                    </div>
                  ) : colIndice === columnas - 1 ? (
                    <div className="flex justify-end gap-2">
                      <BloqueEsqueleto className="h-7 w-16 shrink-0 rounded-md" />
                      <BloqueEsqueleto className="h-7 w-16 shrink-0 rounded-md" />
                    </div>
                  ) : (
                    <BloqueEsqueleto
                      className={`h-4 min-w-[3rem] ${
                        colIndice % 2 === 0 ? 'w-2/3' : 'w-4/5'
                      }`}
                    />
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function EsqueletoRepartidores({ cantidad = 3 }) {
  return (
    <div
      role="status"
      aria-label="Cargando repartidores"
      className="grid w-full grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3"
    >
      {Array.from({ length: cantidad }).map((_, indice) => (
        <div
          key={indice}
          className="flex flex-col gap-2.5 rounded-lg border border-[#e3eaf3] bg-[#fafbfd] p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <BloqueEsqueleto className="h-4 w-1/2" />
            <BloqueEsqueleto className="h-5 w-1/4 rounded-full" />
          </div>
          <BloqueEsqueleto className="h-3.5 w-2/5" />
          <BloqueEsqueleto className="mt-1 h-3 w-3/4" />
        </div>
      ))}
    </div>
  )
}

export function EsqueletoSolicitudesStock({ cantidad = 3 }) {
  return (
    <div
      role="status"
      aria-label="Cargando solicitudes de stock"
      className="flex w-full flex-col gap-2"
    >
      {Array.from({ length: cantidad }).map((_, indice) => (
        <div
          key={indice}
          className="flex items-center justify-between gap-2.5 rounded-lg border border-[#e3eaf3] bg-[#fafbfd] px-3.5 py-2.5"
        >
          <div className="flex w-2/3 flex-col gap-1.5">
            <BloqueEsqueleto className="h-4 w-4/5" />
            <BloqueEsqueleto className="h-3 w-1/2" />
          </div>
          <BloqueEsqueleto className="h-7 w-24 shrink-0 rounded-md" />
        </div>
      ))}
    </div>
  )
}

export function EsqueletoFormularioProducto() {
  return (
    <div
      role="status"
      aria-label="Cargando formulario del producto"
      className="grid w-full grid-cols-1 gap-6 lg:grid-cols-3"
    >
      <section className="rounded-[10px] border-l-[5px] border-[#2358b9] bg-white p-6 shadow-sm lg:col-span-2">
        <BloqueEsqueleto className="mb-5 h-6 w-2/5" />

        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <BloqueEsqueleto className="h-3.5 w-1/2" />
              <BloqueEsqueleto className="h-10 w-full rounded-lg" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <BloqueEsqueleto className="h-3.5 w-2/5" />
              <BloqueEsqueleto className="h-10 w-full rounded-lg" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <BloqueEsqueleto className="h-3.5 w-1/3" />
            <BloqueEsqueleto className="h-20 w-full rounded-lg" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, indice) => (
              <div key={indice} className="flex flex-col gap-1.5">
                <BloqueEsqueleto className="h-3.5 w-3/5" />
                <BloqueEsqueleto className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="flex flex-col gap-1.5">
              <BloqueEsqueleto className="h-3.5 w-1/2" />
              <BloqueEsqueleto className="h-10 w-full rounded-lg" />
            </div>
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <BloqueEsqueleto className="h-3.5 w-2/5" />
              <BloqueEsqueleto className="h-10 w-full rounded-lg" />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3 border-t border-[#eef2f7] pt-4">
            <BloqueEsqueleto className="h-10 w-36 rounded-lg" />
            <BloqueEsqueleto className="h-10 w-24 rounded-lg" />
          </div>
        </div>
      </section>

      <aside className="flex flex-col gap-4">
        <div className="rounded-[10px] bg-white p-5 shadow-sm">
          <BloqueEsqueleto className="mb-3 h-4 w-3/5" />
          <div className="flex flex-col items-center rounded-xl border border-[#e3eaf3] bg-[#fafbfd] p-5">
            <BloqueEsqueleto className="mb-3 h-36 w-full max-w-[9rem] rounded-lg" />
            <BloqueEsqueleto className="mb-2 h-4 w-1/3 rounded-full" />
            <BloqueEsqueleto className="mb-1.5 h-5 w-3/4" />
            <BloqueEsqueleto className="mt-2 h-6 w-2/5" />
            <BloqueEsqueleto className="mt-2 h-3.5 w-1/2" />
          </div>
        </div>
      </aside>
    </div>
  )
}

export function EsqueletoCreacionPedido() {
  return (
    <div
      role="status"
      aria-label="Cargando creación de pedido"
      className="flex w-full flex-col gap-5"
    >
      <BloqueEsqueleto variante="oscuro" className="h-5 w-2/5" />
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 2 }).map((_, indice) => (
          <div
            key={indice}
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/15 bg-slate-800/70 p-3.5"
          >
            <div className="flex flex-1 items-center gap-3">
              <BloqueEsqueleto
                variante="oscuro"
                className="h-12 w-12 shrink-0 rounded-lg"
              />
              <div className="flex flex-1 flex-col gap-1.5">
                <BloqueEsqueleto variante="oscuro" className="h-4 w-3/5" />
                <BloqueEsqueleto variante="oscuro" className="h-3.5 w-1/3" />
              </div>
            </div>
            <BloqueEsqueleto
              variante="oscuro"
              className="h-8 w-24 shrink-0 rounded-lg"
            />
          </div>
        ))}
      </div>
      <BloqueEsqueleto variante="oscuro" className="h-12 w-full rounded-xl" />
      <div className="border-t border-white/15 pt-5">
        <BloqueEsqueleto variante="oscuro" className="mb-4 h-5 w-1/2" />
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <BloqueEsqueleto
            variante="oscuro"
            className="h-10 w-full rounded-lg"
          />
          <BloqueEsqueleto
            variante="oscuro"
            className="h-10 w-full rounded-lg"
          />
        </div>
        <BloqueEsqueleto
          variante="oscuro"
          className="mt-4 h-12 w-full rounded-xl"
        />
      </div>
    </div>
  )
}

export function EsqueletoPago() {
  return (
    <div
      role="status"
      aria-label="Cargando pasarela de pago"
      className="mx-auto flex w-full max-w-5xl flex-col gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:p-10 lg:flex-row"
    >
      <section className="flex-1">
        <BloqueEsqueleto className="mb-6 h-7 w-1/2" />
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <BloqueEsqueleto className="h-3.5 w-1/3" />
            <BloqueEsqueleto className="h-10 w-full rounded-lg" />
          </div>
          <div className="flex flex-col gap-1.5">
            <BloqueEsqueleto className="h-3.5 w-2/5" />
            <BloqueEsqueleto className="h-10 w-full rounded-lg" />
          </div>
          <div className="flex flex-col gap-1.5">
            <BloqueEsqueleto className="h-3.5 w-1/3" />
            <BloqueEsqueleto className="h-10 w-full rounded-lg" />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <BloqueEsqueleto className="h-10 w-full rounded-lg" />
            <BloqueEsqueleto className="h-10 w-full rounded-lg" />
          </div>
          <BloqueEsqueleto className="mt-2 h-12 w-full rounded-xl" />
        </div>
      </section>
      <aside className="w-full rounded-xl border border-slate-200 bg-slate-50 p-6 lg:w-80">
        <BloqueEsqueleto className="mb-4 h-5 w-3/5" />
        <BloqueEsqueleto className="mb-2 h-4 w-full" />
        <BloqueEsqueleto className="mb-6 h-3.5 w-3/4" />
        <BloqueEsqueleto className="h-8 w-1/2" />
      </aside>
    </div>
  )
}

export function EsqueletoRecibo() {
  return (
    <div
      role="status"
      aria-label="Cargando comprobante de pedido"
      className="mx-auto w-full max-w-4xl"
    >
      <div className="rounded-xl border border-slate-300 bg-white p-6 shadow-md md:p-10">
        <div className="mb-6 flex flex-wrap justify-between gap-4 border-b border-slate-200 pb-6">
          <div className="flex flex-1 flex-col gap-2">
            <BloqueEsqueleto className="h-6 w-2/5" />
            <BloqueEsqueleto className="h-4 w-3/5" />
            <BloqueEsqueleto className="h-3.5 w-1/3" />
          </div>
          <BloqueEsqueleto className="h-20 w-44 shrink-0 rounded-lg" />
        </div>
        <div className="mb-6 flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, indice) => (
            <BloqueEsqueleto key={indice} className="h-10 w-full rounded-md" />
          ))}
        </div>
        <div className="flex justify-end">
          <BloqueEsqueleto className="h-24 w-full max-w-xs rounded-lg" />
        </div>
      </div>
    </div>
  )
}

export function EsqueletoFormularioAutenticacion({ filas = 2 }) {
  return (
    <div
      role="status"
      aria-label="Cargando formulario"
      className="flex w-full flex-col gap-4"
    >
      {Array.from({ length: filas }).map((_, indice) => (
        <div key={indice} className="flex flex-col gap-1.5">
          <BloqueEsqueleto variante="oscuro" className="h-3.5 w-2/5" />
          <BloqueEsqueleto
            variante="oscuro"
            className="h-10 w-full rounded-lg"
          />
        </div>
      ))}
      <BloqueEsqueleto
        variante="oscuro"
        className="mt-2 h-11 w-full rounded-xl"
      />
    </div>
  )
}

export function EsqueletoProceso({
  etiqueta = 'Procesando solicitud...',
  variante = 'oscuro',
  lineas = 2,
}) {
  const contenedorClases =
    variante === 'oscuro'
      ? 'border-white/15 bg-slate-800/80 text-white/85'
      : 'border-slate-300 bg-slate-100 text-slate-700'

  return (
    <div
      role="status"
      aria-label={etiqueta}
      className={`w-full rounded-xl border p-4 ${contenedorClases}`}
    >
      <div className="mb-2.5 flex items-center gap-2.5">
        <BloqueEsqueleto
          variante={variante}
          className="h-4 w-4 shrink-0 rounded-full"
        />
        <span className="text-xs font-semibold">{etiqueta}</span>
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: lineas }).map((_, indice) => (
          <BloqueEsqueleto
            key={indice}
            variante={variante}
            className={`h-3 ${indice % 2 === 0 ? 'w-full' : 'w-2/3'}`}
          />
        ))}
      </div>
    </div>
  )
}

export default BloqueEsqueleto
