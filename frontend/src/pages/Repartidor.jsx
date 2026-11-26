import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { MapaRepartidor } from '../components/mapa/MapaRepartidor.jsx'
import { SeccionPedidoEnCurso } from '../components/mapa/SeccionPedidoEnCurso.jsx'
import { PanelListaPedidosRepartidor } from '../components/mapa/PanelListaPedidosRepartidor.jsx'
import { DrawerNavRepartidor } from '../components/layouts/DrawerNavRepartidor.jsx'
import { useSesion } from '../context/Sesion.jsx'
import {
  COORDENADAS_PLANTA_ORIGEN,
  ENTREGA_EJEMPLO,
  guardarEntregaActiva,
  listarEntregasParaRepartidor,
  reiniciarEntregaDemo,
  cambiarEstadoEntrega,
  actualizarPosicionRepartidor,
  sincronizarPosicionConBackend,
  sincronizarEstadoConBackend,
  calcularMejorRutaEntregas,
  calcularMejorRutaConOSRM,
  calcularDistanciaKm,
} from '../service/repartoService.js'

const horaActualChile = () => {
  try {
    return new Date().toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Santiago',
    })
  } catch {
    return ''
  }
}

const obtenerNombreRepartidorSesion = (usuario) => {
  if (!usuario) return ''
  const completo = `${usuario.nombres || ''} ${usuario.apellidos || ''}`.trim()
  const directo = String(usuario.nombre || '').trim()
  const elegido = completo || directo
  if (!elegido || elegido.toLowerCase() === 'por asignar en planta') return ''
  return elegido
}

