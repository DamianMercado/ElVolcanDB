import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import * as maplibregl from 'maplibre-gl'
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url'
import {
  COORDENADAS_PLANTA_ORIGEN,
  COORDENADAS_CLIENTE_DESTINO,
  obtenerRutaOSRM,
  calcularRumbo,
  actualizarPosicionRepartidor,
  obtenerAlertasRutaPedido,
  sincronizarAlertasRutaConBackend,
} from '../../service/repartoService'
import { PALETA_MAPA_UBER } from '../../utils/mapaTiles'
import {
  crearEstiloVectorialUber,
  resolverConfigCartoVector,
} from '../../utils/estiloMapaWaze'

if (typeof maplibregl.setWorkerUrl === 'function' && maplibreWorkerUrl) {
  maplibregl.setWorkerUrl(maplibreWorkerUrl)
}

const ALERTAS_WAZE = [
  {
    id: 'fluido',
    etiqueta: 'Tráfico fluido',
    color: PALETA_MAPA_UBER.dinamica.traficoFluido,
    textoColor: '#FFFFFF',
  },
  {
    id: 'trafico',
    etiqueta: 'Tráfico lento',
    color: PALETA_MAPA_UBER.dinamica.demandaModerada,
    textoColor: '#121212',
  },
  {
    id: 'congestion',
    etiqueta: 'Congestión / Desvío',
    color: PALETA_MAPA_UBER.dinamica.demandaAlta,
    textoColor: '#FFFFFF',
  },
  {
    id: 'detenido',
    etiqueta: 'Tráfico detenido',
    color: PALETA_MAPA_UBER.dinamica.traficoDetenido,
    textoColor: '#FFFFFF',
  },
  {
    id: 'bonificacion',
    etiqueta: 'Zona de bonificación',
    color: PALETA_MAPA_UBER.dinamica.bonificacion,
    textoColor: '#FFFFFF',
  },
]

const calcularPaddingCamaraWaze = (contenedor) => {
  const alto = contenedor?.clientHeight || 720
  return {
    top: Math.round(alto * 0.46),
    bottom: Math.round(alto * 0.16),
    left: 16,
    right: 16,
  }
}

const aLngLat = (punto) => [punto[1], punto[0]]

const soportaWebGL = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test') {
    return false
  }
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') || canvas.getContext('webgl'))
    )
  } catch {
    return false
  }
}

const crearElementoCursorWaze = () => {
  const el = document.createElement('div')
  el.style.width = '54px'
  el.style.height = '54px'
  el.style.display = 'flex'
  el.style.alignItems = 'center'
  el.style.justifyContent = 'center'
  el.style.pointerEvents = 'auto'
  el.innerHTML = `
    <div style="position:relative;display:flex;align-items:center;justify-content:center;width:54px;height:54px;">
      <span style="position:absolute;width:46px;height:46px;border-radius:9999px;background:rgba(71,136,255,0.28);box-shadow:0 0 18px rgba(39,110,241,0.55);"></span>
      <svg width="38" height="38" viewBox="0 0 36 36" fill="none" style="position:relative;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.55));">
        <path d="M18 3L31 30L18 24.2L5 30L18 3Z" fill="#4788FF" stroke="#FFFFFF" stroke-width="2.6" stroke-linejoin="round"/>
      </svg>
    </div>
  `
  return el
}

const crearElementoDestino = () => {
  const el = document.createElement('div')
  el.innerHTML = `
    <div class="pin-contenedor-destino">
      <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    </div>
  `
  return el
}

const crearElementoOrigen = () => {
  const el = document.createElement('div')
  el.innerHTML = `
    <div class="pin-contenedor-origen">
      <svg class="w-5 h-5 text-[#276EF1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
      </svg>
    </div>
  `
  return el
}

const crearElementoAlerta = (color = '#FFC043', textoColor = '#121212') => {
  const el = document.createElement('div')
  el.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:center;width:32px;height:32px;border-radius:9999px;background:${color};color:${textoColor};box-shadow:0 4px 12px rgba(0,0,0,0.45);font-weight:900;font-size:15px;">
      !
    </div>
  `
  return el
}

const crearGeoJsonLinea = (coords = []) => ({
  type: 'Feature',
  properties: {},
  geometry: {
    type: 'LineString',
    coordinates: coords,
  },
})

const crearRegistroAlertaRuta = (alerta, punto, reportadoPor) => {
  let horaChile
  try {
    horaChile = new Date().toLocaleTimeString('es-CL', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      timeZone: 'America/Santiago',
    })
  } catch {
    horaChile = ''
  }

  return {
    id: `alerta-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    tipo: alerta.id,
    etiqueta: alerta.etiqueta,
    color: alerta.color,
    textoColor: alerta.textoColor,
    lat: punto[0],
    lng: punto[1],
    horaChile,
    reportadoPor: reportadoPor || 'Repartidor',
  }
}

