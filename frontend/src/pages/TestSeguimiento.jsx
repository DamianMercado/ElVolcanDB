import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MapaSeguimientoCliente } from '../components/mapa/MapaSeguimientoCliente.jsx'
import {
  crearEntregaTestInicial,
  obtenerRutaOSRM,
  calcularRumbo,
  COORDENADAS_PLANTA_ORIGEN,
  COORDENADAS_CLIENTE_DESTINO,
} from '../service/repartoService.js'
import { formatearHoraChile, formatearFechaHoraChile } from '../utils/formato.js'

const ESTADOS_TEST = [
  { id: 'pendiente', etiqueta: 'Pendiente' },
  { id: 'asignado', etiqueta: 'Asignado' },
  { id: 'en_camino', etiqueta: 'En camino' },
  { id: 'llegando', etiqueta: 'Llegando' },
  { id: 'entregado', etiqueta: 'Entregado' },
  { id: 'cancelado', etiqueta: 'Cancelado' },
]

export function TestSeguimiento() {
  const [entrega, setEntrega] = useState(() => crearEntregaTestInicial())
  const [rutaPuntos, setRutaPuntos] = useState([])
  const [distanciaTotalKm, setDistanciaTotalKm] = useState(2.4)
  const [duracionTotalMin, setDuracionTotalMin] = useState(9)
  const [simulando, setSimulando] = useState(false)
  const [velocidad, setVelocidad] = useState(1)
  const indiceRef = useRef(0)

  // Cargar ruta OSRM (con fallback local) para la simulación GPS
  useEffect(() => {
    let cancelado = false
    obtenerRutaOSRM(COORDENADAS_PLANTA_ORIGEN, COORDENADAS_CLIENTE_DESTINO).then(
      (res) => {
        if (cancelado) return
        setRutaPuntos(res.puntos || [])
        setDistanciaTotalKm(res.distanciaKm || 2.4)
        setDuracionTotalMin(res.duracionMinutos || 9)
      }
    )
    return () => {
      cancelado = true
    }
  }, [])

  // Temporizador de simulación de avance del camión sobre la ruta
  useEffect(() => {
    if (!simulando || rutaPuntos.length < 2) return

    const intervaloMs = Math.max(250, Math.round(900 / velocidad))
    const timer = setInterval(() => {
      const siguiente = indiceRef.current + 1

      if (siguiente >= rutaPuntos.length - 1) {
        const ultimoIdx = rutaPuntos.length - 1
        indiceRef.current = ultimoIdx
        const [latFin, lngFin] = rutaPuntos[ultimoIdx]
        setSimulando(false)
        setEntrega((prev) => ({
          ...prev,
          estado: 'entregado',
          estadoPago: 'pagado',
          etaMinutos: 0,
          distanciaKm: 0,
          velocidadActualKmH: 0,
          posicionActual: {
            lat: latFin,
            lng: lngFin,
            indicePunto: ultimoIdx,
            rumbo: prev.posicionActual?.rumbo ?? 180,
          },
          auditoria: [
            ...(prev.auditoria || []),
            {
              evento: 'ENTREGADO',
              descripcion: 'Pedido de prueba entregado en domicilio',
              fecha_chile: new Date().toISOString(),
            },
          ],
          ultimaActualizacion: new Date().toISOString(),
        }))
        return
      }

      const [latPrev, lngPrev] = rutaPuntos[indiceRef.current]
      const [latSig, lngSig] = rutaPuntos[siguiente]
      const rumbo = Math.round(calcularRumbo(latPrev, lngPrev, latSig, lngSig))
      const progreso = siguiente / (rutaPuntos.length - 1)
      const distanciaRestante = Number(
        Math.max(0.1, distanciaTotalKm * (1 - progreso)).toFixed(1)
      )
      const etaRestante = Math.max(1, Math.round(duracionTotalMin * (1 - progreso)))
      const nuevoEstado = progreso >= 0.85 ? 'llegando' : 'en_camino'

      indiceRef.current = siguiente
      setEntrega((prev) => ({
        ...prev,
        estado: nuevoEstado,
        etaMinutos: etaRestante,
        distanciaKm: distanciaRestante,
        velocidadActualKmH: Math.round(36 + velocidad * 4),
        posicionActual: {
          lat: latSig,
          lng: lngSig,
          indicePunto: siguiente,
          rumbo,
        },
        ultimaActualizacion: new Date().toISOString(),
      }))
    }, intervaloMs)

    return () => clearInterval(timer)
  }, [simulando, velocidad, rutaPuntos, distanciaTotalKm, duracionTotalMin])

  const reiniciarTest = () => {
    setSimulando(false)
    indiceRef.current = 0
    setEntrega(crearEntregaTestInicial())
  }

  const alternarSimulacion = () => {
    if (entrega.estado === 'entregado' || entrega.estado === 'cancelado') {
      indiceRef.current = 0
      setEntrega(crearEntregaTestInicial())
      setSimulando(true)
      return
    }
    setSimulando((prev) => !prev)
  }

  const cambiarEstadoManual = (nuevoEstado) => {
    setSimulando(false)
    const ultimoIdx = Math.max(0, rutaPuntos.length - 1)
    let indiceObjetivo = indiceRef.current

    if (nuevoEstado === 'pendiente' || nuevoEstado === 'asignado') {
      indiceObjetivo = 0
    } else if (nuevoEstado === 'en_camino' && indiceObjetivo === 0 && ultimoIdx > 2) {
      indiceObjetivo = Math.floor(ultimoIdx * 0.4)
    } else if (nuevoEstado === 'llegando' && ultimoIdx > 1) {
      indiceObjetivo = Math.max(1, Math.floor(ultimoIdx * 0.88))
    } else if (nuevoEstado === 'entregado') {
      indiceObjetivo = ultimoIdx
    }

    indiceRef.current = indiceObjetivo
    const punto = rutaPuntos[indiceObjetivo]
    const lat = punto
      ? punto[0]
      : nuevoEstado === 'entregado'
      ? COORDENADAS_CLIENTE_DESTINO.lat
      : COORDENADAS_PLANTA_ORIGEN.lat
    const lng = punto
      ? punto[1]
      : nuevoEstado === 'entregado'
      ? COORDENADAS_CLIENTE_DESTINO.lng
      : COORDENADAS_PLANTA_ORIGEN.lng

    setEntrega((prev) => ({
      ...prev,
      estado: nuevoEstado,
      estadoPago: nuevoEstado === 'entregado' ? 'pagado' : prev.estadoPago,
      etaMinutos:
        nuevoEstado === 'entregado'
          ? 0
          : nuevoEstado === 'llegando'
          ? 1
          : nuevoEstado === 'pendiente'
          ? 15
          : 7,
      distanciaKm:
        nuevoEstado === 'entregado'
          ? 0
          : nuevoEstado === 'llegando'
          ? 0.2
          : distanciaTotalKm,
      posicionActual: {
        ...prev.posicionActual,
        lat,
        lng,
        indicePunto: indiceObjetivo,
      },
      auditoria: [
        ...(prev.auditoria || []),
        {
          evento: `TEST_${nuevoEstado.toUpperCase()}`,
          descripcion: `Estado cambiado manualmente a "${nuevoEstado}" en modo test`,
          fecha_chile: new Date().toISOString(),
        },
      ],
      ultimaActualizacion: new Date().toISOString(),
    }))
  }

  const estadoActual = entrega.estado || 'en_camino'
  const esCancelado = estadoActual === 'cancelado'
  const esPendiente = estadoActual === 'pendiente'
  const esAsignado = estadoActual === 'asignado'
  const esEnCamino = estadoActual === 'en_camino'
  const esLlegando = estadoActual === 'llegando'
  const esEntregado = estadoActual === 'entregado'

  const paso2Listo = esAsignado || esEnCamino || esLlegando || esEntregado
  const paso3Activo = esEnCamino || esLlegando
  const paso3Listo = esEntregado

  const tituloEstado = esCancelado
    ? 'Pedido de prueba cancelado'
    : esEntregado
    ? '¡Pedido de prueba entregado!'
    : esLlegando
    ? '¡El repartidor de prueba está en la puerta!'
    : esEnCamino
    ? 'Simulación: tu cilindro está en camino'
    : esAsignado
    ? 'Repartidor asignado en Planta El Volcán'
    : 'Pedido recibido — Esperando asignación'

  return (
    <main className="min-h-[calc(100vh-140px)] bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Cabecera de Modo Test y Controles */}
        <div className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-4 shadow-sm">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-amber-200 px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide text-amber-900 uppercase">
                  Test de Seguimiento
                </span>
                <span className="text-xs font-semibold text-amber-800">
                  Entorno de simulación local (no modifica pedidos reales en MongoDB)
                </span>
              </div>
              <p className="mt-1 text-xs text-amber-900/80">
                Usa estos controles para probar el mapa GPS, el avance de ruta y cada estado de entrega sin afectar tu seguimiento real.
              </p>
            </div>

            <Link
              to="/seguimiento"
              className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-[#0A2540] px-4 py-2 text-xs font-bold text-white no-underline shadow-sm transition hover:bg-[#143a63]"
            >
              <span>← Volver a Seguimiento</span>
            </Link>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-amber-200/80 pt-3">
            <button
              type="button"
              onClick={alternarSimulacion}
              className={`cursor-pointer rounded-lg px-3.5 py-2 text-xs font-bold text-white shadow-sm transition ${
                simulando
                  ? 'bg-amber-600 hover:bg-amber-700'
                  : 'bg-[#2358b9] hover:bg-[#1b4794]'
              }`}
            >
              {simulando ? 'Pausar Simulación GPS' : 'Iniciar Simulación GPS'}
            </button>

            <button
              type="button"
              onClick={reiniciarTest}
              className="cursor-pointer rounded-lg border border-amber-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 transition hover:bg-amber-100"
            >
              Reiniciar Test
            </button>

            <div className="flex items-center gap-1 rounded-lg border border-amber-200 bg-white px-2.5 py-1 text-xs">
              <span className="font-semibold text-slate-500">Velocidad:</span>
              {[1, 2, 4].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVelocidad(v)}
                  className={`cursor-pointer rounded px-2 py-0.5 font-bold transition ${
                    velocidad === v
                      ? 'bg-[#0A2540] text-white'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {v}x
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 md:ml-auto">
              <span className="text-xs font-semibold text-amber-900">Probar estado:</span>
              {ESTADOS_TEST.map((est) => (
                <button
                  key={est.id}
                  type="button"
                  onClick={() => cambiarEstadoManual(est.id)}
                  className={`cursor-pointer rounded-lg px-2.5 py-1 text-xs font-bold transition ${
                    estadoActual === est.id
                      ? 'bg-[#0A2540] text-white'
                      : 'border border-amber-200 bg-white text-slate-700 hover:bg-amber-100'
                  }`}
                >
                  {est.etiqueta}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Banner Estado y Stepper */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Simulador de Despacho en Vivo
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                  Pedido #{entrega.codigoVenta}
                </span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                  Datos de Prueba
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-black text-[#0A2540] md:text-3xl">
                {tituloEstado}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Dirección de entrega:{' '}
                <strong className="text-slate-700">{entrega.cliente.direccion}</strong>
                <span className="ml-2 text-slate-400">
                  • Última actualización (Chile): {formatearHoraChile(entrega.ultimaActualizacion, true)}
                </span>
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-4 rounded-2xl border border-blue-100 bg-blue-50/80 px-5 py-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2358b9] text-white shadow">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-bold text-blue-900 uppercase">Tiempo Estimado</p>
                <p className="text-2xl font-black text-[#2358b9]">
                  {esCancelado
                    ? 'Cancelado'
                    : esEntregado
                    ? '0 min'
                    : esPendiente
                    ? 'En espera'
                    : `~${entrega.etaMinutos} min`}
                </p>
                <p className="text-[11px] text-blue-700">
                  {esCancelado
                    ? 'Pedido anulado'
                    : esEntregado
                    ? 'Entrega completada'
                    : esPendiente
                    ? 'Asignando repartidor'
                    : `A ${entrega.distanciaKm} km de distancia`}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold shadow ${
                    esCancelado ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'
                  }`}
                >
                  {esCancelado ? '✕' : '✓'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Pedido Recibido</p>
                  <p className="text-[11px] text-slate-500">
                    {entrega.estadoPago === 'pagado' ? 'Pago confirmado' : 'Pago contra entrega'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold shadow ${
                    paso2Listo
                      ? 'bg-emerald-500 text-white'
                      : esPendiente
                      ? 'bg-[#2358b9] text-white animate-pulse'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {paso2Listo ? '✓' : '2'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Cilindro Cargado</p>
                  <p className="text-[11px] text-slate-500">
                    {paso2Listo ? 'Repartidor asignado' : 'Preparando en planta'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold shadow ${
                    paso3Listo
                      ? 'bg-emerald-500 text-white'
                      : paso3Activo
                      ? 'bg-[#2358b9] text-white animate-pulse'
                      : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {paso3Listo ? '✓' : '3'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">En Camino</p>
                  <p
                    className={`text-[11px] font-semibold ${
                      paso3Activo ? 'text-blue-600' : 'text-slate-400'
                    }`}
                  >
                    {paso3Listo
                      ? 'Completado'
                      : esLlegando
                      ? 'En tu domicilio'
                      : esEnCamino
                      ? 'Repartidor en ruta'
                      : 'Pendiente de salida'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold shadow ${
                    esEntregado ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'
                  }`}
                >
                  {esEntregado ? '✓' : '4'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Entregado</p>
                  <p className="text-[11px] text-slate-400">
                    {esEntregado ? 'Recibido conforme' : 'Pendiente de entrega'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Mapa + Tarjetas de Prueba */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="h-[460px] w-full md:h-[540px] lg:col-span-8">
            <MapaSeguimientoCliente entrega={entrega} />
          </div>

          <div className="flex flex-col gap-4 lg:col-span-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                Repartidor Simulado
              </span>
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={entrega.repartidor.foto}
                  alt={entrega.repartidor.nombre}
                  className="h-14 w-14 rounded-full border-2 border-[#00A8E8] object-cover shadow"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {entrega.repartidor.nombre}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-amber-500">
                    <span>★ {entrega.repartidor.calificacion}</span>
                    <span className="text-slate-400">
                      • ({entrega.repartidor.entregasRealizadas} entregas)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">{entrega.repartidor.vehiculo}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs">
                <div>
                  <span className="text-slate-400">Patente: </span>
                  <span className="font-mono font-bold text-slate-800">
                    {entrega.repartidor.patente}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Planta: </span>
                  <span className="font-bold text-slate-800">Puente Alto</span>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Detalle del Pedido de Prueba</h3>
              <div className="mt-3 divide-y divide-slate-100">
                {entrega.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{it.cantidad}x </span>
                      <span className="text-slate-600">{it.nombre}</span>
                    </div>
                    <span className="font-semibold text-slate-800">
                      ${Number(it.subtotal || 0).toLocaleString('es-CL')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3">
                <span className="text-xs font-bold text-slate-500 uppercase">Total:</span>
                <span className="text-base font-black text-[#0A2540]">
                  ${Number(entrega.total || 0).toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            {Array.isArray(entrega.auditoria) && entrega.auditoria.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900">
                  Eventos del Test (Hora Chile)
                </h3>
                <ul className="mt-3 space-y-2 text-xs">
                  {entrega.auditoria.slice(-5).map((ev, idx) => (
                    <li
                      key={idx}
                      className="flex items-start justify-between gap-2 border-b border-slate-100 pb-1.5 last:border-0"
                    >
                      <span className="text-slate-700">{ev.descripcion || ev.evento}</span>
                      <span className="shrink-0 font-mono text-[10px] text-slate-400">
                        {formatearFechaHoraChile(ev.fecha_chile)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}

export default TestSeguimiento
