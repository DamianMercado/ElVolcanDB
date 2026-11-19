import { useState, useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { MapaSeguimientoCliente } from '../components/mapa/MapaSeguimientoCliente.jsx'
import {
  obtenerEntregaActiva,
  suscribirCambiosEntrega,
} from '../service/repartoService.js'

const INTERVALO_ACTUALIZACION_SEGUNDOS = 300 // 5 minutos por especificación

export function SeguimientoPedido() {
  const { id } = useParams()
  const [entrega, setEntrega] = useState(() => obtenerEntregaActiva())
  const [segundosRestantes, setSegundosRestantes] = useState(
    INTERVALO_ACTUALIZACION_SEGUNDOS
  )
  const [ultimaSincronizacion, setUltimaSincronizacion] = useState(new Date())
  const [actualizando, setActualizando] = useState(false)

  // 1. Escuchar actualizaciones en tiempo real si el repartidor avanza en la otra pestaña
  useEffect(() => {
    const desuscribir = suscribirCambiosEntrega((datosNuevos) => {
      setEntrega(datosNuevos)
      setUltimaSincronizacion(new Date())
      setSegundosRestantes(INTERVALO_ACTUALIZACION_SEGUNDOS)
    })
    return () => desuscribir()
  }, [])

  // 2. Temporizador de actualización periódica cada 5 minutos
  useEffect(() => {
    const temporizador = setInterval(() => {
      setSegundosRestantes((prev) => {
        if (prev <= 1) {
          refrescarDatos()
          return INTERVALO_ACTUALIZACION_SEGUNDOS
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(temporizador)
  }, [])

  const refrescarDatos = () => {
    setActualizando(true)
    setTimeout(() => {
      const act = obtenerEntregaActiva()
      setEntrega(act)
      setUltimaSincronizacion(new Date())
      setSegundosRestantes(INTERVALO_ACTUALIZACION_SEGUNDOS)
      setActualizando(false)
    }, 400)
  }

  // Formato minutos:segundos (ej: 04:45)
  const minutos = String(Math.floor(segundosRestantes / 60)).padStart(2, '0')
  const segundos = String(segundosRestantes % 60).padStart(2, '0')

  const esEntregado = entrega?.estado === 'entregado'
  const esLlegando = entrega?.estado === 'llegando'

  return (
    <main className="min-h-[calc(100vh-140px)] bg-slate-100 p-4 md:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Banner Superior con Estado del Pedido */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-slate-400 uppercase">
                  Seguimiento de Despacho en Vivo
                </span>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-600">
                  Pedido #{id || entrega.codigoVenta}
                </span>
              </div>
              <h1 className="mt-1 text-2xl font-black text-[#0A2540] md:text-3xl">
                {esEntregado
                  ? '¡Tu Pedido ha Sido Entregado!'
                  : esLlegando
                  ? '¡Tu repartidor está en la puerta de tu domicilio!'
                  : 'Tu cilindro de gas está en camino'}
              </h1>
              <p className="mt-1 text-xs text-slate-500">
                Dirección de entrega: <strong className="text-slate-700">{entrega.cliente.direccion}</strong>
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
                  {esEntregado ? '0 min' : `~${entrega.etaMinutos || 8} min`}
                </p>
                <p className="text-[11px] text-blue-700">
                  {esEntregado ? 'Entrega completada' : `A ${entrega.distanciaKm || 2.1} km de distancia`}
                </p>
              </div>
            </div>
          </div>

          {/* Stepper Timeline de 4 Estados */}
          <div className="mt-8 border-t border-slate-100 pt-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {/* Paso 1: Confirmado */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Pedido Recibido</p>
                  <p className="text-[11px] text-slate-500">Pago registrado</p>
                </div>
              </div>

              {/* Paso 2: En Preparación */}
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow">
                  ✓
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">Cilindro Cargado</p>
                  <p className="text-[11px] text-slate-500">Planta El Volcán</p>
                </div>
              </div>

              {/* Paso 3: En Camino */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-bold shadow ${
                    esEntregado
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#2358b9] text-white animate-pulse'
                  }`}
                >
                  {esEntregado ? '✓' : '3'}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900">En Camino</p>
                  <p className="text-[11px] text-blue-600 font-semibold">
                    {esEntregado ? 'Completado' : 'Repartidor en ruta'}
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

        {/* Barra de Tasa de Actualización de 5 Minutos */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-2.5 w-2.5 rounded-full bg-blue-500 animate-ping" />
            <span className="text-slate-600">
              Tasa de actualización periódica del mapa:{' '}
              <strong className="text-slate-900">cada 5 minutos</strong>
            </span>
            <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono font-bold text-slate-700">
              Próxima en: {minutos}:{segundos}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden text-slate-400 sm:inline">
              Última sincronización:{' '}
              {ultimaSincronizacion.toLocaleTimeString('es-CL', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </span>
            <button
              type="button"
              onClick={refrescarDatos}
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

          {/* Tarjetas Laterales: Repartidor Asignado y Detalle del Pedido */}
          <div className="flex flex-col gap-4 lg:col-span-4">
            {/* Tarjeta del Repartidor */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Repartidor Asignado
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
                    <span className="text-slate-400">• ({entrega.repartidor.entregasRealizadas} entregas)</span>
                  </div>
                  <p className="text-xs text-slate-500">
                    {entrega.repartidor.vehiculo}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 p-3 text-xs">
                <div>
                  <span className="text-slate-400">Patente: </span>
                  <span className="font-mono font-bold text-slate-800">{entrega.repartidor.patente}</span>
                </div>
                <div>
                  <span className="text-slate-400">Planta: </span>
                  <span className="font-bold text-slate-800">Puente Alto</span>
                </div>
              </div>

              {/* Botón de Llamar */}
              <a
                href={`tel:${entrega.repartidor.telefono}`}
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
                {entrega.items.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between py-2 text-xs">
                    <div>
                      <span className="font-bold text-slate-800">{it.cantidad}x </span>
                      <span className="text-slate-600">{it.nombre}</span>
                    </div>
                    <span className="font-semibold text-slate-800">
                      ${it.subtotal.toLocaleString('es-CL')}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-3 border-t border-slate-200 pt-3 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500 uppercase">Total a Pagar:</span>
                <span className="text-base font-black text-[#0A2540]">
                  ${entrega.total.toLocaleString('es-CL')}
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Método: {entrega.metodoPago} ({entrega.subMetodoPago})
              </p>
            </div>

            {/* Banner de Ayuda y Switch a Modo Repartidor para Pruebas Locales */}
            <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-indigo-50 p-4 shadow-sm">
              <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wide">
                Modo Demostración Local
              </h4>
              <p className="mt-1 text-xs text-blue-800">
                ¿Quieres ver cómo el repartidor avanza en tiempo real en su mapa estilo Uber?
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