export function Repartidor() {
  const { usuario } = useSesion()
  const [entregaActiva, setEntregaActiva] = useState(null)
  const [colaEntregas, setColaEntregas] = useState([])
  const [cargandoPedidos, setCargandoPedidos] = useState(true)
  const [vistaListaAbierta, setVistaListaAbierta] = useState(true)
  const [tabLista, setTabLista] = useState('pendientes')
  const [posicionFurgon, setPosicionFurgon] = useState(() => ({
    ...COORDENADAS_PLANTA_ORIGEN,
  }))
  const [recorridoSesion, setRecorridoSesion] = useState([])
  const [ultimaEntregaCompletada, setUltimaEntregaCompletada] = useState(null)
  const [resultadoOsrm, setResultadoOsrm] = useState(null)
  const [calculandoRutaManual, setCalculandoRutaManual] = useState(false)
  const [refrescoRuta, setRefrescoRuta] = useState(0)

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

  // 1. Cargar cola real de entregas desde ms-venta (MongoDB) al abrir la vista
  const recargarColaBackend = useCallback(async () => {
    const lista = await listarEntregasParaRepartidor(usuario)
    if (lista.length > 0) {
      setColaEntregas(lista)
      return lista
    }
    return []
  }, [usuario])

  useEffect(() => {
    let montado = true
    listarEntregasParaRepartidor(usuario)
      .then((lista) => {
        if (!montado) return
        if (lista.length > 0) {
          setColaEntregas(lista)
        } else {
          setColaEntregas([ENTREGA_EJEMPLO])
        }
      })
      .finally(() => {
        if (montado) setCargandoPedidos(false)
      })

    return () => {
      montado = false
    }
  }, [usuario])

  // 2. Calcular mejor ruta automáticamente antes de elegir un pedido (instantáneo + OSRM real)
  const planLocal = useMemo(
    () => calcularMejorRutaEntregas(colaEntregas, posicionFurgon),
    [colaEntregas, posicionFurgon]
  )

  const claveRutaActual = useMemo(() => {
    const codigos = planLocal.paradas.map((p) => p.entrega.codigoVenta).sort().join(',')
    const latKey = Number(posicionFurgon?.lat || 0).toFixed(4)
    const lngKey = Number(posicionFurgon?.lng || 0).toFixed(4)
    return `${codigos}|${latKey},${lngKey}|${refrescoRuta}`
  }, [planLocal.paradas, posicionFurgon?.lat, posicionFurgon?.lng, refrescoRuta])

  useEffect(() => {
    let cancelado = false
    if (planLocal.paradas.length < 2) return undefined

    calcularMejorRutaConOSRM(colaEntregas, posicionFurgon)
      .then((plan) => {
        if (cancelado) return
        setResultadoOsrm({ clave: claveRutaActual, plan })
      })
      .finally(() => {
        if (!cancelado) setCalculandoRutaManual(false)
      })

    return () => {
      cancelado = true
    }
  }, [claveRutaActual, colaEntregas, posicionFurgon, planLocal.paradas.length])

  const planOptimo =
    resultadoOsrm?.clave === claveRutaActual ? resultadoOsrm.plan : planLocal

  const cantidadPendientes = planOptimo.paradas.length

  // 3. Combinar recorrido de la sesión actual con entregas ya completadas en el sistema
  const recorridoEntregado = useMemo(() => {
    const mapaCodigos = new Set(recorridoSesion.map((r) => r.codigoVenta))
    const entregadosHistoricos = colaEntregas
      .filter(
        (e) => e.estado === 'entregado' && !mapaCodigos.has(e.codigoVenta)
      )
      .map((e) => ({
        codigoVenta: e.codigoVenta,
        cliente: e.cliente?.nombre || 'Cliente',
        direccion: e.cliente?.direccion || 'Puente Alto',
        total: Number(e.total || 0),
        metodoPago: e.subMetodoPago || e.metodoPago || '',
        distanciaRecorridaKm:
          e.distanciaKm > 0
            ? Number(e.distanciaKm.toFixed(1))
            : Number(
                calcularDistanciaKm(
                  e.origen?.lat ?? COORDENADAS_PLANTA_ORIGEN.lat,
                  e.origen?.lng ?? COORDENADAS_PLANTA_ORIGEN.lng,
                  e.cliente?.coordenadas?.lat ?? COORDENADAS_PLANTA_ORIGEN.lat,
                  e.cliente?.coordenadas?.lng ?? COORDENADAS_PLANTA_ORIGEN.lng
                ).toFixed(1)
              ),
        horaEntrega: e.horaSalida || '',
      }))

    return [...recorridoSesion, ...entregadosHistoricos]
  }, [recorridoSesion, colaEntregas])

  // 4. Limpiar GPS al desmontar
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null && navigator.geolocation) {
        navigator.geolocation.clearWatch(watchIdRef.current)
      }
    }
  }, [])

  const recalcularMejorRuta = useCallback(async () => {
    setCalculandoRutaManual(true)
    const listaFresca = await recargarColaBackend()
    const base = listaFresca.length > 0 ? listaFresca : colaEntregas
    const plan = await calcularMejorRutaConOSRM(base, posicionFurgon)
    setRefrescoRuta((prev) => prev + 1)
    setResultadoOsrm({
      clave: `${plan.paradas.map((p) => p.entrega.codigoVenta).sort().join(',')}|${Number(posicionFurgon?.lat || 0).toFixed(4)},${Number(posicionFurgon?.lng || 0).toFixed(4)}|${refrescoRuta + 1}`,
      plan,
    })
    setCalculandoRutaManual(false)
    mostrarNotificacion(
      plan.pedidoRecomendado
        ? `Mejor ruta actualizada: te conviene iniciar con #${plan.pedidoRecomendado.codigoVenta}`
        : 'Lista de entregas actualizada.'
    )
  }, [recargarColaBackend, colaEntregas, posicionFurgon, refrescoRuta, mostrarNotificacion])

  const nombreRepartidorActual = useMemo(
    () => obtenerNombreRepartidorSesion(usuario),
    [usuario]
  )

  const seleccionarPedidoParaRuta = useCallback(
    (pedidoElegido) => {
      if (!pedidoElegido) return
      setSimulando(false)

      const nombreAsignado =
        nombreRepartidorActual ||
        (pedidoElegido.repartidor?.asignado
          ? pedidoElegido.repartidor.nombre
          : '')

      // Si vuelve al mismo pedido ya en curso en el mapa, asegurar repartidor asignado y continuar
      if (
        entregaActiva &&
        entregaActiva.codigoVenta === pedidoElegido.codigoVenta &&
        entregaActiva.estado !== 'entregado'
      ) {
        if (nombreAsignado && !entregaActiva.repartidor?.asignado) {
          const conRepartidor = guardarEntregaActiva({
            ...entregaActiva,
            repartidor: {
              ...entregaActiva.repartidor,
              nombre: nombreAsignado,
              asignado: true,
            },
          })
          setEntregaActiva(conRepartidor)
          if (conRepartidor.ventaId) {
            sincronizarEstadoConBackend(conRepartidor, 'en_camino', nombreAsignado)
          }
        }
        setVistaListaAbierta(false)
        return
      }

      const paradaOptima = planOptimo.paradas.find(
        (p) => p.entrega.codigoVenta === pedidoElegido.codigoVenta
      )
      const repartidorActualizado = nombreAsignado
        ? {
            ...pedidoElegido.repartidor,
            id: `REP-${nombreAsignado.slice(0, 3).toUpperCase()}`,
            nombre: nombreAsignado,
            asignado: true,
          }
        : pedidoElegido.repartidor

      const preparada = guardarEntregaActiva({
        ...pedidoElegido,
        estado:
          pedidoElegido.estado === 'pendiente' ||
          pedidoElegido.estado === 'asignado'
            ? 'en_camino'
            : pedidoElegido.estado,
        repartidor: repartidorActualizado,
        origen: { ...posicionFurgon },
        distanciaKm: paradaOptima?.distanciaDesdeActualKm ?? pedidoElegido.distanciaKm,
        etaMinutos: paradaOptima?.etaTramoMin ?? pedidoElegido.etaMinutos,
        posicionActual: {
          lat: posicionFurgon.lat,
          lng: posicionFurgon.lng,
          indicePunto: 0,
          rumbo: 180,
        },
      })

      setEntregaActiva(preparada)
      setColaEntregas((prev) =>
        prev.map((item) =>
          item.codigoVenta === preparada.codigoVenta
            ? {
                ...item,
                estado: preparada.estado,
                repartidor: repartidorActualizado,
              }
            : item
        )
      )
      setVistaListaAbierta(false)
      setUltimaEntregaCompletada(null)

      // Persistir inmediatamente en MongoDB el repartidor asignado y estado 'en_camino'
      if (preparada.ventaId) {
        sincronizarEstadoConBackend(
          preparada,
          'en_camino',
          nombreAsignado || undefined
        )
      }

      mostrarNotificacion(
        `Ruta activa hacia #${preparada.codigoVenta} (${preparada.cliente.nombre})`
      )
    },
    [
      entregaActiva,
      nombreRepartidorActual,
      planOptimo.paradas,
      posicionFurgon,
      mostrarNotificacion,
    ]
  )

  const abrirPlanificadorDesdeMapa = useCallback(() => {
    setSimulando(false)
    setTabLista('pendientes')
    setVistaListaAbierta(true)
    setRefrescoRuta((prev) => prev + 1)
  }, [])

  const enviarTelemetriaSiCorresponde = useCallback(
    (telemetria, forzar = false) => {
      if (!entregaActiva) return
      const ahora = Date.now()
      if (!forzar && ahora - ultimoEnvioBackendRef.current < 2500) {
        return
      }
      ultimoEnvioBackendRef.current = ahora
      const entregaConRepartidor =
        nombreRepartidorActual && !entregaActiva.repartidor?.asignado
          ? {
              ...entregaActiva,
              repartidor: {
                ...entregaActiva.repartidor,
                nombre: nombreRepartidorActual,
                asignado: true,
              },
            }
          : entregaActiva
      sincronizarPosicionConBackend(entregaConRepartidor, telemetria)
    },
    [entregaActiva, nombreRepartidorActual]
  )

  const toggleSimulacion = async () => {
    if (!entregaActiva) return
    if (entregaActiva.estado === 'entregado') {
      reiniciar()
      setSimulando(true)
      return
    }
    const proximo = !simulando
    setSimulando(proximo)

    if (proximo && entregaActiva.ventaId) {
      const nombreRep =
        nombreRepartidorActual ||
        (entregaActiva.repartidor?.asignado
          ? entregaActiva.repartidor.nombre
          : '')
      if (nombreRep || entregaActiva.estado !== 'en_camino') {
        const sincronizada = await sincronizarEstadoConBackend(
          entregaActiva,
          'en_camino',
          nombreRep || undefined
        )
        if (sincronizada) setEntregaActiva(sincronizada)
      }
    }
  }

  const reiniciar = () => {
    if (!entregaActiva) return
    setSimulando(false)
    if (entregaActiva.ventaId) {
      const reiniciadoReal = guardarEntregaActiva({
        ...entregaActiva,
        estado: 'en_camino',
        posicionActual: {
          lat: posicionFurgon.lat,
          lng: posicionFurgon.lng,
          indicePunto: 0,
          rumbo: 180,
        },
      })
      setEntregaActiva(reiniciadoReal)
      sincronizarEstadoConBackend(
        reiniciadoReal,
        'en_camino',
        nombreRepartidorActual || undefined
      )
      mostrarNotificacion(`Recorrido de #${entregaActiva.codigoVenta} reiniciado.`)
      return
    }
    const reiniciado = reiniciarEntregaDemo()
    setEntregaActiva(reiniciado)
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
      mostrarNotificacion(
        'GPS desactivado. Puedes usar la simulación interactiva.'
      )
    } else {
      setSimulando(false)
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          setGpsActivo(true)
          const nuevaUbicacion = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            nombre: 'Ubicación GPS actual',
            direccion: 'Posición actual del furgón',
          }
          setPosicionFurgon(nuevaUbicacion)
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
          alert(
            'No pudimos acceder a tu ubicación GPS. Por favor habilita los permisos del navegador.'
          )
        },
        { enableHighAccuracy: true }
      )
      watchIdRef.current = id
    }
  }

  const avisarLlegada = async () => {
    if (!entregaActiva) return
    const act = cambiarEstadoEntrega('llegando')
    setEntregaActiva(act)
    if (act.ventaId) {
      const sincronizada = await sincronizarEstadoConBackend(
        act,
        'llegando',
        nombreRepartidorActual || undefined
      )
      if (sincronizada) setEntregaActiva(sincronizada)
    }
    mostrarNotificacion(
      '¡Notificación enviada al cliente: Has llegado a su domicilio!',
      4000
    )
  }

  // Al entregar el pedido: registrar en recorrido, mover punto actual, recalcular y mostrar listado de recorrido
  const confirmarCobroYEntrega = async () => {
    if (!entregaActiva) return
    const pedidoEntregado = entregaActiva
    const act = cambiarEstadoEntrega('entregado')

    setSimulando(false)
    setMostrarModalCobro(false)

    const destinoEntregado = pedidoEntregado.cliente?.coordenadas || {
      lat: posicionFurgon.lat,
      lng: posicionFurgon.lng,
    }
    const distanciaTramo = Number(
      (
        pedidoEntregado.distanciaKm ||
        calcularDistanciaKm(
          pedidoEntregado.origen?.lat ?? posicionFurgon.lat,
          pedidoEntregado.origen?.lng ?? posicionFurgon.lng,
          destinoEntregado.lat,
          destinoEntregado.lng
        ) ||
        1.2
      ).toFixed(1)
    )

    const registroParada = {
      codigoVenta: pedidoEntregado.codigoVenta,
      cliente: pedidoEntregado.cliente?.nombre || 'Cliente',
      direccion: pedidoEntregado.cliente?.direccion || 'Puente Alto',
      total: Number(pedidoEntregado.total || 0),
      metodoPago: pedidoEntregado.subMetodoPago || pedidoEntregado.metodoPago || '',
      distanciaRecorridaKm: distanciaTramo,
      horaEntrega: horaActualChile(),
    }

    setRecorridoSesion((prev) => [
      ...prev.filter((item) => item.codigoVenta !== registroParada.codigoVenta),
      registroParada,
    ])
    setUltimaEntregaCompletada(registroParada)

    // Actualizar posición actual del furgón al domicilio recién entregado para recalcular el siguiente más cómodo
    setPosicionFurgon({
      lat: destinoEntregado.lat,
      lng: destinoEntregado.lng,
      nombre: `Última entrega (${pedidoEntregado.cliente?.nombre || pedidoEntregado.codigoVenta})`,
      direccion: pedidoEntregado.cliente?.direccion || 'Puente Alto',
    })

    // Actualizar cola local inmediatamente y luego sincronizar con backend
    setColaEntregas((prev) =>
      prev.map((item) =>
        item.codigoVenta === pedidoEntregado.codigoVenta
          ? { ...item, estado: 'entregado', estadoPago: 'pagado' }
          : item
      )
    )

    setEntregaActiva(null)
    setTabLista('recorrido')
    setVistaListaAbierta(true)
    setRefrescoRuta((prev) => prev + 1)

    if (act.ventaId) {
      await sincronizarEstadoConBackend(act, 'entregado')
      await recargarColaBackend()
    }

    mostrarNotificacion(
      `¡Entrega #${pedidoEntregado.codigoVenta} completada! Aquí tienes tu recorrido y la siguiente mejor ruta.`,
      5000
    )
  }

  return (
    <div className="relative m-0 flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden p-0">
      {/* Drawer Navegación Navbar */}
      <DrawerNavRepartidor
        abierto={menuDrawerAbierto}
        alCerrar={() => setMenuDrawerAbierto(false)}
      />

      {/* Alerta flotante de notificación */}
      {mensajeAlerta && (
        <div className="pointer-events-none fixed top-16 right-4 left-4 z-50 flex justify-center">
          <div className="pointer-events-auto flex items-center justify-between gap-3 rounded-2xl bg-[#0A2540]/95 px-4 py-3 text-xs font-bold text-white shadow-2xl backdrop-blur-md">
            <span>{mensajeAlerta}</span>
            <button
              type="button"
              onClick={() => setMensajeAlerta(null)}
              className="cursor-pointer text-white/70 hover:text-white"
              aria-label="Cerrar notificación"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* VISTA PRINCIPAL: Mapa 3D cuando hay pedido seleccionado + Planificador superpuesto al abrirlo */}
      <div className="relative h-full min-h-0 w-full flex-1">
        {entregaActiva && (
          <MapaRepartidor
            entrega={entregaActiva}
            simulando={simulando}
            velocidadSimulacion={velocidad}
            alAbrirMenu={() => setMenuDrawerAbierto(true)}
            alAbrirListaPedidos={abrirPlanificadorDesdeMapa}
            cantidadPendientes={cantidadPendientes}
            alCambiarPunto={(_idx, punto, telemetria) => {
              if (Array.isArray(punto) && punto.length === 2) {
                setPosicionFurgon((prev) => ({
                  ...prev,
                  lat: punto[0],
                  lng: punto[1],
                  nombre: 'En ruta',
                  direccion: `En camino a ${entregaActiva.cliente?.direccion || 'destino'}`,
                }))
              }
              if (telemetria) {
                enviarTelemetriaSiCorresponde(
                  telemetria,
                  telemetria.nuevoEstado === 'llegando'
                )
              }
            }}
            seccionPedido={
              <SeccionPedidoEnCurso
                entrega={entregaActiva}
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
        )}

        {(vistaListaAbierta || !entregaActiva) && (
          <div className="absolute inset-0 z-40 h-full w-full">
            <PanelListaPedidosRepartidor
              planOptimo={planOptimo}
              calculandoRuta={calculandoRutaManual}
              recorridoEntregado={recorridoEntregado}
              tabActiva={tabLista}
              alCambiarTab={setTabLista}
              alSeleccionarPedido={seleccionarPedidoParaRuta}
              alRecalcularRuta={recalcularMejorRuta}
              alAbrirMenu={() => setMenuDrawerAbierto(true)}
              alVolverAlMapa={() => setVistaListaAbierta(false)}
              puedeVolverAlMapa={Boolean(entregaActiva)}
              codigoPedidoEnMapa={entregaActiva?.codigoVenta || null}
              cargandoPedidos={cargandoPedidos}
              ultimaEntregaCompletada={ultimaEntregaCompletada}
            />
          </div>
        )}
      </div>

      {/* Modal de Confirmación de Entrega y Cobro */}
      {mostrarModalCobro && entregaActiva && (
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
              Confirmar Entrega #{entregaActiva.codigoVenta}
            </h3>
            <p className="mt-1 text-center text-xs text-slate-500">
              Verifica haber entregado los cilindros e insumos y recaudado el pago correspondiente.
            </p>

            <div className="mt-5 space-y-2 rounded-xl bg-slate-50 p-4 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-bold text-slate-800">{entregaActiva.cliente.nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Dirección:</span>
                <span className="font-bold text-slate-800">{entregaActiva.cliente.direccion}</span>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-2 text-sm">
                <span className="font-bold text-slate-700">Monto Total:</span>
                <span className="font-black text-emerald-600">
                  ${Number(entregaActiva.total || 0).toLocaleString('es-CL')}
                </span>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setMostrarModalCobro(false)}
                className="cursor-pointer rounded-xl bg-slate-100 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-200"
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
