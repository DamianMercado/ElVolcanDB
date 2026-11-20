import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { MapaSeguimientoCliente } from '../components/mapa/MapaSeguimientoCliente.jsx'
import { useSesion } from '../context/Sesion.jsx'
import {
  obtenerEntregaActiva,
  cargarEntregaDesdeBackend,
  suscribirCambiosEntrega,
} from '../service/repartoService.js'
import { obtenerPedidosPorUsuario } from '../service/pedidoService.js'
import { formatearHoraChile, formatearFechaHoraChile } from '../utils/formato.js'

const INTERVALO_ACTUALIZACION_SEGUNDOS = 15

export function SeguimientoPedido() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { usuario } = useSesion()

  const [entrega, setEntrega] = useState(() => obtenerEntregaActiva())
  const [misPedidos, setMisPedidos] = useState([])
  const [codigoBusqueda, setCodigoBusqueda] = useState(id || '')
  const [errorBusqueda, setErrorBusqueda] = useState('')
  const [segundosRestantes, setSegundosRestantes] = useState(
    INTERVALO_ACTUALIZACION_SEGUNDOS
  )
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState(() => new Date())
  const [actualizando, setActualizando] = useState(false)

  const sincronizarDesdeServidor = useCallback(
    async (identificadorObjetivo = id, mostrarError = false) => {
      setActualizando(true)
      try {
        const datos = await cargarEntregaDesdeBackend(identificadorObjetivo, usuario)
        if (datos) {
          setEntrega(datos)
          setUltimaSincronizacion(new Date())
          setErrorBusqueda('')
        }
      } catch (err) {
        if (mostrarError) {
          setErrorBusqueda(
            err?.message || 'No encontramos un pedido con ese código.'
          )
        }
      } finally {
        setSegundosRestantes(INTERVALO_ACTUALIZACION_SEGUNDOS)
        setActualizando(false)
      }
    },
    [id, usuario]
  )

  // 1. Cargar pedido real desde ms-venta al entrar o cambiar :id
  useEffect(() => {
    let activo = true
    cargarEntregaDesdeBackend(id, usuario).then((datos) => {
      if (activo && datos) {
        setEntrega(datos)
        setUltimaSincronizacion(new Date())
        if (id) setCodigoBusqueda(id)
      }
    })
    return () => {
      activo = false
    }
  }, [id, usuario])

  // 2. Si hay usuario autenticado, cargar su historial de pedidos para cambiar fácilmente
  useEffect(() => {
    const idUsuario = usuario?.idUsuario ?? usuario?.id
    if (!idUsuario || !/^\d+$/.test(String(idUsuario))) return
    let activo = true
    obtenerPedidosPorUsuario(idUsuario)
      .then((lista) => {
        if (activo && Array.isArray(lista)) {
          const ordenados = [...lista].sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
          setMisPedidos(ordenados)
        }
      })
      .catch(() => {})
    return () => {
      activo = false
    }
  }, [usuario])

  // 3. Escuchar actualizaciones en tiempo real entre pestañas locales
  useEffect(() => {
    const desuscribir = suscribirCambiosEntrega((datosNuevos) => {
      if (
        !id ||
        String(datosNuevos.codigoVenta).toLowerCase() === String(id).toLowerCase() ||
        String(datosNuevos.ventaId) === String(id)
      ) {
        setEntrega(datosNuevos)
        setUltimaSincronizacion(new Date())
        setSegundosRestantes(INTERVALO_ACTUALIZACION_SEGUNDOS)
      }
    })
    return () => desuscribir()
  }, [id])

  // 4. Polling en vivo contra ms-venta cada 15 segundos
  useEffect(() => {
    const temporizador = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          sincronizarDesdeServidor(id || entrega?.codigoVenta, false)
          return INTERVALO_ACTUALIZACION_SEGUNDOS
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(temporizador)
  }, [id, entrega?.codigoVenta, sincronizarDesdeServidor])

  const manejarBusquedaCodigo = async (e) => {
    e.preventDefault()
    const limpio = codigoBusqueda.replace('#', '').trim()
    if (!limpio) return
    setErrorBusqueda('')
    navigate(`/seguimiento/${encodeURIComponent(limpio)}`)
  }

  const minutos = String(Math.floor(segundosRestantes / 60)).padStart(2, '0')
  const segundos = String(segundosRestantes % 60).padStart(2, '0')

  const estadoActual = entrega?.estado || 'pendiente'
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
    ? 'Este pedido fue cancelado'
    : esEntregado
    ? '¡Tu Pedido ha Sido Entregado!'
    : esLlegando
    ? '¡Tu repartidor está en la puerta de tu domicilio!'
    : esEnCamino
    ? 'Tu cilindro de gas está en camino'
    : esAsignado
    ? 'Repartidor asignado en Planta El Volcán'
    : 'Pedido recibido — Esperando asignación de repartidor'

  return (
    <main className="min-h-[calc(100vh-140px)] bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Buscador de Pedido y Selector de Pedidos del Cliente */}
        <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
          <form onSubmit={manejarBusquedaCodigo} className="flex flex-1 flex-wrap items-center gap-2">
            <label htmlFor="buscar-codigo-pedido" className="text-xs font-bold text-slate-700">
              Rastrear pedido:
            </label>
            <input
              id="buscar-codigo-pedido"
              type="text"
              value={codigoBusqueda}
              onChange={(e) => setCodigoBusqueda(e.target.value)}
              placeholder="Ej: EV-101, EV-102..."
              className="w-44 rounded-lg border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-[#2358b9] focus:bg-white focus:outline-none"
            />
            <button
              type="submit"
              disabled={actualizando}
              className="cursor-pointer rounded-lg bg-[#0A2540] px-3.5 py-1.5 text-xs font-bold text-white transition hover:bg-[#143a63] disabled:opacity-50"
            >
              Buscar
            </button>
            {errorBusqueda && (
              <span className="text-xs font-semibold text-red-600">{errorBusqueda}</span>
            )}
          </form>

          {misPedidos.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-semibold text-slate-500">Tus pedidos:</span>
              <select
                value={entrega?.codigoVenta || ''}
                onChange={(e) => {
                  if (e.target.value) {
                    setCodigoBusqueda(e.target.value)
                    navigate(`/seguimiento/${encodeURIComponent(e.target.value)}`)
                  }
                }}
                aria-label="Seleccionar uno de tus pedidos"
                className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800 focus:border-[#2358b9] focus:outline-none"
              >
                {misPedidos.map((p) => (
                  <option key={p.id} value={p.codigo}>
                    {p.codigo} — {p.estado} ({p.fecha})
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Banner Superior con Estado del Pedido */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Seguimiento de Despacho en Vivo
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-bold text-slate-700">
                  Pedido #{entrega?.codigoVenta || id || 'EV-101'}
                </span>
                {entrega?.esDemo ? (
                  <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">
                    Modo Demostración
                  </span>
                ) : (
                  <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    Sincronizado con MongoDB
                  </span>
                )}
              </div>
              <h1 className="mt-1 text-2xl font-black text-[#0A2540] md:text-3xl">
                {tituloEstado}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Dirección de entrega:{' '}
                <strong className="text-slate-700">
                  {entrega?.cliente?.direccion || 'Dirección registrada'}
                </strong>
                {entrega?.fechaVentaChile && (
                  <span className="ml-2 text-slate-400">
                    • Registrado: {formatearFechaHoraChile(entrega.fechaVentaChile)} (Hora Chile)
                  </span>
                )}
              </p>
            </div>

            {/* Tiempo Estimado de Llegada (ETA) */}
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
                    : `~${entrega?.etaMinutos ?? 8} min`}
                </p>
                <p className="text-[11px] text-blue-700">
                  {esCancelado
                    ? 'Pedido anulado'
                    : esEntregado
                    ? 'Entrega completada'
                    : esPendiente
                    ? 'Asignando repartidor'
                    : `A ${entrega?.distanciaKm ?? 2.1} km de distancia`}
                </p>
              </div>
            </div>
          </div>

          {/* Stepper Timeline Dinámico de 4 Estados */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {/* Paso 1: Pedido Recibido */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold shadow ${
                    esCancelado
                      ? 'bg-red-500 text-white'
                      : 'bg-emerald-500 text-white'
                  }`}
                >
                  {esCancelado ? '✕' : '✓'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Pedido Recibido</p>
                  <p className="text-[11px] text-slate-500">
                    {entrega?.estadoPago === 'pagado' ? 'Pago confirmado' : 'Pago contra entrega'}
                  </p>
                </div>
              </div>

              {/* Paso 2: Repartidor Asignado */}
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

              {/* Paso 3: En Camino */}
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

              {/* Paso 4: Entregado */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold shadow ${
                    esEntregado
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 text-slate-500'
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

        {/* Barra de Sincronización en Vivo (Hora Santiago de Chile) */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-ping" />
            <span className="text-slate-600">
              Sincronización automática en vivo:{' '}
              <strong className="text-slate-900">cada {INTERVALO_ACTUALIZACION_SEGUNDOS}s</strong>
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono font-bold text-slate-700">
              Próxima en: {minutos}:{segundos}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-slate-400 sm:inline">
              Última sincronización (Chile):{' '}
              {formatearHoraChile(ultimaSincronizacion, true)}
            </span>
            <button
              type="button"
              onClick={() => sincronizarDesdeServidor(id || entrega?.codigoVenta, true)}
              disabled={actualizando}
              className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-1.5 font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 active:scale-95 disabled:opacity-50"
            >
              <svg
                className={`h-3.5 w-3.5 text-blue-600 ${actualizando ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>{actualizando ? 'Actualizando...' : 'Actualizar Ahora'}</span>
            </button>
          </div>
        </div>

        {/* Grid: Mapa del Recorrido (8 cols) + Info Repartidor y Pedido (4 cols) */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* Mapa de Seguimiento Leaflet */}
          <div className="h-[460px] w-full md:h-[540px] lg:col-span-8">
            <MapaSeguimientoCliente entrega={entrega} />
          </div>

          {/* Tarjetas Laterales: Repartidor Asignado, Detalle del Pedido y Auditoría */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            {/* Tarjeta del Repartidor */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Repartidor Asignado
              </span>
              <div className="mt-3 flex items-center gap-3">
                <img
                  src={entrega?.repartidor?.foto}
                  alt={entrega?.repartidor?.nombre}
                  className="h-14 w-14 rounded-full border-2 border-[#00A8E8] object-cover shadow"
                />
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {entrega?.repartidor?.nombre || 'Por asignar'}
                  </h3>
                  <div className="flex items-center gap-1 text-xs text-amber-500">
                    <span>★ {entrega?.repartidor?.calificacion || 4.9}</span>
                    <span className="text-slate-400">
                      • ({entrega?.repartidor?.entregasRealizadas || 428} entregas)
                    </span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {entrega?.repartidor?.vehiculo || 'Camión Reparto Gas El Volcán'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs">
                <div>
                  <span className="text-slate-400">Patente: </span>
                  <span className="font-mono font-bold text-slate-800">
                    {entrega?.repartidor?.patente || 'KJ-WP-42'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">Planta: </span>
                  <span className="font-bold text-slate-800">Puente Alto</span>
                </div>
              </div>

              <a
                href={`tel:${entrega?.repartidor?.telefono || '+56933333333'}`}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[#2358b9] px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-[#1b4794]"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                <span>Llamar al Repartidor</span>
              </a>
            </div>

            {/* Resumen del Pedido */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900">Detalle del Pedido</h3>
              <div className="mt-3 divide-y divide-slate-100">
                {(entrega?.items || []).map((it, idx) => (
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

              <div className="mt-3 border-t border-slate-200 pt-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Total:</span>
                <span className="text-base font-black text-[#0A2540]">
                  ${Number(entrega?.total || 0).toLocaleString('es-CL')}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Método: {entrega?.metodoPago} ({entrega?.subMetodoPago}) •{' '}
                <strong className={entrega?.estadoPago === 'pagado' ? 'text-emerald-600' : 'text-amber-600'}>
                  {entrega?.estadoPago === 'pagado' ? 'Pagado' : 'Pendiente de pago'}
                </strong>
              </p>
            </div>

            {/* Historial de Eventos con Hora de Santiago de Chile */}
            {Array.isArray(entrega?.auditoria) && entrega.auditoria.length > 0 && (
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <h3 className="text-sm font-bold text-slate-900">
                  Historial del Pedido (Hora Chile)
                </h3>
                <ul className="mt-3 space-y-2 text-xs">
                  {entrega.auditoria.map((ev, idx) => (
                    <li key={idx} className="flex items-start justify-between gap-2 border-b border-slate-100 pb-1.5 last:border-0">
                      <span className="text-slate-700">{ev.descripcion || ev.evento}</span>
                      <span className="shrink-0 font-mono text-[10px] text-slate-400">
                        {formatearFechaHoraChile(ev.fecha_chile)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Acceso rápido a Consola de Repartidor */}
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                Consola de Reparto en Vivo
              </h4>
              <p className="mt-1 text-xs text-blue-800">
                ¿Eres repartidor o quieres simular el recorrido GPS sincronizado con el servidor?
              </p>
              <Link
                to="/repartidor"
                className="mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-[#2358b9] px-4 py-2.5 text-xs font-bold text-white shadow transition hover:bg-[#1b4794]"
              >
                <span>Abrir Consola del Repartidor</span>
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

export default SeguimientoPedido
