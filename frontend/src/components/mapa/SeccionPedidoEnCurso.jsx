import { useState } from 'react'

export function SeccionPedidoEnCurso({
  entrega,
  simulando,
  velocidad,
  gpsActivo,
  alToggleSimulacion,
  alCambiarVelocidad,
  alToggleGps,
  alAvisarLlegada,
  alConfirmarEntrega,
  alReiniciarDemo,
}) {
  const [expandido, setExpandido] = useState(false)

  const esEntregado = entrega?.estado === 'entregado'
  const esLlegando = entrega?.estado === 'llegando'

  return (
    <div className="pointer-events-none absolute right-3 bottom-3 left-3 z-30 flex justify-center">
      <div className="pointer-events-auto w-full max-w-xl rounded-2xl border border-[#e7e8ec] bg-white/95 p-3.5 shadow-2xl backdrop-blur-md transition-all duration-300 md:p-4">
        {/* Asa / Pill de arrastre superior para expandir/colapsar */}
        <button
          type="button"
          onClick={() => setExpandido(!expandido)}
          className="mx-auto -mt-1 mb-2 flex flex-col items-center justify-center gap-1 cursor-pointer w-full text-[#adadad] hover:text-[#121212] transition"
          aria-label={expandido ? 'Contraer detalles' : 'Expandir detalles'}
        >
          <div className="h-1.5 w-12 rounded-full bg-[#adadad]/60 transition-colors" />
        </button>

        {/* Fila Principal de Resumen (Siempre Visible) */}
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-extrabold tracking-wider text-[#adadad] uppercase">
                Pedido en Curso #{entrega.codigoVenta}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-black ${
                  esEntregado
                    ? 'bg-[#D9F2E4] text-[#048848]'
                    : esLlegando
                    ? 'bg-[#FFC043]/25 text-[#121212]'
                    : 'bg-[#276EF1]/15 text-[#276EF1]'
                }`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
                {esEntregado ? 'Entregado' : esLlegando ? 'En Domicilio' : 'En Camino'}
              </span>
            </div>

            <p className="truncate text-sm font-bold text-[#121212] md:text-base">
              {entrega.cliente.nombre}
            </p>
            <p className="truncate text-xs text-[#545454]">
              {entrega.cliente.direccion}
            </p>
          </div>

          <div className="shrink-0 text-right">
            <span className="text-base font-black text-[#121212] md:text-lg">
              ${entrega.total.toLocaleString('es-CL')}
            </span>
            <div className="text-[11px] font-bold text-[#276EF1]">
              {esEntregado ? 'Completado' : `~${entrega.etaMinutos || 8} min (${entrega.distanciaKm || 2.1} km)`}
            </div>
          </div>
        </div>

        {/* Barra de Acciones Rápidas del Repartidor */}
        <div className="mt-3 flex items-center gap-2">
          {/* Botón Play / Pausa Simulación */}
          <button
            type="button"
            onClick={alToggleSimulacion}
            disabled={gpsActivo}
            className={`flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold shadow transition active:scale-95 disabled:opacity-50 ${
              simulando
                ? 'bg-[#FFC043] text-[#121212] hover:bg-[#ED6E33] hover:text-white'
                : 'bg-[#276EF1] text-white hover:bg-[#4788FF]'
            }`}
          >
            {simulando ? (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Pausar</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                </svg>
                <span>{esEntregado ? 'Reiniciar' : 'Iniciar Ruta'}</span>
              </>
            )}
          </button>

          {/* Botón Llamar al Cliente */}
          <a
            href={`tel:${entrega.cliente.telefono}`}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#121212] text-white shadow transition hover:bg-[#252525] active:scale-95"
            title={`Llamar a ${entrega.cliente.nombre}`}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </a>

          {/* Botón Llegué / Entregar */}
          {!esEntregado && (
            <button
              type="button"
              onClick={esLlegando ? alConfirmarEntrega : alAvisarLlegada}
              className={`cursor-pointer rounded-xl px-3 py-2 text-xs font-bold text-white shadow transition active:scale-95 ${
                esLlegando
                  ? 'bg-[#048848] hover:bg-[#3AA76D]'
                  : 'bg-[#121212] hover:bg-[#242629]'
              }`}
            >
              {esLlegando ? '✓ Entregar' : '🔔 Llegué'}
            </button>
          )}

          {/* Botón Expandir / Contraer */}
          <button
            type="button"
            onClick={() => setExpandido(!expandido)}
            className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[#e7e8ec] bg-[#ffffff] text-[#121212] transition hover:bg-[#e7e8ec]/40"
            title={expandido ? 'Ver menos' : 'Ver más detalles'}
          >
            <svg
              className={`h-4 w-4 transition-transform ${expandido ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        </div>

        {/* Sección Expandida con Todos los Detalles del Pedido */}
        {expandido && (
          <div className="mt-3.5 space-y-3 border-t border-slate-200/70 pt-3 text-xs animate-in fade-in duration-200">
            {/* Instrucciones de entrega */}
            {entrega.cliente.instrucciones && (
              <div className="rounded-xl bg-amber-50 p-2.5 text-amber-900 border border-amber-200/60">
                <span className="font-bold">Nota de despacho: </span>
                <span>{entrega.cliente.instrucciones}</span>
              </div>
            )}

            {/* Lista de Productos */}
            <div>
              <p className="font-bold text-slate-700 mb-1">Cilindros e Insumos en Furgón:</p>
              <div className="space-y-1.5">
                {entrega.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between text-slate-600">
                    <span>
                      <strong className="text-slate-800">{it.cantidad}x</strong> {it.nombre}
                    </span>
                    <span className="font-semibold text-slate-800">
                      ${it.subtotal.toLocaleString('es-CL')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Método de Cobro */}
            <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-slate-600">
              <span>Método de cobro:</span>
              <span className="font-bold text-slate-800">{entrega.subMetodoPago}</span>
            </div>

            {/* Controles de Simulación y GPS */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#e7e8ec] pt-2">
              <div className="flex items-center gap-1 rounded-xl bg-[#e7e8ec]/50 p-1">
                <span className="text-[10px] font-bold text-[#adadad] px-1">Vel:</span>
                {[1, 2, 5].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => alCambiarVelocidad(v)}
                    className={`cursor-pointer rounded-lg px-2 py-0.5 text-xs font-bold transition ${
                      velocidad === v
                        ? 'bg-[#121212] text-white shadow'
                        : 'text-[#121212] hover:text-[#2171ec]'
                    }`}
                  >
                    {v}x
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={alToggleGps}
                className={`cursor-pointer rounded-xl border px-2.5 py-1 text-[11px] font-bold transition ${
                  gpsActivo
                    ? 'border-[#2171ec] bg-[#2171ec]/10 text-[#2171ec]'
                    : 'border-[#e7e8ec] bg-white text-[#121212] hover:bg-[#e7e8ec]/40'
                }`}
              >
                {gpsActivo ? '● GPS Conectado' : 'Usar GPS Real'}
              </button>

              <button
                type="button"
                onClick={alReiniciarDemo}
                className="cursor-pointer rounded-xl border border-[#e7e8ec] bg-white px-2.5 py-1 text-[11px] font-bold text-[#121212] hover:bg-[#e7e8ec]/40"
              >
                ↺ Reiniciar Demo
              </button>
            </div>

            {/* Botón Principal de Confirmación Final */}
            {!esEntregado && (
              <button
                type="button"
                onClick={alConfirmarEntrega}
                className="w-full cursor-pointer rounded-xl bg-emerald-600 py-2.5 text-xs font-black text-white shadow-md transition hover:bg-emerald-700 active:scale-95"
              >
                ✓ Confirmar Entrega y Cobro al Cliente
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default SeccionPedidoEnCurso
