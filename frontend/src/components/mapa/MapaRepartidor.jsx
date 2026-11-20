import { useEffect, useRef, useState, useCallback } from 'react'
import L from 'leaflet'
import {
  COORDENADAS_PLANTA_ORIGEN,
  COORDENADAS_CLIENTE_DESTINO,
  obtenerRutaOSRM,
  calcularRumbo,
  actualizarPosicionRepartidor,
} from '../../service/repartoService'
import { Variables } from '../../config/variables'

const CARTO_API_KEY = Variables.cartoApiKey

const obtenerUrlTiles = (modoOscuro = false) => {
  const queryParam = CARTO_API_KEY ? `?key=${CARTO_API_KEY}` : ''
  return modoOscuro
    ? `https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png${queryParam}`
    : `https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png${queryParam}`
}

const crearIconoCamion = (rumbo = 0) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="pin-contenedor-camion anim-pulso-camion" style="transform: rotate(${rumbo}deg);">
        <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="transform: rotate(-${rumbo}deg);">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
    popupAnchor: [0, -22],
  })
}

const crearIconoDestino = () => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="pin-contenedor-destino">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      </div>
    `,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
    popupAnchor: [0, -20],
  })
}

const crearIconoOrigen = () => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="pin-contenedor-origen">
        <svg class="w-5 h-5 text-[#2171ec]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    popupAnchor: [0, -18],
  })
}

export function MapaRepartidor({
  entrega,
  simulando,
  velocidadSimulacion = 1,
  alCambiarPunto,
  alLlegarDestino,
  alAbrirMenu,
  seccionPedido,
}) {
  const contenedorRef = useRef(null)
  const mapaRef = useRef(null)
  const marcadorCamionRef = useRef(null)
  const marcadorDestinoRef = useRef(null)
  const lineaRecorridaRef = useRef(null)
  const lineaRestanteRef = useRef(null)
  const seguirCamionRef = useRef(true)
  const capaTilesRef = useRef(null)

  const [rutaPuntos, setRutaPuntos] = useState([])
  const [pasos, setPasos] = useState([])
  const [indiceActual, setIndiceActual] = useState(
    entrega?.posicionActual?.indicePunto || 0
  )
  const [pasoActual, setPasoActual] = useState(null)
  const [distanciaTotalKm, setDistanciaTotalKm] = useState(2.4)
  const [duracionTotalMin, setDuracionTotalMin] = useState(9)
  const [modoOscuro, setModoOscuro] = useState(false)

  const origenLat = entrega?.origen?.lat ?? COORDENADAS_PLANTA_ORIGEN.lat
  const origenLng = entrega?.origen?.lng ?? COORDENADAS_PLANTA_ORIGEN.lng
  const destinoLat =
    entrega?.cliente?.coordenadas?.lat ?? COORDENADAS_CLIENTE_DESTINO.lat
  const destinoLng =
    entrega?.cliente?.coordenadas?.lng ?? COORDENADAS_CLIENTE_DESTINO.lng

  // 1. Inicializar Mapa Leaflet una sola vez
  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return

    const centroInicial = [COORDENADAS_PLANTA_ORIGEN.lat, COORDENADAS_PLANTA_ORIGEN.lng]

    const mapa = L.map(contenedorRef.current, {
      center: centroInicial,
      zoom: 15,
      zoomControl: false,
    })

    const capaTiles = L.tileLayer(obtenerUrlTiles(false), {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      maxZoom: 19,
      subdomains: 'abcd',
    }).addTo(mapa)
    capaTilesRef.current = capaTiles

    L.control.zoom({ position: 'bottomright' }).addTo(mapa)

    // Marcador Origen (Planta El Volcán)
    L.marker([COORDENADAS_PLANTA_ORIGEN.lat, COORDENADAS_PLANTA_ORIGEN.lng], {
      icon: crearIconoOrigen(),
    })
      .bindPopup(
        `<div class="p-1 text-xs">
          <strong class="text-[#0A2540] font-bold text-sm">Planta El Volcán</strong>
          <p class="text-slate-600 mt-0.5">Centro de Distribución y Carga</p>
        </div>`
      )
      .addTo(mapa)

    // Marcador Destino (Cliente)
    const marcadorDestino = L.marker(
      [COORDENADAS_CLIENTE_DESTINO.lat, COORDENADAS_CLIENTE_DESTINO.lng],
      { icon: crearIconoDestino() }
    ).addTo(mapa)
    marcadorDestinoRef.current = marcadorDestino

    // Marcador Repartidor (Camión móvil)
    const marcadorCamion = L.marker(centroInicial, {
      icon: crearIconoCamion(180),
      zIndexOffset: 1000,
    }).addTo(mapa)
    marcadorCamionRef.current = marcadorCamion

    // Polilíneas de ruta
    const lineaRecorrida = L.polyline([], {
      color: '#adadad',
      weight: 5,
      opacity: 0.7,
      dashArray: '5, 8',
    }).addTo(mapa)
    lineaRecorridaRef.current = lineaRecorrida

    const lineaRestante = L.polyline([], {
      color: '#2171ec',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(mapa)
    lineaRestanteRef.current = lineaRestante

    mapa.on('dragstart', () => {
      seguirCamionRef.current = false
    })

    mapaRef.current = mapa

    return () => {
      mapa.remove()
      mapaRef.current = null
    }
  }, [])

  // Actualizar marcadores y popups cuando cambia la entrega activa
  useEffect(() => {
    if (marcadorDestinoRef.current) {
      marcadorDestinoRef.current.setLatLng([destinoLat, destinoLng])
      marcadorDestinoRef.current.bindPopup(
        `<div class="p-1 text-xs">
          <strong class="text-[#FF4500] font-bold text-sm">Destino de Entrega</strong>
          <p class="font-semibold text-slate-800">${entrega?.cliente?.nombre || 'Cliente'}</p>
          <p class="text-slate-600">${entrega?.cliente?.direccion || 'Puente Alto'}</p>
        </div>`
      )
    }

    if (marcadorCamionRef.current) {
      const lat = entrega?.posicionActual?.lat ?? origenLat
      const lng = entrega?.posicionActual?.lng ?? origenLng
      const rumbo = entrega?.posicionActual?.rumbo ?? 180
      marcadorCamionRef.current.setLatLng([lat, lng])
      marcadorCamionRef.current.setIcon(crearIconoCamion(rumbo))
      marcadorCamionRef.current.bindPopup(
        `<div class="p-1 text-xs">
          <strong class="text-blue-700 font-bold text-sm">Repartidor</strong>
          <p class="text-slate-700 font-medium">${entrega?.repartidor?.nombre || 'Carlos Ruiz'}</p>
          <p class="text-slate-500">${entrega?.repartidor?.vehiculo || 'Furgón de Gas'}</p>
        </div>`
      )
    }
  }, [
    destinoLat,
    destinoLng,
    origenLat,
    origenLng,
    entrega?.cliente?.nombre,
    entrega?.cliente?.direccion,
    entrega?.repartidor?.nombre,
    entrega?.repartidor?.vehiculo,
    entrega?.posicionActual?.lat,
    entrega?.posicionActual?.lng,
    entrega?.posicionActual?.rumbo,
  ])

  // Cambiar tema de mapa (Día/Noche)
  useEffect(() => {
    if (!capaTilesRef.current) return
    capaTilesRef.current.setUrl(obtenerUrlTiles(modoOscuro))
  }, [modoOscuro])

  // 2. Cargar Ruta Real de Conducción con OSRM según el destino del pedido actual
  useEffect(() => {
    let cancelado = false
    const cargarRuta = async () => {
      const res = await obtenerRutaOSRM(
        { lat: origenLat, lng: origenLng },
        { lat: destinoLat, lng: destinoLng }
      )
      if (cancelado) return

      setRutaPuntos(res.puntos)
      setPasos(res.pasos)
      setDistanciaTotalKm(res.distanciaKm || 2.4)
      setDuracionTotalMin(res.duracionMinutos || 9)
      if (res.pasos.length > 0) {
        setPasoActual(res.pasos[0])
      }
      setIndiceActual(0)

      if (mapaRef.current && res.puntos.length > 0) {
        mapaRef.current.fitBounds(res.puntos, {
          padding: [60, 60],
          maxZoom: 16,
        })
      }
    }

    cargarRuta()
    return () => {
      cancelado = true
    }
  }, [origenLat, origenLng, destinoLat, destinoLng, entrega?.codigoVenta])

  // 3. Actualizar Polilíneas según el índice actual
  useEffect(() => {
    if (!rutaPuntos.length) return

    const recorrido = rutaPuntos.slice(0, indiceActual + 1)
    const restante = rutaPuntos.slice(indiceActual)

    if (lineaRecorridaRef.current) {
      lineaRecorridaRef.current.setLatLngs(recorrido)
    }
    if (lineaRestanteRef.current) {
      lineaRestanteRef.current.setLatLngs(restante)
    }
  }, [rutaPuntos, indiceActual])

  // 4. Mover el camión a una coordenada específica
  const moverCamion = useCallback(
    (nuevoIndice) => {
      if (!rutaPuntos.length || nuevoIndice >= rutaPuntos.length) return

      const punto = rutaPuntos[nuevoIndice]
      const puntoSiguiente =
        rutaPuntos[nuevoIndice + 1] || rutaPuntos[nuevoIndice]
      const rumbo = calcularRumbo(
        punto[0],
        punto[1],
        puntoSiguiente[0],
        puntoSiguiente[1]
      )

      if (marcadorCamionRef.current) {
        marcadorCamionRef.current.setLatLng(punto)
        marcadorCamionRef.current.setIcon(crearIconoCamion(rumbo))
      }

      if (seguirCamionRef.current && mapaRef.current) {
        mapaRef.current.panTo(punto, { animate: true, duration: 0.5 })
      }

      const totalPuntos = rutaPuntos.length
      const avanceRatio = (totalPuntos - nuevoIndice) / totalPuntos
      const distanciaRestanteKm = Number((distanciaTotalKm * avanceRatio).toFixed(1))
      const etaMinutos = Math.max(1, Math.round(duracionTotalMin * avanceRatio))

      if (pasos.length > 0) {
        const indicePaso = Math.min(
          Math.floor((nuevoIndice / totalPuntos) * pasos.length),
          pasos.length - 1
        )
        setPasoActual(pasos[indicePaso])
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
        velocidadKmH: nuevoIndice >= totalPuntos - 1 ? 0 : 42,
        nuevoEstado,
      }

      setIndiceActual(nuevoIndice)
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
      alCambiarPunto,
      alLlegarDestino,
    ]
  )

  // 5. Simulación de movimiento automático paso a paso
  useEffect(() => {
    if (!simulando || !rutaPuntos.length) return

    const delay = Math.max(200, Math.round(1200 / velocidadSimulacion))

    const intervalo = setInterval(() => {
      setIndiceActual((prev) => {
        if (prev >= rutaPuntos.length - 1) {
          clearInterval(intervalo)
          return prev
        }
        const siguiente = prev + 1
        moverCamion(siguiente)
        return siguiente
      })
    }, delay)

    return () => clearInterval(intervalo)
  }, [simulando, rutaPuntos, velocidadSimulacion, moverCamion])

  const reenfocarRepartidor = () => {
    seguirCamionRef.current = true
    if (mapaRef.current && rutaPuntos[indiceActual]) {
      mapaRef.current.setView(rutaPuntos[indiceActual], 16, { animate: true })
    }
  }

  const verRutaCompleta = () => {
    seguirCamionRef.current = false
    if (mapaRef.current && rutaPuntos.length > 0) {
      mapaRef.current.fitBounds(rutaPuntos, { padding: [50, 50], animate: true })
    }
  }

  return (
    <div
      className={`relative h-full w-full overflow-hidden mapa-estilo-uber ${
        modoOscuro ? 'bg-[#121212]' : 'bg-[#e7e8ec]'
      }`}
    >
      <div ref={contenedorRef} className="h-full w-full" />

      {/* BARRA SUPERIOR FLOTANTE DENTRO DEL MAPA */}
      <div className="pointer-events-none absolute top-3 right-3 left-3 z-30 flex items-start gap-2.5">
        {alAbrirMenu && (
          <button
            type="button"
            onClick={alAbrirMenu}
            className="pointer-events-auto flex h-12 w-12 shrink-0 cursor-pointer items-center justify-center rounded-2xl bg-[#121212] text-white shadow-2xl border border-[#e7e8ec]/20 transition hover:bg-[#1f1f1f] active:scale-95"
            title="Abrir Menú de Navegación"
            aria-label="Abrir Menú de Navegación"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* HUD Turn-by-Turn */}
        <div className="pointer-events-auto flex flex-1 items-center gap-2.5 rounded-2xl border border-[#e7e8ec]/20 bg-[#121212]/95 px-3 py-2 text-white shadow-2xl backdrop-blur-md min-w-0 md:px-4 md:py-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2171ec]/20 text-[#2171ec] md:h-11 md:w-11">
            {pasoActual?.tipo === 'arrive' ? (
              <svg className="h-6 w-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold tracking-wider text-[#2171ec] uppercase md:text-xs">
                {indiceActual >= rutaPuntos.length - 1 ? 'Llegada' : 'Próxima Maniobra'}
              </span>
              <span className="text-[10px] text-[#adadad] md:text-xs">
                {pasoActual?.distancia ? `en ~${pasoActual.distancia} m` : ''}
              </span>
            </div>
            <p className="truncate text-xs font-semibold text-white md:text-sm">
              {pasoActual?.instruccion || 'Diríjase hacia el domicilio del cliente'}
            </p>
          </div>

          <div className="shrink-0 border-l border-white/15 pl-2.5 text-right md:pl-3">
            <div className="text-base font-black tracking-tight text-[#2171ec] md:text-lg">
              {indiceActual >= rutaPuntos.length - 1
                ? '0 min'
                : `${Math.max(1, Math.round(duracionTotalMin * ((rutaPuntos.length - indiceActual) / (rutaPuntos.length || 1))))} min`}
            </div>
            <div className="text-[10px] font-medium text-[#adadad] md:text-xs">
              {indiceActual >= rutaPuntos.length - 1
                ? '0.0 km'
                : `${(distanciaTotalKm * ((rutaPuntos.length - indiceActual) / (rutaPuntos.length || 1))).toFixed(1)} km`}
            </div>
          </div>
        </div>
      </div>

      {/* Controles Flotantes Laterales */}
      <div className="absolute top-20 right-3 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={reenfocarRepartidor}
          title="Centrar en el Repartidor"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white text-[#121212] border border-[#e7e8ec] shadow-md transition hover:bg-[#e7e8ec]/40 hover:text-[#2171ec] active:scale-95"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={verRutaCompleta}
          title="Ver Ruta Completa"
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white text-[#121212] border border-[#e7e8ec] shadow-md transition hover:bg-[#e7e8ec]/40 hover:text-[#2171ec] active:scale-95"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setModoOscuro(!modoOscuro)}
          title={modoOscuro ? 'Cambiar a Modo Día' : 'Cambiar a Modo Noche'}
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white text-[#121212] border border-[#e7e8ec] shadow-md transition hover:bg-[#e7e8ec]/40 hover:text-[#2171ec] active:scale-95"
        >
          {modoOscuro ? (
            <svg className="h-5 w-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="h-5 w-5 text-[#121212]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      {seccionPedido}
    </div>
  )
}
