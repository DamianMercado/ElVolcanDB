const formatearPrecio = (monto) =>
  `$${Number(monto || 0).toLocaleString('es-CL')}`

function IconoSimple({ tipo, className = 'h-5 w-5' }) {
  const props = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.9',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className,
    'aria-hidden': 'true',
  }

  switch (tipo) {
    case 'ruta':
      return (
        <svg {...props}>
          <circle cx="6" cy="6" r="2.5" />
          <circle cx="18" cy="18" r="2.5" />
          <path d="M8.5 6h5a3.5 3.5 0 0 1 0 7h-3a3.5 3.5 0 0 0 0 7h5" />
        </svg>
      )
    case 'pin':
      return (
        <svg {...props}>
          <path d="M12 21s6-5.2 6-10.2a6 6 0 1 0-12 0C6 15.8 12 21 12 21Z" />
          <circle cx="12" cy="10.8" r="2.2" />
        </svg>
      )
    case 'check':
      return (
        <svg {...props}>
          <path d="M5 13l4 4L19 7" />
        </svg>
      )
    case 'reloj':
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="8.5" />
          <path d="M12 7.5V12l3 2" />
        </svg>
      )
    case 'ahorro':
      return (
        <svg {...props}>
          <path d="M13 3L4 14h7l-1 7 9-11h-7l1-7Z" />
        </svg>
      )
    case 'flecha':
      return (
        <svg {...props}>
          <path d="M5 12h14" />
          <path d="m13 6 6 6-6 6" />
        </svg>
      )
    case 'mapa':
      return (
        <svg {...props}>
          <path d="M9 20l-5.5-2.7V5.6L9 7m0 13l6-3m-6 3V7m6 10l5.5 2.3V7.6L15 4m0 13V4m0 0L9 7" />
        </svg>
      )
    case 'recargar':
      return (
        <svg {...props}>
          <path d="M21 12a9 9 0 1 1-2.64-6.36" />
          <path d="M21 3v6h-6" />
        </svg>
      )
    default:
      return (
        <svg {...props}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )
  }
}

