import { useState, useEffect, useRef, useCallback } from 'react'
import { MapaRepartidor } from '../components/mapa/MapaRepartidor.jsx'
import { SeccionPedidoEnCurso } from '../components/mapa/SeccionPedidoEnCurso.jsx'
import { DrawerNavRepartidor } from '../components/layouts/DrawerNavRepartidor.jsx'
import { useSesion } from '../context/Sesion.jsx'
import {
  obtenerEntregaActiva,
  guardarEntregaActiva,
  listarEntregasParaRepartidor,
  reiniciarEntregaDemo,
  cambiarEstadoEntrega,
  suscribirCambiosEntrega,
  actualizarPosicionRepartidor,
  sincronizarPosicionConBackend,
  sincronizarEstadoConBackend,
} from '../service/repartoService.js'

export function Repartidor() {
  const { usuario } = useSesion()
  const [entrega, setEntrega] = useState(() => obtenerEntregaActiva())
  const [colaEntregas, setColaEntregas] = useState([])
  const [simulando, setSimulando] = useState(false)
  const [velocidad, setVelocidad] = useState(1)
  const [gpsActivo, setGpsActivo] = useState(false)
  const [menuDrawerAbierto, setMenuDrawerAbierto] = useState(false)
  const [mostrarModalCobro, setMostrarModalCobro] = useState(false)
  const [mensajeAlerta, setMensajeAlerta] = useState(null)
  const watchIdRef = useRef(null)
  const ultimoEnvioBackendRef = useRef(0)

  const mostrarNotificacion = useCallback((texto, ms = 3500) => {
    setMensajeAlerta(texto)
    if (ms > 0) {
      setTimeout(() => setMensajeAlerta(null), ms)
    }
  }, [])

  // 1. Cargar cola real de entregas desde ms-venta (MongoDB)
  const recargarColaBackend = useCallback(async () => {
    const lista = await listarEntregasParaRepartidor(usuario)
    if (lista.length > 0) {
      setColaEntregas(lista)
      setEntrega((actual) => {
        const coincidencia = lista.find(
          (e) => actual?.ventaId && e.ventaId === actual.ventaId
        )
        const elegida = coincidencia || lista[0]
        return guardarEntregaActiva(elegida)
      })
    }
  }, [usuario])

  useEffect(() => {
    let montado = true
    listarEntregasParaRepartidor(usuario).then((lista) => {
      if (!montado || lista.length === 0) return
      setColaEntregas(lista)
      const actual = obtenerEntregaActiva()
      const coincidencia = lista.find(
        (e) => actual?.ventaId && e.ventaId === actual.ventaId
      )
      const elegida = coincidencia || lista[0]
      setEntrega(guardarEntregaActiva(elegida))
    })
    return () => {
      montado = false
    }
  }, [usuario])

  // 2. Sincronizar cambios locales entre pestañas
  useEffect(() => {
    const cancelarSuscripcion = suscribirCambiosEntrega((datosActualizados) => {
      setEntrega(datosActualizados)
    })
    return () => cancelarSuscripcion()
  }, [])

  // 3. Limpiar GPS al desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  const seleccionarEntrega = (codigoVenta) => {
    const elegida = colaEntregas.find((e) => e.codigoVenta === codigoVenta)
    if (!elegida) return
    setSimulando(false)
    const guardada = guardarEntregaActiva(elegida)
    setEntrega(guardada)
    mostrarNotificacion(`Pedido activo cambiado a #${elegida.codigoVenta} (${elegida.cliente.nombre})`)
  }

  const enviarTelemetriaSiCorresponde = useCallback(
    (telemetria, forzar = false) => {
      const ahora = Date.now()
      if (!forzar && ahora - ultimoEnvioBackendRef.current < 2500) {
        return
      }
      ultimoEnvioBackendRef.current = ahora
      sincronizarPosicionConBackend(entrega, telemetria)
    },
    [entrega]
  )

  const toggleSimulacion = async () => {
    if (entrega.estado === 'entregado') {
      reiniciar()
      setSimulando(true)
      return
    }
    const proximo = !simulando
    setSimulando(proximo)

    if (proximo && entrega.ventaId && entrega.estado !== 'en_camino') {
      const nombreRep = usuario?.nombre || entrega.repartidor?.nombre
      const sincronizada = await sincronizarEstadoConBackend(
        entrega,
        'en_camino',
        nombreRep && nombreRep !== 'Por asignar en planta' ? nombreRep : 'Carlos Ruiz'
      )
      if (sincronizada) setEntrega(sincronizada)
    }
  }

  const reiniciar = () => {
    setSimulando(false)
    if (entrega.ventaId) {
      const reiniciadoReal = guardarEntregaActiva({
        ...entrega,
        estado: 'en_camino',
        posicionActual: {
          lat: entrega.origen?.lat ?? -33.5985,
          lng: entrega.origen?.lng ?? -70.578,
          indicePunto: 0,
          rumbo: 180,
        },
        etaMinutos: 9,
        distanciaKm: 2.4,
      })
      setEntrega(reiniciadoReal)
      sincronizarEstadoConBackend(reiniciadoReal, 'en_camino')
      mostrarNotificacion(`Recorrido de #${entrega.codigoVenta} reiniciado.`)
      return
    }
    const reiniciado = reiniciarEntregaDemo()
    setEntrega(reiniciado)
    mostrarNotificacion('Ruta de demostración reiniciada correctamente.')
  }

  // Activar GPS Real del dispositivo móvil/laptop
  const toggleGpsReal = () => {
    if (!navigator.geolocation) {
      alert('Tu navegador o dispositivo no soporta geolocalización GPS.')
      return
    }

    if (gpsActivo) {
      navigator.geolocation.clearWatch(watchIdRef.current)
      watchIdRef.current = null
      setGpsActivo(false)
      mostrarNotificacion('GPS desactivado. Puedes usar la simulación interactiva.')
    } else {
      setSimulando(false)
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsActivo(true)
          const telemetria = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            velocidadKmH: Math.round((pos.coords.speed || 0) * 3.6),
            nuevoEstado: 'en_camino',
          }
          actualizarPosicionRepartidor(telemetria)
          enviarTelemetriaSiCorresponde(telemetria, false)
          mostrarNotificacion('GPS conectado y sincronizado en tiempo real.')
        },
        (err) => {
          console.warn('Error obteniendo GPS', err)
          setGpsActivo(false)
          alert('No pudimos acceder a tu ubicación GPS. Por favor habilita los permisos del navegador.')
        },
        { enableHighAccuracy: true }
      )
      watchIdRef.current = id
    }
  }

  const avisarLlegada = async () => {
    const act = cambiarEstadoEntrega('llegando')
    setEntrega(act)
    if (act.ventaId) {
      const sincronizada = await sincronizarEstadoConBackend(act, 'llegando')
      if (sincronizada) setEntrega(sincronizada)
    }
    mostrarNotificacion('¡Notificación enviada al cliente: Has llegado a su domicilio!', 4000)
  }

  const confirmarCobroYEntrega = async () => {
    const act = cambiarEstadoEntrega('entregado')
    setEntrega(act)
    setSimulando(false)
    setMostrarModalCobro(false)

    if (act.ventaId) {
      const sincronizada = await sincronizarEstadoConBackend(act, 'entregado')
      if (sincronizada) {
        setEntrega(sincronizada)
      }
      recargarColaBackend()
    }
    mostrarNotificacion('¡Entrega completada y registrada en el sistema! Pedido finalizado.', 5000)
  }

  return (
    <div className="relative flex flex-1 min-h-0 flex-col h-full w-full overflow-hidden p-0 m-0">
      {/* Drawer Navegación Navbar */}
      <DrawerNavRepartidor
        abierto={menuDrawerAbierto}
        alCerrar={() => setMenuDrawerAbierto(false)}
      />

      {/* Alerta flotante de notificación */}
      {mensajeAlerta && (
        <div className="pointer-events-none fixed top-16 left-4 right-4 z-50 flex justify-center">
          <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl border border-blue-400/40 bg-[#0A2540]/95 px-4 py-3 text-xs font-bold text-white shadow-2xl backdrop-blur-md">
            <span>{mensajeAlerta}</span>
            <button
              type="button"
              onClick={() => setMensajeAlerta(null)}
              className="text-white/70 hover:text-white"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Selector flotante de pedidos reales desde MongoDB */}
      {colaEntregas.length > 0 && (
        <div className="pointer-events-none absolute top-20 left-3 z-30 max-w-[260px]">
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-[#e7e8ec]/30 bg-[#121212]/90 px-2.5 py-1.5 text-[11px] text-white shadow-lg backdrop-blur-md">
            <span className="shrink-0 font-bold text-[#2171ec]">Pedido:</span>
            <select
              value={entrega?.codigoVenta || ''}
              onChange={(e) => seleccionarEntrega(e.target.value)}
              aria-label="Seleccionar pedido a repartir"
              className="min-w-0 flex-1 cursor-pointer bg-transparent text-[11px] font-semibold text-white focus:outline-none"
            >
              {colaEntregas.map((item) => (
                <option key={item.codigoVenta} value={item.codigoVenta} className="bg-[#121212] text-white">
                  #{item.codigoVenta} · {item.cliente.nombre} ({item.estado})
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* MAPA PRINCIPAL */}
      <div className="relative h-full w-full flex-1 min-h-0">
        <MapaRepartidor
          entrega={entrega}
          simulando={simulando}
          velocidadSimulacion={velocidad}
          alAbrirMenu={() => setMenuDrawerAbierto(true)}
          alCambiarPunto={(_idx, _punto, telemetria) => {
            if (telemetria) {
              enviarTelemetriaSiCorresponde(
                telemetria,
                telemetria.nuevoEstado === 'llegando'
              )
            }
          }}
          seccionPedido={
            <SeccionPedidoEnCurso
              entrega={entrega}
              simulando={simulando}
              velocidad={velocidad}
              gpsActivo={gpsActivo}
              alToggleSimulacion={toggleSimulacion}
              alCambiarVelocidad={setVelocidad}
              alToggleGps={toggleGpsReal}
              alAvisarLlegada={avisarLlegada}
              alConfirmarEntrega={() => setMostrarModalCobro(true)}
              alReiniciarDemo={reiniciar}
            />
          }
          alLlegarDestino={() => {
            setSimulando(false)
            setMostrarModalCobro(true)
          }}
        />
      </div>

      {/* Modal de Confirmación de Entrega y Cobro */}
      {mostrarModalCobro && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>

            <h3 className="mt-4 text-center text-xl font-black text-slate-900">
              Confirmar Entrega #{entrega.codigoVenta}
            </h3>
            <p className="mt-1 text-center text-xs text-slate-500">
              Verifica haber entregado los cilindros e insumos y recaudado el pago correspondiente.
            </p>

            <div className="mt-5 rounded-xl bg-slate-50 p-4 text-xs space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-bold text-slate-800">{entrega.cliente.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dirección:</span>
                <span className="font-bold text-slate-800">{entrega.cliente.direccion}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                <span className="font-bold text-slate-700">Monto Total:</span>
                <span className="font-black text-emerald-600">
                  ${Number(entrega.total || 0).toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setMostrarModalCobro(false)}
                className="cursor-pointer rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Volver al Mapa
              </button>
              <button
                type="button"
                onClick={confirmarCobroYEntrega}
                className="cursor-pointer rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white shadow hover:bg-emerald-700 active:scale-95"
              >
                Finalizar Entrega
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Repartidor