export function MapaRepartidor({
  entrega,
  simulando,
  velocidadSimulacion = 1,
  alCambiarPunto,
  alLlegarDestino,
  alAbrirMenu,
  alAbrirListaPedidos,
  cantidadPendientes = 0,
  seccionPedido,
}) {
  const contenedorRef = useRef(null)
  const mapaRef = useRef(null)
  const marcadorCamionRef = useRef(null)
  const marcadorDestinoRef = useRef(null)
  const marcadorOrigenRef = useRef(null)
  const marcadoresAlertasRef = useRef([])
  const seguirCamionRef = useRef(true)
  const rumboActualRef = useRef(entrega?.posicionActual?.rumbo || 180)
  const indiceActualRef = useRef(entrega?.posicionActual?.indicePunto || 0)
  const coordsRecorridaRef = useRef([])
  const coordsActivaRef = useRef([])
  const modoOscuroRef = useRef(true)
  const proveedorMapaRef = useRef('carto')
  const configCartoRef = useRef(null)
  const erroresProveedorRef = useRef(0)
  const estiloInicializadoRef = useRef(false)
  const ultimaVozRef = useRef('')

  const [rutaPuntos, setRutaPuntos] = useState([])
  const [pasos, setPasos] = useState([])
  const [indiceActual, setIndiceActual] = useState(
    entrega?.posicionActual?.indicePunto || 0
  )
  const [indicePasoActual, setIndicePasoActual] = useState(0)
  const [distanciaTotalKm, setDistanciaTotalKm] = useState(2.4)
  const [duracionTotalMin, setDuracionTotalMin] = useState(9)
  const [velocidadActualKmH, setVelocidadActualKmH] = useState(0)
  const [modoOscuro, setModoOscuro] = useState(true)
  const [proveedorMapa, setProveedorMapa] = useState('carto')
  const [vistaWaze3D, setVistaWaze3D] = useState(true)
  const [siguiendoCamion, setSiguiendoCamion] = useState(true)
  const [vozActiva, setVozActiva] = useState(false)
  const [panelAlertasAbierto, setPanelAlertasAbierto] = useState(false)
  const [alertasPorPedido, setAlertasPorPedido] = useState({})
  const ultimaAlertaCreadaIdRef = useRef(null)

  const codigoPedidoActual = String(entrega?.codigoVenta || entrega?.id || 'demo')
  const alertasEntrega = entrega?.alertasRuta
  const alertasActivas = useMemo(() => {
    if (alertasPorPedido[codigoPedidoActual] !== undefined) {
      return alertasPorPedido[codigoPedidoActual]
    }
    if (Array.isArray(alertasEntrega) && alertasEntrega.length > 0) {
      return alertasEntrega
    }
    return obtenerAlertasRutaPedido(codigoPedidoActual)
  }, [alertasPorPedido, codigoPedidoActual, alertasEntrega])
  const totalAlertas = alertasActivas.length

  const origenLat = entrega?.origen?.lat ?? COORDENADAS_PLANTA_ORIGEN.lat
  const origenLng = entrega?.origen?.lng ?? COORDENADAS_PLANTA_ORIGEN.lng
  const destinoLat =
    entrega?.cliente?.coordenadas?.lat ?? COORDENADAS_CLIENTE_DESTINO.lat
  const destinoLng =
    entrega?.cliente?.coordenadas?.lng ?? COORDENADAS_CLIENTE_DESTINO.lng

  const pasoActual = pasos[indicePasoActual] || null
  const siguientePaso = pasos[indicePasoActual + 1] || null

  const actualizarFuentesRuta = useCallback((mapa, recorrida, activa) => {
    coordsRecorridaRef.current = recorrida
    coordsActivaRef.current = activa
    if (!mapa) return
    try {
      const srcRec = mapa.getSource('ruta-recorrida')
      const srcAct = mapa.getSource('ruta-activa')
      if (srcRec && typeof srcRec.setData === 'function') {
        srcRec.setData(crearGeoJsonLinea(recorrida))
      }
      if (srcAct && typeof srcAct.setData === 'function') {
        srcAct.setData(crearGeoJsonLinea(activa))
      }
    } catch {
      // El estilo aún está cargando; se sincronizará al cargar
    }
  }, [])

  const enfocarCamaraWaze = useCallback(
    (puntoLatLng, rumbo, usar3D = true, duracion = 550) => {
      const mapa = mapaRef.current
      if (!mapa || !puntoLatLng) return
      const [lat, lng] = puntoLatLng
      mapa.easeTo({
        center: [lng, lat],
        zoom: usar3D ? 17.4 : 16,
        pitch: usar3D ? 58 : 0,
        bearing: usar3D ? rumbo : 0,
        padding: usar3D
          ? calcularPaddingCamaraWaze(contenedorRef.current)
          : { top: 100, bottom: 160, left: 20, right: 20 },
        duration: duracion,
        essential: true,
      })
    },
    []
  )

  // 1. Inicializar MapLibre GL JS una sola vez (vectorial 3D + rotación 360° real)
  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current || !soportaWebGL()) return

    const rumboInicial = rumboActualRef.current
    const mapa = new maplibregl.Map({
      container: contenedorRef.current,
      style: crearEstiloVectorialUber(
        true,
        [],
        [],
        proveedorMapaRef.current,
        configCartoRef.current
      ),
      center: [COORDENADAS_PLANTA_ORIGEN.lng, COORDENADAS_PLANTA_ORIGEN.lat],
      zoom: 17.4,
      pitch: 58,
      bearing: rumboInicial,
      maxPitch: 68,
      attributionControl: false,
    })

    mapa.addControl(
      new maplibregl.AttributionControl({ compact: true }),
      'bottom-right'
    )

    // Actualizar en segundo plano el snapshot vigente de CARTO v2 si cambió
    let desmontado = false
    resolverConfigCartoVector().then((cfg) => {
      if (desmontado || !cfg || !mapaRef.current) return
      const tileActual =
        mapaRef.current.getStyle()?.sources?.['carto-streets']?.tiles?.[0]
      configCartoRef.current = cfg
      if (
        proveedorMapaRef.current === 'carto' &&
        tileActual &&
        tileActual !== cfg.tiles[0]
      ) {
        mapaRef.current.setStyle(
          crearEstiloVectorialUber(
            modoOscuroRef.current,
            coordsRecorridaRef.current,
            coordsActivaRef.current,
            'carto',
            cfg
          )
        )
      }
    })

    // Respaldo automático de proveedor si un servidor de teselas falla o está bloqueado
    mapa.on('error', (evento) => {
      const fuenteError = evento?.sourceId
      const esErrorRed =
        fuenteError === 'carto-streets' ||
        fuenteError === 'openmaptiles' ||
        /AJAXError|Failed to fetch|404|403|NetworkError/i.test(
          evento?.error?.message || ''
        )
      if (!esErrorRed) return

      erroresProveedorRef.current += 1
      if (erroresProveedorRef.current < 2) return

      const actual = proveedorMapaRef.current
      const siguiente =
        actual === 'carto'
          ? 'openfreemap'
          : actual === 'openfreemap'
          ? 'raster'
          : null

      if (!siguiente) return
      erroresProveedorRef.current = 0
      proveedorMapaRef.current = siguiente
      setProveedorMapa(siguiente)
    })

    // Marcador Origen (Planta El Volcán)
    const popupOrigen = new maplibregl.Popup({ offset: 18 }).setHTML(
      `<div class="p-1 text-xs">
        <strong class="text-[#0A2540] font-bold text-sm">Planta El Volcán</strong>
        <p class="text-slate-600 mt-0.5">Centro de Distribución y Carga</p>
      </div>`
    )
    marcadorOrigenRef.current = new maplibregl.Marker({
      element: crearElementoOrigen(),
    })
      .setLngLat([COORDENADAS_PLANTA_ORIGEN.lng, COORDENADAS_PLANTA_ORIGEN.lat])
      .setPopup(popupOrigen)
      .addTo(mapa)

    // Marcador Destino (Cliente)
    marcadorDestinoRef.current = new maplibregl.Marker({
      element: crearElementoDestino(),
    })
      .setLngLat([
        COORDENADAS_CLIENTE_DESTINO.lng,
        COORDENADAS_CLIENTE_DESTINO.lat,
      ])
      .addTo(mapa)

    // Cursor Direccional estilo Waze (siempre alineado hacia adelante en la calle)
    marcadorCamionRef.current = new maplibregl.Marker({
      element: crearElementoCursorWaze(),
      rotationAlignment: 'map',
      pitchAlignment: 'map',
    })
      .setLngLat([COORDENADAS_PLANTA_ORIGEN.lng, COORDENADAS_PLANTA_ORIGEN.lat])
      .setRotation(rumboInicial)
      .addTo(mapa)

    mapa.on('style.load', () => {
      actualizarFuentesRuta(
        mapa,
        coordsRecorridaRef.current,
        coordsActivaRef.current
      )
    })

    mapa.on('dragstart', () => {
      seguirCamionRef.current = false
      setSiguiendoCamion(false)
    })

    mapaRef.current = mapa

    return () => {
      desmontado = true
      estiloInicializadoRef.current = false
      marcadoresAlertasRef.current.forEach((m) => m.remove())
      marcadoresAlertasRef.current = []
      mapa.remove()
      mapaRef.current = null
      marcadorCamionRef.current = null
      marcadorDestinoRef.current = null
      marcadorOrigenRef.current = null
    }
  }, [actualizarFuentesRuta])

  // Actualizar marcadores cuando cambia la entrega activa
  useEffect(() => {
    if (marcadorOrigenRef.current) {
      marcadorOrigenRef.current.setLngLat([origenLng, origenLat])
    }

    if (marcadorDestinoRef.current) {
      marcadorDestinoRef.current.setLngLat([destinoLng, destinoLat])
      marcadorDestinoRef.current.setPopup(
        new maplibregl.Popup({ offset: 18 }).setHTML(
          `<div class="p-1 text-xs">
            <strong class="text-[#276EF1] font-bold text-sm">Destino de Entrega</strong>
            <p class="font-semibold text-slate-800">${entrega?.cliente?.nombre || 'Cliente'}</p>
            <p class="text-slate-600">${entrega?.cliente?.direccion || 'Puente Alto'}</p>
          </div>`
        )
      )
    }

    if (marcadorCamionRef.current && coordsActivaRef.current.length === 0) {
      const lat = entrega?.posicionActual?.lat ?? origenLat
      const lng = entrega?.posicionActual?.lng ?? origenLng
      marcadorCamionRef.current.setLngLat([lng, lat])
      marcadorCamionRef.current.setRotation(rumboActualRef.current)
    }
  }, [
    destinoLat,
    destinoLng,
    origenLat,
    origenLng,
    entrega?.cliente?.nombre,
    entrega?.cliente?.direccion,
    entrega?.posicionActual?.lat,
    entrega?.posicionActual?.lng,
  ])

  // Cambiar tema (Nocturno / Día) o proveedor de respaldo preservando la ruta cargada
  useEffect(() => {
    modoOscuroRef.current = modoOscuro
    if (!mapaRef.current) return
    if (!estiloInicializadoRef.current) {
      estiloInicializadoRef.current = true
      return
    }
    mapaRef.current.setStyle(
      crearEstiloVectorialUber(
        modoOscuro,
        coordsRecorridaRef.current,
        coordsActivaRef.current,
        proveedorMapa,
        configCartoRef.current
      )
    )
  }, [modoOscuro, proveedorMapa])

  // Guía de voz paso a paso estilo Waze (Web Speech API en español)
  useEffect(() => {
    if (!vozActiva || !pasoActual?.instruccion) return
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

    const frase = pasoActual.distancia
      ? `En ${pasoActual.distancia} metros, ${pasoActual.instruccion}`
      : pasoActual.instruccion

    if (ultimaVozRef.current === frase) return
    ultimaVozRef.current = frase

    try {
      window.speechSynthesis.cancel()
      const mensaje = new window.SpeechSynthesisUtterance(frase)
      mensaje.lang = 'es-CL'
      mensaje.rate = 1.05
      window.speechSynthesis.speak(mensaje)
    } catch {
      // Ignorar si el navegador bloquea síntesis de voz sin gesto previo
    }
  }, [vozActiva, pasoActual])

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        try {
          window.speechSynthesis.cancel()
        } catch {
          // Ignorar
        }
      }
    }
  }, [])

  // 2. Cargar Ruta Real OSRM y orientar cámara de frente hacia el primer tramo
  useEffect(() => {
    let cancelado = false
    const cargarRuta = async () => {
      const res = await obtenerRutaOSRM(
        { lat: origenLat, lng: origenLng },
        { lat: destinoLat, lng: destinoLng }
      )
      if (cancelado) return

      const puntos = res.puntos || []
      setRutaPuntos(puntos)
      setPasos(res.pasos || [])
      setDistanciaTotalKm(res.distanciaKm || 2.4)
      setDuracionTotalMin(res.duracionMinutos || 9)
      setIndicePasoActual(0)
      indiceActualRef.current = 0
      setIndiceActual(0)
      setVelocidadActualKmH(0)
      ultimaVozRef.current = ''

      if (puntos.length > 0) {
        const puntoInicio = puntos[0]
        const puntoMira = puntos[Math.min(2, puntos.length - 1)]
        const rumboInicio = calcularRumbo(
          puntoInicio[0],
          puntoInicio[1],
          puntoMira[0],
          puntoMira[1]
        )
        rumboActualRef.current = rumboInicio

        if (marcadorCamionRef.current) {
          marcadorCamionRef.current.setLngLat(aLngLat(puntoInicio))
          marcadorCamionRef.current.setRotation(rumboInicio)
        }

        actualizarFuentesRuta(mapaRef.current, [], puntos.map(aLngLat))

        seguirCamionRef.current = true
        setSiguiendoCamion(true)
        enfocarCamaraWaze(puntoInicio, rumboInicio, true, 700)
      }
    }

    cargarRuta()
    return () => {
      cancelado = true
    }
  }, [
    origenLat,
    origenLng,
    destinoLat,
    destinoLng,
    entrega?.codigoVenta,
    actualizarFuentesRuta,
    enfocarCamaraWaze,
  ])

  // 3. Actualizar capas GeoJSON de ruta cuando cambia el índice actual
  useEffect(() => {
    if (!rutaPuntos.length) return
    const recorrido = rutaPuntos.slice(0, indiceActual + 1).map(aLngLat)
    const restante = rutaPuntos.slice(indiceActual).map(aLngLat)
    actualizarFuentesRuta(mapaRef.current, recorrido, restante)
  }, [rutaPuntos, indiceActual, actualizarFuentesRuta])

  // 4. Mover el cursor y rotar suavemente la cámara mirando siempre hacia adelante
  const moverCamion = useCallback(
    (nuevoIndice) => {
      if (!rutaPuntos.length || nuevoIndice >= rutaPuntos.length) return

      const punto = rutaPuntos[nuevoIndice]
      // Mirar 1-2 puntos adelante para giros suaves de cámara como Waze
      const puntoAdelante =
        rutaPuntos[Math.min(nuevoIndice + 2, rutaPuntos.length - 1)] || punto
      const rumbo =
        punto[0] === puntoAdelante[0] && punto[1] === puntoAdelante[1]
          ? rumboActualRef.current
          : calcularRumbo(
              punto[0],
              punto[1],
              puntoAdelante[0],
              puntoAdelante[1]
            )

      rumboActualRef.current = rumbo

      if (marcadorCamionRef.current) {
        marcadorCamionRef.current.setLngLat(aLngLat(punto))
        marcadorCamionRef.current.setRotation(rumbo)
      }

      if (seguirCamionRef.current) {
        const duracionCam = Math.max(220, Math.round(900 / velocidadSimulacion))
        enfocarCamaraWaze(punto, rumbo, vistaWaze3D, duracionCam)
      }

      const totalPuntos = rutaPuntos.length
      const avanceRatio = (totalPuntos - nuevoIndice) / totalPuntos
      const distanciaRestanteKm = Number(
        (distanciaTotalKm * avanceRatio).toFixed(1)
      )
      const etaMinutos = Math.max(1, Math.round(duracionTotalMin * avanceRatio))
      const velocidadKmH =
        nuevoIndice >= totalPuntos - 1
          ? 0
          : Math.min(60, Math.round(32 + velocidadSimulacion * 6))

      if (pasos.length > 0) {
        const indicePaso = Math.min(
          Math.floor((nuevoIndice / totalPuntos) * pasos.length),
          pasos.length - 1
        )
        setIndicePasoActual(indicePaso)
      }

      const nuevoEstado =
        nuevoIndice >= totalPuntos - 1
          ? 'llegando'
          : nuevoIndice > 0
          ? 'en_camino'
          : 'asignado'

      const telemetria = {
        lat: punto[0],
        lng: punto[1],
        indicePunto: nuevoIndice,
        rumbo,
        distanciaRestanteKm,
        etaMinutos,
        velocidadKmH,
        nuevoEstado,
      }

      indiceActualRef.current = nuevoIndice
      setIndiceActual(nuevoIndice)
      setVelocidadActualKmH(velocidadKmH)
      actualizarPosicionRepartidor(telemetria)
      alCambiarPunto?.(nuevoIndice, punto, telemetria)

      if (nuevoIndice >= totalPuntos - 1) {
        alLlegarDestino?.()
      }
    },
    [
      rutaPuntos,
      pasos,
      distanciaTotalKm,
      duracionTotalMin,
      velocidadSimulacion,
      vistaWaze3D,
      enfocarCamaraWaze,
      alCambiarPunto,
      alLlegarDestino,
    ]
  )

  // 5. Simulación de movimiento automático paso a paso
  useEffect(() => {
    if (!simulando || !rutaPuntos.length) return

    const delay = Math.max(220, Math.round(1150 / velocidadSimulacion))

    const intervalo = setInterval(() => {
      const siguiente = indiceActualRef.current + 1
      if (siguiente >= rutaPuntos.length) {
        clearInterval(intervalo)
        return
      }
      moverCamion(siguiente)
    }, delay)

    return () => clearInterval(intervalo)
  }, [simulando, rutaPuntos, velocidadSimulacion, moverCamion])

  const reenfocarRepartidor = () => {
    seguirCamionRef.current = true
    setSiguiendoCamion(true)
    const punto = rutaPuntos[indiceActual] || [
      entrega?.posicionActual?.lat ?? origenLat,
      entrega?.posicionActual?.lng ?? origenLng,
    ]
    enfocarCamaraWaze(punto, rumboActualRef.current, vistaWaze3D, 500)
  }

  const verRutaCompleta = () => {
    seguirCamionRef.current = false
    setSiguiendoCamion(false)
    if (mapaRef.current && rutaPuntos.length > 0) {
      const bounds = new maplibregl.LngLatBounds()
      rutaPuntos.forEach((p) => bounds.extend(aLngLat(p)))
      mapaRef.current.fitBounds(bounds, {
        padding: { top: 120, bottom: 200, left: 60, right: 60 },
        pitch: 0,
        bearing: 0,
        duration: 600,
      })
    }
  }

  const alternarVista3D = () => {
    const proximo3D = !vistaWaze3D
    setVistaWaze3D(proximo3D)
    const punto = rutaPuntos[indiceActual] || [
      entrega?.posicionActual?.lat ?? origenLat,
      entrega?.posicionActual?.lng ?? origenLng,
    ]
    seguirCamionRef.current = true
    setSiguiendoCamion(true)
    enfocarCamaraWaze(punto, rumboActualRef.current, proximo3D, 550)
  }

  // Sincronizar marcadores de alertas activas del pedido sobre MapLibre
  useEffect(() => {
    marcadoresAlertasRef.current.forEach((m) => m.remove())
    marcadoresAlertasRef.current = []
    if (!mapaRef.current || !alertasActivas.length) return

    alertasActivas.forEach((alerta) => {
      const popup = new maplibregl.Popup({
        anchor: 'bottom',
        offset: 22,
        maxWidth: '220px',
      }).setHTML(
        `<div class="p-0.5 text-xs">
          <strong style="color:${alerta.color};font-weight:800;">${alerta.etiqueta}</strong>
          <p class="text-slate-600 mt-0.5">Visible para el cliente${alerta.horaChile ? ` · ${alerta.horaChile}` : ''}</p>
        </div>`
      )
      const marcador = new maplibregl.Marker({
        element: crearElementoAlerta(alerta.color, alerta.textoColor),
      })
        .setLngLat([alerta.lng, alerta.lat])
        .setPopup(popup)
        .addTo(mapaRef.current)

      if (ultimaAlertaCreadaIdRef.current === alerta.id) {
        marcador.togglePopup()
        ultimaAlertaCreadaIdRef.current = null
      }
      marcadoresAlertasRef.current.push(marcador)
    })
  }, [alertasActivas])

  const reportarAlertaEnRuta = (alerta) => {
    setPanelAlertasAbierto(false)
    const punto = rutaPuntos[indiceActual] || [
      entrega?.posicionActual?.lat ?? origenLat,
      entrega?.posicionActual?.lng ?? origenLng,
    ]
    const nuevaAlerta = crearRegistroAlertaRuta(
      alerta,
      punto,
      entrega?.repartidor?.nombre
    )

    const actualizadas = [...alertasActivas, nuevaAlerta]
    ultimaAlertaCreadaIdRef.current = nuevaAlerta.id
    setAlertasPorPedido((prev) => ({
      ...prev,
      [codigoPedidoActual]: actualizadas,
    }))
    sincronizarAlertasRutaConBackend(entrega, actualizadas)
  }

  const limpiarAlertas = () => {
    ultimaAlertaCreadaIdRef.current = null
    setAlertasPorPedido((prev) => ({
      ...prev,
      [codigoPedidoActual]: [],
    }))
    setPanelAlertasAbierto(false)
    sincronizarAlertasRutaConBackend(entrega, [])
  }

  const progresoPorcentaje =
    rutaPuntos.length > 1
      ? Math.min(100, Math.round((indiceActual / (rutaPuntos.length - 1)) * 100))
      : 0

  const velocidadMostrada = simulando
    ? velocidadActualKmH || Math.min(60, Math.round(32 + velocidadSimulacion * 6))
    : entrega?.velocidadActualKmH || 0

  const calleActual =
    pasoActual?.calle && pasoActual.calle !== 'Calle sin nombre'
      ? pasoActual.calle
      : null

  const claseBotonControl = modoOscuro
    ? 'bg-[#121212]/92 text-[#AFAFAF] hover:bg-[#242629] hover:text-[#4788FF]'
    : 'bg-white text-[#545454] hover:bg-[#F6F6F6] hover:text-[#276EF1]'

  return (
    <div
      className={`relative h-full w-full overflow-hidden ${
        modoOscuro ? 'bg-[#121212]' : 'bg-[#F6F6F6]'
      }`}
    >
      {/* Lienzo vectorial MapLibre GL JS (3D nativo + rotación 360° rumbo arriba) */}
      <div ref={contenedorRef} className="h-full w-full" />

      {/* Horizonte suave superior en modo 3D Waze */}
      {vistaWaze3D && (
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 z-10 h-20 bg-gradient-to-b ${
            modoOscuro
              ? 'from-[#121212] via-[#121212]/60 to-transparent'
              : 'from-[#F6F6F6] via-[#F6F6F6]/60 to-transparent'
          }`}
          aria-hidden="true"
        />
      )}

      {/* BARRA SUPERIOR TURN-BY-TURN ESTILO WAZE */}
      <div className="pointer-events-none absolute top-3 right-3 left-3 z-30 flex items-start gap-2.5">
        {alAbrirMenu && (
          <button
            type="button"
            onClick={alAbrirMenu}
            className="pointer-events-auto flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-[#121212]/95 text-white shadow-2xl transition hover:bg-[#242629] active:scale-95"
            title="Abrir Menú de Navegación"
            aria-label="Abrir Menú de Navegación"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* HUD Turn-by-Turn + Siguiente Maniobra */}
        <div className="pointer-events-auto flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl bg-[#121212]/95 text-white shadow-2xl backdrop-blur-md">
          <div className="flex items-center gap-2.5 px-3 py-2.5 md:px-4 md:py-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#276EF1]/20 text-[#4788FF] md:h-12 md:w-12">
              {pasoActual?.tipo === 'arrive' ? (
                <svg className="h-6 w-6 text-[#3AA76D]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                </svg>
              ) : pasoActual?.modificador?.includes('right') ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              ) : pasoActual?.modificador?.includes('left') ? (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              ) : (
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold tracking-wider text-[#4788FF] uppercase md:text-xs">
                  {indiceActual >= rutaPuntos.length - 1
                    ? 'Llegada'
                    : pasoActual?.distancia
                    ? `En ${pasoActual.distancia} m`
                    : 'En ruta'}
                </span>
              </div>
              <p className="truncate text-xs font-bold text-white md:text-sm">
                {pasoActual?.instruccion || 'Diríjase hacia el domicilio del cliente'}
              </p>
              {siguientePaso && indiceActual < rutaPuntos.length - 1 && (
                <p className="mt-0.5 truncate text-[10px] text-[#AFAFAF] md:text-[11px]">
                  Luego: {siguientePaso.instruccion}
                </p>
              )}
            </div>

            <div className="shrink-0 pl-2.5 text-right md:pl-3">
              <div className="text-base font-black tracking-tight text-[#4788FF] md:text-lg">
                {indiceActual >= rutaPuntos.length - 1
                  ? '0 min'
                  : `${Math.max(1, Math.round(duracionTotalMin * ((rutaPuntos.length - indiceActual) / (rutaPuntos.length || 1))))} min`}
              </div>
              <div className="text-[10px] font-medium text-[#AFAFAF] md:text-xs">
                {indiceActual >= rutaPuntos.length - 1
                  ? '0.0 km'
                  : `${(distanciaTotalKm * ((rutaPuntos.length - indiceActual) / (rutaPuntos.length || 1))).toFixed(1)} km`}
              </div>
            </div>
          </div>

          {/* Barra de progreso de recorrido */}
          <div className="h-1 w-full bg-[#242629]">
            <div
              className="h-full bg-gradient-to-r from-[#276EF1] to-[#4788FF] transition-all duration-300"
              style={{ width: `${progresoPorcentaje}%` }}
            />
          </div>
        </div>
      </div>

      {/* Controles Flotantes Laterales estilo Waze */}
      <div className="absolute top-24 right-3 z-30 flex flex-col gap-2">
        {/* Alternar Vista 3D Waze (Rumbo arriba) / 2D Norte arriba */}
        <button
          type="button"
          onClick={alternarVista3D}
          title={vistaWaze3D ? 'Cambiar a vista 2D' : 'Cambiar a vista 3D'}
          aria-label={vistaWaze3D ? 'Cambiar a vista 2D' : 'Cambiar a vista 3D'}
          aria-pressed={vistaWaze3D}
          className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl text-xs font-black shadow-md transition active:scale-95 ${
            vistaWaze3D
              ? 'bg-[#276EF1] text-white hover:bg-[#4788FF]'
              : claseBotonControl
          }`}
        >
          {vistaWaze3D ? '3D' : '2D'}
        </button>

        {/* Guía de voz */}
        <button
          type="button"
          onClick={() => setVozActiva((prev) => !prev)}
          title={vozActiva ? 'Silenciar guía por voz' : 'Activar guía por voz'}
          aria-label={vozActiva ? 'Silenciar guía por voz' : 'Activar guía por voz'}
          aria-pressed={vozActiva}
          className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl shadow-md transition active:scale-95 ${
            vozActiva
              ? 'bg-[#048848] text-white hover:bg-[#3AA76D]'
              : claseBotonControl
          }`}
        >
          {vozActiva ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 010 7.07M19.07 4.93a10 10 0 010 14.14" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5L6 9H2v6h4l5 4V5zM23 9l-6 6M17 9l6 6" />
            </svg>
          )}
        </button>

        {/* Centrar en el Repartidor */}
        <button
          type="button"
          onClick={reenfocarRepartidor}
          title="Centrar en el Repartidor"
          aria-label="Centrar en el Repartidor"
          className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl shadow-md transition active:scale-95 ${claseBotonControl}`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Ver Ruta Completa */}
        <button
          type="button"
          onClick={verRutaCompleta}
          title="Ver Ruta Completa"
          aria-label="Ver Ruta Completa"
          className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl shadow-md transition active:scale-95 ${claseBotonControl}`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </button>

        {/* Modo Nocturno / Claro */}
        <button
          type="button"
          onClick={() => setModoOscuro((prev) => !prev)}
          title={modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo nocturno'}
          aria-label={modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo nocturno'}
          aria-pressed={modoOscuro}
          className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl shadow-md transition active:scale-95 ${
            modoOscuro
              ? 'bg-[#121212]/92 text-[#FFC043] hover:bg-[#242629]'
              : 'bg-white text-[#545454] hover:bg-[#F6F6F6]'
          }`}
        >
          {modoOscuro ? (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Botón de Alerta Rápida / Capas Dinámicas estilo Waze */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setPanelAlertasAbierto((prev) => !prev)}
            title="Reportar alerta en ruta"
            aria-label="Reportar alerta en ruta"
            aria-expanded={panelAlertasAbierto}
            className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-[#ED6E33] text-white shadow-md transition hover:bg-[#E11900] active:scale-95"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
          </button>

          {panelAlertasAbierto && (
            <div className="absolute right-12 bottom-0 z-40 w-52 rounded-2xl bg-[#121212]/95 p-2 text-xs text-white shadow-2xl backdrop-blur-md">
              <p className="px-2 py-1 text-[10px] font-bold tracking-wider text-[#AFAFAF] uppercase">
                Avisos en ruta (visible al cliente)
              </p>
              <div className="mt-1 flex flex-col gap-1">
                {ALERTAS_WAZE.map((alerta) => (
                  <button
                    key={alerta.id}
                    type="button"
                    onClick={() => reportarAlertaEnRuta(alerta)}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-xl bg-[#242629] px-2.5 py-2 text-left font-semibold text-white transition hover:bg-[#383B40]"
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: alerta.color }}
                    />
                    <span>{alerta.etiqueta}</span>
                  </button>
                ))}
                {totalAlertas > 0 && (
                  <button
                    type="button"
                    onClick={limpiarAlertas}
                    className="mt-1 w-full cursor-pointer rounded-xl bg-white/5 px-2.5 py-1.5 text-center text-[11px] font-bold text-[#AFAFAF] transition hover:bg-[#242629] hover:text-white"
                  >
                    Limpiar alertas ({totalAlertas})
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Botón Mejor Ruta y Lista de Pedidos Pendientes (debajo de Alertas) */}
        <button
          type="button"
          onClick={() => {
            setPanelAlertasAbierto(false)
            alAbrirListaPedidos?.()
          }}
          title="Calcular mejor ruta y ver pedidos pendientes"
          aria-label="Calcular mejor ruta y ver pedidos pendientes"
          className={`relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl shadow-md transition active:scale-95 ${
            modoOscuro
              ? 'bg-[#276EF1] text-white hover:bg-[#4788FF]'
              : 'bg-[#276EF1] text-white hover:bg-[#4788FF]'
          }`}
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="6" cy="6" r="2.3" />
            <circle cx="18" cy="18" r="2.3" />
            <path d="M8.3 6h5.2a3.3 3.3 0 0 1 0 6.6h-3a3.3 3.3 0 0 0 0 6.6h5.2" />
          </svg>
          {cantidadPendientes > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#121212] px-1 text-[10px] font-black text-white shadow">
              {cantidadPendientes}
            </span>
          )}
        </button>
      </div>

      {/* Velocímetro Circular estilo Waze (abajo izquierda) */}
      <div className="pointer-events-none absolute bottom-44 left-3 z-20 sm:bottom-48">
        <div
          className={`flex h-16 w-16 flex-col items-center justify-center rounded-full shadow-2xl backdrop-blur-md transition ${
            modoOscuro
              ? 'bg-[#121212]/92 text-white ring-2 ring-[#4788FF]/55'
              : 'bg-white/95 text-[#121212] ring-2 ring-[#276EF1]/45'
          }`}
          aria-label={`Velocidad actual ${velocidadMostrada} kilómetros por hora`}
        >
          <span className="text-xl leading-none font-black tabular-nums">
            {velocidadMostrada}
          </span>
          <span
            className={`mt-0.5 text-[9px] font-bold tracking-wider uppercase ${
              modoOscuro ? 'text-[#AFAFAF]' : 'text-[#545454]'
            }`}
          >
            km/h
          </span>
        </div>
      </div>

      {/* Pastilla de calle actual (estilo Waze "John st.") o botón Reanudar Navegación */}
      <div className="pointer-events-none absolute inset-x-0 bottom-44 z-20 flex justify-center px-20 sm:bottom-48">
        {!siguiendoCamion ? (
          <button
            type="button"
            onClick={reenfocarRepartidor}
            className="pointer-events-auto inline-flex cursor-pointer items-center gap-2 rounded-full bg-[#276EF1] px-4 py-2 text-xs font-extrabold text-white shadow-2xl transition hover:bg-[#4788FF] active:scale-95"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M12 2l7 19-7-4-7 4 7-19z" />
            </svg>
            <span>Reanudar navegación</span>
          </button>
        ) : (
          calleActual && (
            <div className="max-w-xs truncate rounded-full bg-[#276EF1] px-4 py-1.5 text-xs font-extrabold text-white shadow-xl">
              {calleActual}
            </div>
          )
        )}
      </div>

      {seccionPedido}
    </div>
  )
}