export function PanelListaPedidosRepartidor({
  planOptimo,
  calculandoRuta = false,
  recorridoEntregado = [],
  tabActiva = 'pendientes',
  alCambiarTab,
  alSeleccionarPedido,
  alRecalcularRuta,
  alAbrirMenu,
  alVolverAlMapa,
  puedeVolverAlMapa = false,
  codigoPedidoEnMapa = null,
  cargandoPedidos = false,
  ultimaEntregaCompletada = null,
}) {
  const paradas = planOptimo?.paradas || []
  const recomendado = paradas[0] || null
  const origenLabel =
    planOptimo?.origen?.direccion ||
    planOptimo?.origen?.nombre ||
    'Planta El Volcán'

  const distanciaRecorridaTotal = Number(
    recorridoEntregado
      .reduce((acc, item) => acc + Number(item.distanciaRecorridaKm || 0), 0)
      .toFixed(1)
  )
  const montoRecaudadoTotal = recorridoEntregado.reduce(
    (acc, item) => acc + Number(item.total || 0),
    0
  )

  return (
    <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#0A1624] text-white">
      {/* Cabecera Superior */}
      <header className="shrink-0 bg-[#0F1E31] px-4 py-3.5 shadow-lg sm:px-6">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {alAbrirMenu && (
              <button
                type="button"
                onClick={alAbrirMenu}
                aria-label="Abrir Menú de Navegación"
                title="Abrir Menú de Navegación"
                className="flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-xl bg-white/10 text-white transition hover:bg-white/20 active:scale-95"
              >
                <IconoSimple tipo="menu" className="h-5 w-5" />
              </button>
            )}
            <div className="min-w-0">
              <h1 className="truncate text-base font-black tracking-tight text-white sm:text-lg">
                Planificador de Ruta y Pedidos
              </h1>
              <p className="flex items-center gap-1.5 truncate text-xs text-slate-300">
                <IconoSimple tipo="pin" className="h-3.5 w-3.5 shrink-0 text-[#00A8E8]" />
                <span className="truncate">Punto actual: {origenLabel}</span>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={alRecalcularRuta}
              disabled={calculandoRuta}
              title="Recalcular mejor ruta"
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-white transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
            >
              <IconoSimple
                tipo="recargar"
                className={`h-4 w-4 ${calculandoRuta ? 'animate-spin' : ''}`}
              />
              <span className="hidden sm:inline">
                {calculandoRuta ? 'Calculando...' : 'Recalcular'}
              </span>
            </button>

            {puedeVolverAlMapa && alVolverAlMapa && (
              <button
                type="button"
                onClick={alVolverAlMapa}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl bg-[#276EF1] px-3.5 py-2 text-xs font-extrabold text-white shadow-md transition hover:bg-[#4788FF] active:scale-95"
              >
                <IconoSimple tipo="mapa" className="h-4 w-4" />
                <span>Volver al mapa</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Contenido Principal con Scroll */}
      <main className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <div className="mx-auto w-full max-w-4xl space-y-4 pb-8">
          {/* Confirmación breve tras entregar un pedido */}
          {ultimaEntregaCompletada && tabActiva === 'recorrido' && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#112A22] px-4 py-3.5 shadow-lg">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#048848] text-white">
                  <IconoSimple tipo="check" className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold tracking-wide text-[#3AA76D] uppercase">
                    Entrega completada
                  </p>
                  <p className="text-sm font-bold text-white">
                    #{ultimaEntregaCompletada.codigoVenta} · {ultimaEntregaCompletada.cliente}
                  </p>
                </div>
              </div>
              {recomendado && (
                <button
                  type="button"
                  onClick={() => alSeleccionarPedido(recomendado.entrega)}
                  className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#276EF1] px-4 py-2 text-xs font-extrabold text-white shadow transition hover:bg-[#4788FF] active:scale-95"
                >
                  <span>Seguir con #{recomendado.entrega.codigoVenta} ({recomendado.distanciaTramoKm} km)</span>
                  <IconoSimple tipo="flecha" className="h-4 w-4" />
                </button>
              )}
            </div>
          )}

          {/* Tarjeta Resumen de Mejor Ruta Calculada */}
          {paradas.length > 0 && (
            <section className="rounded-2xl bg-[#112238] p-4 shadow-xl sm:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#276EF1]/20 px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-[#4788FF] uppercase">
                      <IconoSimple tipo="ruta" className="h-3.5 w-3.5" />
                      Mejor ruta calculada
                    </span>
                    <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                      {planOptimo?.usandoCallesReales
                        ? 'Calles reales (OSRM)'
                        : 'Estimación urbana'}
                    </span>
                  </div>
                  <h2 className="mt-2 text-base font-black text-white sm:text-lg">
                    {recomendado
                      ? `Pedido más cómodo para salir ahora: #${recomendado.entrega.codigoVenta} (${recomendado.entrega.cliente.nombre})`
                      : 'Orden óptimo de entregas'}
                  </h2>
                  {recomendado && (
                    <p className="mt-0.5 text-xs text-slate-300">
                      {recomendado.entrega.cliente.direccion} · A solo{' '}
                      <strong className="text-white">
                        {recomendado.distanciaTramoKm} km
                      </strong>{' '}
                      (~{recomendado.etaTramoMin} min) desde tu ubicación actual.
                    </p>
                  )}
                </div>

                {recomendado && (
                  <button
                    type="button"
                    onClick={() => alSeleccionarPedido(recomendado.entrega)}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#276EF1] px-4 py-2.5 text-xs font-extrabold text-white shadow-lg transition hover:bg-[#4788FF] active:scale-95"
                  >
                    <span>Iniciar con el más cómodo</span>
                    <IconoSimple tipo="flecha" className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* KPIs de ahorro y recorrido óptimo */}
              <div className="mt-4 grid grid-cols-3 gap-2.5 sm:gap-3">
                <div className="rounded-xl bg-[#0B1726] p-3">
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Pendientes
                  </p>
                  <p className="mt-1 text-lg font-black text-white sm:text-xl">
                    {paradas.length}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {paradas.length === 1 ? 'parada en ruta' : 'paradas en orden'}
                  </p>
                </div>

                <div className="rounded-xl bg-[#0B1726] p-3">
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Ruta óptima
                  </p>
                  <p className="mt-1 text-lg font-black text-[#4788FF] sm:text-xl">
                    {planOptimo.distanciaTotalKm} km
                  </p>
                  <p className="text-[11px] text-slate-400">
                    ~{planOptimo.duracionTotalMin} min estimados
                  </p>
                </div>

                <div className="rounded-xl bg-[#0B1726] p-3">
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Ahorro estimado
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-lg font-black text-[#3AA76D] sm:text-xl">
                    <IconoSimple tipo="ahorro" className="h-4 w-4 shrink-0" />
                    <span>
                      {planOptimo.ahorroKm > 0
                        ? `${planOptimo.ahorroKm} km`
                        : 'Óptima'}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {planOptimo.ahorroKm > 0
                      ? `-${planOptimo.ahorroPorcentaje}% vs cola original`
                      : 'Menor recorrido posible'}
                  </p>
                </div>
              </div>
            </section>
          )}

          {/* Pestañas: Pedidos Pendientes / Recorrido Entregado */}
          <div className="flex items-center gap-2 rounded-2xl bg-[#0F1E31] p-1.5">
            <button
              type="button"
              onClick={() => alCambiarTab('pendientes')}
              className={`flex-1 cursor-pointer rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
                tabActiva === 'pendientes'
                  ? 'bg-[#276EF1] text-white shadow'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              Pendientes por entregar ({paradas.length})
            </button>
            <button
              type="button"
              onClick={() => alCambiarTab('recorrido')}
              className={`flex-1 cursor-pointer rounded-xl px-4 py-2.5 text-xs font-extrabold transition ${
                tabActiva === 'recorrido'
                  ? 'bg-[#276EF1] text-white shadow'
                  : 'text-slate-300 hover:bg-white/5 hover:text-white'
              }`}
            >
              Recorrido realizado ({recorridoEntregado.length})
            </button>
          </div>

          {/* VISTA 1: LISTA DE PEDIDOS PENDIENTES ORDENADOS POR MEJOR RUTA */}
          {tabActiva === 'pendientes' && (
            <section className="space-y-3" aria-label="Pedidos pendientes ordenados por mejor ruta">
              {cargandoPedidos ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((n) => (
                    <div
                      key={n}
                      className="h-28 animate-pulse rounded-2xl bg-[#112238]"
                    />
                  ))}
                </div>
              ) : paradas.length === 0 ? (
                <div className="rounded-2xl bg-[#112238] p-8 text-center shadow-lg">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#048848]/20 text-[#3AA76D]">
                    <IconoSimple tipo="check" className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-base font-black text-white">
                    No quedan pedidos pendientes por entregar
                  </h3>
                  <p className="mt-1 text-xs text-slate-300">
                    Puedes revisar el detalle completo de tu recorrido y las entregas realizadas.
                  </p>
                  <button
                    type="button"
                    onClick={() => alCambiarTab('recorrido')}
                    className="mt-4 inline-flex cursor-pointer items-center gap-2 rounded-xl bg-[#276EF1] px-4 py-2.5 text-xs font-extrabold text-white shadow transition hover:bg-[#4788FF]"
                  >
                    <span>Ver recorrido realizado</span>
                    <IconoSimple tipo="flecha" className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                paradas.map((parada) => {
                  const ent = parada.entrega
                  const esActivoEnMapa =
                    Boolean(codigoPedidoEnMapa) &&
                    codigoPedidoEnMapa === ent.codigoVenta
                  const resumenItems = (ent.items || [])
                    .map((it) => `${it.cantidad}x ${it.nombre}`)
                    .join(' · ')

                  return (
                    <article
                      key={ent.codigoVenta}
                      className={`rounded-2xl p-4 shadow-lg transition ${
                        parada.esRecomendado
                          ? 'bg-[#152B47] ring-2 ring-[#276EF1]'
                          : 'bg-[#112238] hover:bg-[#152A44]'
                      }`}
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex min-w-0 items-start gap-3">
                          {/* Número de orden sugerido */}
                          <div
                            className={`flex h-10 w-10 shrink-0 flex-col items-center justify-center rounded-xl font-black ${
                              parada.esRecomendado
                                ? 'bg-[#276EF1] text-white'
                                : 'bg-white/10 text-slate-200'
                            }`}
                          >
                            <span className="text-sm leading-none">
                              {parada.orden}
                            </span>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-extrabold tracking-wide text-[#00A8E8] uppercase">
                                #{ent.codigoVenta}
                              </span>
                              {parada.esRecomendado && (
                                <span className="rounded-full bg-[#276EF1] px-2.5 py-0.5 text-[10px] font-extrabold text-white uppercase">
                                  Más cómodo ahora
                                </span>
                              )}
                              {esActivoEnMapa && (
                                <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold text-white uppercase">
                                  En mapa
                                </span>
                              )}
                            </div>

                            <h3 className="mt-1 truncate text-sm font-black text-white sm:text-base">
                              {ent.cliente.nombre}
                            </h3>
                            <p className="truncate text-xs text-slate-300">
                              {ent.cliente.direccion}
                            </p>
                            {resumenItems && (
                              <p className="mt-1 truncate text-[11px] text-slate-400">
                                {resumenItems}
                              </p>
                            )}

                            <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] font-semibold text-slate-300">
                              <span className="inline-flex items-center gap-1 text-[#4788FF]">
                                <IconoSimple tipo="ruta" className="h-3.5 w-3.5" />
                                {parada.orden === 1
                                  ? `${parada.distanciaTramoKm} km desde aquí`
                                  : `+${parada.distanciaTramoKm} km (acum. ${parada.distanciaAcumuladaKm} km)`}
                              </span>
                              <span className="inline-flex items-center gap-1">
                                <IconoSimple tipo="reloj" className="h-3.5 w-3.5" />
                                ~{parada.etaTramoMin} min
                              </span>
                              <span className="font-bold text-white">
                                {formatearPrecio(ent.total)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => alSeleccionarPedido(ent)}
                          className={`inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-extrabold shadow transition active:scale-95 ${
                            parada.esRecomendado
                              ? 'bg-[#276EF1] text-white hover:bg-[#4788FF]'
                              : 'bg-white/10 text-white hover:bg-[#276EF1]'
                          }`}
                        >
                          <span>
                            {esActivoEnMapa ? 'Continuar ruta' : 'Seleccionar ruta'}
                          </span>
                          <IconoSimple tipo="flecha" className="h-4 w-4" />
                        </button>
                      </div>
                    </article>
                  )
                })
              )}
            </section>
          )}

          {/* VISTA 2: RECORRIDO REALIZADO (TRAS ENTREGAR PEDIDOS) */}
          {tabActiva === 'recorrido' && (
            <section className="space-y-4" aria-label="Recorrido de entregas realizadas">
              {/* Resumen de jornada */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <div className="rounded-2xl bg-[#112238] p-3.5 shadow">
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Entregados
                  </p>
                  <p className="mt-1 text-xl font-black text-[#3AA76D]">
                    {recorridoEntregado.length}
                  </p>
                  <p className="text-[11px] text-slate-400">pedidos completados</p>
                </div>

                <div className="rounded-2xl bg-[#112238] p-3.5 shadow">
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Recorrido
                  </p>
                  <p className="mt-1 text-xl font-black text-[#4788FF]">
                    {distanciaRecorridaTotal} km
                  </p>
                  <p className="text-[11px] text-slate-400">distancia cubierta</p>
                </div>

                <div className="rounded-2xl bg-[#112238] p-3.5 shadow">
                  <p className="text-[10px] font-bold tracking-wider text-slate-400 uppercase">
                    Recaudado
                  </p>
                  <p className="mt-1 text-xl font-black text-white">
                    {formatearPrecio(montoRecaudadoTotal)}
                  </p>
                  <p className="text-[11px] text-slate-400">en entregas cerradas</p>
                </div>
              </div>

              {recorridoEntregado.length === 0 ? (
                <div className="rounded-2xl bg-[#112238] p-8 text-center shadow-lg">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-slate-300">
                    <IconoSimple tipo="ruta" className="h-6 w-6" />
                  </div>
                  <h3 className="mt-3 text-base font-black text-white">
                    Aún no has completado entregas en este recorrido
                  </h3>
                  <p className="mt-1 text-xs text-slate-300">
                    Selecciona un pedido pendiente y, al finalizar la entrega, verás aquí todo tu trayecto paso a paso.
                  </p>
                </div>
              ) : (
                <div className="rounded-2xl bg-[#112238] p-4 shadow-xl sm:p-5">
                  <h3 className="text-xs font-extrabold tracking-wider text-slate-400 uppercase">
                    Trayecto de entregas completadas
                  </h3>

                  <ol className="mt-4 space-y-3">
                    {/* Punto de salida inicial */}
                    <li className="flex items-start gap-3">
                      <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/15 text-[#00A8E8]">
                        <IconoSimple tipo="pin" className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1 rounded-xl bg-[#0B1726] px-3.5 py-2.5">
                        <p className="text-xs font-extrabold text-white">
                          Salida · Planta El Volcán
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Centro de distribución y carga inicial
                        </p>
                      </div>
                    </li>

                    {/* Paradas entregadas */}
                    {recorridoEntregado.map((parada, idx) => (
                      <li key={parada.codigoVenta} className="flex items-start gap-3">
                        <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#048848] text-xs font-black text-white">
                          {idx + 1}
                        </div>
                        <div className="min-w-0 flex-1 rounded-xl bg-[#0B1726] px-3.5 py-3">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-extrabold text-[#3AA76D]">
                                #{parada.codigoVenta}
                              </span>
                              <span className="rounded-full bg-[#048848]/20 px-2 py-0.5 text-[10px] font-bold text-[#3AA76D] uppercase">
                                Entregado
                              </span>
                            </div>
                            <span className="text-xs font-black text-white">
                              {formatearPrecio(parada.total)}
                            </span>
                          </div>

                          <p className="mt-1 text-sm font-bold text-white">
                            {parada.cliente}
                          </p>
                          <p className="truncate text-xs text-slate-300">
                            {parada.direccion}
                          </p>

                          <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-400">
                            <span>Tramo: {parada.distanciaRecorridaKm} km</span>
                            {parada.horaEntrega && (
                              <span>Hora: {parada.horaEntrega}</span>
                            )}
                            {parada.metodoPago && <span>{parada.metodoPago}</span>}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </section>
          )}
        </div>
      </main>
    </div>
  )
}

export default PanelListaPedidosRepartidor
