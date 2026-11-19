import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { MapaRepartidor } from '../components/mapa/MapaRepartidor.jsx'
import { SeccionPedidoEnCurso } from '../components/mapa/SeccionPedidoEnCurso.jsx'
import { DrawerNavRepartidor } from '../components/layouts/DrawerNavRepartidor.jsx'
import {
  obtenerEntregaActiva,
  reiniciarEntregaDemo,
  cambiarEstadoEntrega,
  suscribirCambiosEntrega,
  actualizarPosicionRepartidor,
} from '../service/repartoService.js'

export function Repartidor() {
  const [entrega, setEntrega] = useState(() => obtenerEntregaActiva())
  const [simulando, setSimulando] = useState(false)
  const [velocidad, setVelocidad] = useState(1)
  const [gpsActivo, setGpsActivo] = useState(false)
  const [menuDrawerAbierto, setMenuDrawerAbierto] = useState(false)
  const [mostrarModalCobro, setMostrarModalCobro] = useState(false)
  const [mensajeAlerta, setMensajeAlerta] = useState(null)
  const watchIdRef = useRef(null)

  // Sincronizar cambios en tiempo real con localStorage y eventos entre ventanas
  useEffect(() => {
    const cancelarSuscripcion = suscribirCambiosEntrega((datosActualizados) => {
      setEntrega(datosActualizados)
    })
    return () => cancelarSuscripcion()
  }, [])

  // Limpiar GPS al desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  const toggleSimulacion = () => {
    if (entrega.estado === 'entregado') {
      reiniciar()
      setSimulando(true)
      return
    }
    setSimulando(!simulando)
  }

  const reiniciar = () => {
    setSimulando(false)
    const reiniciado = reiniciarEntregaDemo()
    setEntrega(reiniciado)
    setMensajeAlerta('Ruta de demostración reiniciada correctamente.')
    setTimeout(() => setMensajeAlerta(null), 3000)
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
      setMensajeAlerta('GPS desactivado. Puedes usar la simulación interactiva.')
      setTimeout(() => setMensajeAlerta(null), 3000)
    } else {
      setSimulando(false)
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsActivo(true)
          actualizarPosicionRepartidor({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            velocidadKmH: Math.round((pos.coords.speed || 0) * 3.6),
          })
          setMensajeAlerta('GPS conectado en tiempo real.')
          setTimeout(() => setMensajeAlerta(null), 3000)
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

  const avisarLlegada = () => {
    const act = cambiarEstadoEntrega('llegando')
    setEntrega(act)
    setMensajeAlerta('¡Notificación enviada al cliente: Has llegado a su domicilio!')
    setTimeout(() => setMensajeAlerta(null), 4000)
  }

  const confirmarCobroYEntrega = () => {
    const act = cambiarEstadoEntrega('entregado')
    setEntrega(act)
    setSimulando(false)
    setMostrarModalCobro(false)
    setMensajeAlerta('¡Entrega completada exitosamente! Pedido finalizado.')
  }

  return (
    <div className="relative flex flex-1 min-h-0 flex-col h-full w-full overflow-hidden p-0 m-0">
      {/* Drawer Navegación Navbar (Se abre desde el botón hamburguesa dentro del mapa) */}
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

      {/* MAPA PRINCIPAL: Ocupa el 100% de la pantalla en móvil con controles integrados */}
      <div className="relative h-full w-full flex-1 min-h-0">
        <MapaRepartidor
          entrega={entrega}
          simulando={simulando}
          velocidadSimulacion={velocidad}
          alAbrirMenu={() => setMenuDrawerAbierto(true)}
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
              Confirmar Entrega de Gas
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
                <span className="font-bold text-slate-700">Monto Cobrado:</span>
                <span className="font-black text-emerald-600">
                  ${entrega.total.toLocaleString('es-CL')}
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
