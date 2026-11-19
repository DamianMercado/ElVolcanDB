import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import {
  COORDENADAS_PLANTA_ORIGEN,
  COORDENADAS_CLIENTE_DESTINO,
  obtenerRutaOSRM,
} from '../../service/repartoService'

const CARTO_API_KEY = import.meta.env.VITE_CARTO_API_KEY || ''

const obtenerUrlTilesCliente = () => {
  if (CARTO_API_KEY) {
    // Paleta Uber: light_all (Positron) (#ffffff / #e7e8ec / #adadad)
    return `https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png?key=${CARTO_API_KEY}`
  }
  // OpenStreetMap Oficial sin marcas de agua
  return 'https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png'
}

const crearIconoCamionCliente = (rumbo = 0) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="pin-contenedor-camion anim-pulso-camion" style="transform: rotate(${rumbo}deg); width: 42px; height: 42px;">
        <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" style="transform: rotate(-${rumbo}deg);">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0" />
        </svg>
      </div>
    `,
    iconSize: [42, 42],
    iconAnchor: [21, 21],
    popupAnchor: [0, -21],
  })
}

const crearIconoCasaCliente = () => {
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

const crearIconoPlantaCliente = () => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="pin-contenedor-origen">
        <svg class="w-4 h-4 text-[#2171ec]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
      </div>
    `,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
    popupAnchor: [0, -17],
  })
}

export function MapaSeguimientoCliente({ entrega }) {
  const contenedorRef = useRef(null)
  const mapaRef = useRef(null)
  const marcadorCamionRef = useRef(null)
  const lineaRutaRef = useRef(null)
  const [rutaPuntos, setRutaPuntos] = useState([])

  const posRepartidor = entrega?.posicionActual || {
    lat: COORDENADAS_PLANTA_ORIGEN.lat,
    lng: COORDENADAS_PLANTA_ORIGEN.lng,
    rumbo: 180,
    indicePunto: 0,
  }

  // 1. Inicializar Mapa
  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return

    const centro = [posRepartidor.lat, posRepartidor.lng]
    const mapa = L.map(contenedorRef.current, {
      center: centro,
      zoom: 14,
      zoomControl: false,
    })

    // OpenStreetMap / CartoDB si hay API Key
    L.tileLayer(obtenerUrlTilesCliente(), {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: 'abc',
    }).addTo(mapa)

    L.control.zoom({ position: 'bottomright' }).addTo(mapa)

    // Marcador Planta / Origen
    L.marker([COORDENADAS_PLANTA_ORIGEN.lat, COORDENADAS_PLANTA_ORIGEN.lng], {
      icon: crearIconoPlantaCliente(),
    })
      .bindPopup(
        `<div class="p-1 text-xs">
          <strong class="text-[#0A2540] font-bold">Planta El Volcán</strong>
          <p class="text-slate-500">Punto de partida de tu pedido</p>
        </div>`
      )
      .addTo(mapa)

    // Marcador Destino / Casa del Cliente
    L.marker([COORDENADAS_CLIENTE_DESTINO.lat, COORDENADAS_CLIENTE_DESTINO.lng], {
      icon: crearIconoCasaCliente(),
    })
      .bindPopup(
        `<div class="p-1 text-xs">
          <strong class="text-[#FF4500] font-bold">Tu Domicilio</strong>
          <p class="text-slate-700">${entrega?.cliente?.direccion || 'Av. Concha y Toro 1340'}</p>
        </div>`
      )
      .addTo(mapa)

    // Marcador Repartidor
    const marcadorCamion = L.marker([posRepartidor.lat, posRepartidor.lng], {
      icon: crearIconoCamionCliente(posRepartidor.rumbo || 180),
      zIndexOffset: 1000,
    })
      .bindPopup(
        `<div class="p-1 text-xs">
          <strong class="text-blue-700 font-bold">Repartidor en Camino</strong>
          <p class="text-slate-700 font-medium">${entrega?.repartidor?.nombre || 'Carlos Silva'}</p>
          <p class="text-slate-500 text-[11px]">${entrega?.repartidor?.vehiculo || 'Furgón Gas'} (${entrega?.repartidor?.patente || 'BV-9281'})</p>
        </div>`
      )
      .addTo(mapa)
    marcadorCamionRef.current = marcadorCamion

    // Polilínea de la ruta (Azul Uber #2171ec)
    const lineaRuta = L.polyline([], {
      color: '#2171ec',
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(mapa)
    lineaRutaRef.current = lineaRuta

    mapaRef.current = mapa

    return () => {
      mapa.remove()
      mapaRef.current = null
    }
  }, [])

  // 2. Cargar trazado OSRM
  useEffect(() => {
    let cancelado = false
    const cargar = async () => {
      const res = await obtenerRutaOSRM(
        COORDENADAS_PLANTA_ORIGEN,
        COORDENADAS_CLIENTE_DESTINO
      )
      if (cancelado) return
      setRutaPuntos(res.puntos)

      if (lineaRutaRef.current) {
        lineaRutaRef.current.setLatLngs(res.puntos)
      }

      if (mapaRef.current && res.puntos.length > 0) {
        mapaRef.current.fitBounds(res.puntos, {
          padding: [50, 50],
          maxZoom: 15,
        })
      }
    }
    cargar()
    return () => {
      cancelado = true
    }
  }, [])

  // 3. Sincronizar posición del camión cuando cambie `entrega`
  useEffect(() => {
    if (!marcadorCamionRef.current) return
    const lat = entrega?.posicionActual?.lat ?? COORDENADAS_PLANTA_ORIGEN.lat
    const lng = entrega?.posicionActual?.lng ?? COORDENADAS_PLANTA_ORIGEN.lng
    const rumbo = entrega?.posicionActual?.rumbo ?? 180

    marcadorCamionRef.current.setLatLng([lat, lng])
    marcadorCamionRef.current.setIcon(crearIconoCamionCliente(rumbo))

    // Actualizar ruta restante
    if (rutaPuntos.length > 0 && lineaRutaRef.current) {
      const idx = entrega?.posicionActual?.indicePunto ?? 0
      const restante = rutaPuntos.slice(idx)
      lineaRutaRef.current.setLatLngs(restante.length ? restante : [[lat, lng]])
    }
  }, [entrega, rutaPuntos])

  // Botón para enfocar pedido
  const reenfocar = () => {
    if (mapaRef.current && rutaPuntos.length > 0) {
      const lat = entrega?.posicionActual?.lat ?? COORDENADAS_PLANTA_ORIGEN.lat
      const lng = entrega?.posicionActual?.lng ?? COORDENADAS_PLANTA_ORIGEN.lng
      const bounds = L.latLngBounds([
        [lat, lng],
        [COORDENADAS_CLIENTE_DESTINO.lat, COORDENADAS_CLIENTE_DESTINO.lng],
      ])
      mapaRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 })
    }
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-[#e7e8ec] shadow-md mapa-estilo-uber">
      <div ref={contenedorRef} className="h-full min-h-[420px] w-full" />

      {/* Botón flotante de recentrado */}
      <button
        type="button"
        onClick={reenfocar}
        title="Centrar en el recorrido"
        className="absolute top-4 right-4 z-20 flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl bg-white text-[#121212] border border-[#e7e8ec] shadow-md transition hover:bg-[#e7e8ec]/40 hover:text-[#2171ec] active:scale-95"
      >
        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      </button>

      {/* Overlay inferior con estado dinámico */}
      <div className="pointer-events-none absolute right-4 bottom-4 left-4 z-20">
        <div className="pointer-events-auto flex items-center justify-between rounded-xl border border-[#e7e8ec] bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#2171ec] opacity-75"></span>
              <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-[#2171ec]"></span>
            </span>
            <div>
              <p className="text-xs font-bold text-[#121212]">
                {entrega?.estado === 'entregado'
                  ? '¡Pedido Entregado con Éxito!'
                  : entrega?.estado === 'llegando'
                  ? '¡El repartidor ha llegado a tu puerta!'
                  : 'Repartidor en camino a tu domicilio'}
              </p>
              <p className="text-[11px] text-[#adadad]">
                {entrega?.repartidor?.nombre} en camino por {entrega?.cliente?.direccion}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-sm font-black text-[#2171ec]">
              {entrega?.estado === 'entregado' ? 'Entregado' : `~${entrega?.etaMinutos || 8} min`}
            </span>
            <p className="text-[10px] text-[#adadad]">
              {entrega?.estado === 'entregado' ? 'Completado' : `${entrega?.distanciaKm || 2.1} km`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
