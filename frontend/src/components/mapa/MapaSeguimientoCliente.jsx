import { useEffect, useMemo, useRef, useState } from 'react'
import L from 'leaflet'
import {
  COORDENADAS_PLANTA_ORIGEN,
  COORDENADAS_CLIENTE_DESTINO,
  obtenerRutaOSRM,
  obtenerAlertasRutaPedido,
  suscribirAlertasRuta,
} from '../../service/repartoService'
import {
  PALETA_MAPA_UBER,
  sincronizarCapasMapa,
} from '../../utils/mapaTiles'

const escaparHtml = (texto = '') =>
  String(texto)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

const crearIconoAlertaSoloLectura = (color = '#FFC043', textoColor = '#121212') => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div style="display:flex;align-items:center;justify-content:center;width:30px;height:30px;border-radius:9999px;background:${color};color:${textoColor};box-shadow:0 4px 12px rgba(0,0,0,0.42);font-weight:900;font-size:14px;">
        !
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -16],
  })
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
  const marcadorDestinoRef = useRef(null)
  const marcadoresAlertasRef = useRef([])
  const lineaRutaRef = useRef(null)
  const capasTilesRef = useRef({ base: null, etiquetas: null })
  const [rutaPuntos, setRutaPuntos] = useState([])
  const [modoOscuro, setModoOscuro] = useState(true)
  const [alertasVivoPorPedido, setAlertasVivoPorPedido] = useState({})

  const codigoPedido = String(entrega?.codigoVenta || entrega?.id || '')
  const alertasProp = entrega?.alertasRuta

  useEffect(() => {
    if (!codigoPedido) return undefined
    return suscribirAlertasRuta(codigoPedido, (nuevas) => {
      setAlertasVivoPorPedido((prev) => ({ ...prev, [codigoPedido]: nuevas }))
    })
  }, [codigoPedido])

  const alertasRuta = useMemo(() => {
    if (codigoPedido && alertasVivoPorPedido[codigoPedido] !== undefined) {
      return alertasVivoPorPedido[codigoPedido]
    }
    if (Array.isArray(alertasProp)) {
      return alertasProp
    }
    return codigoPedido ? obtenerAlertasRutaPedido(codigoPedido) : []
  }, [codigoPedido, alertasVivoPorPedido, alertasProp])

  const origenLat = entrega?.origen?.lat ?? COORDENADAS_PLANTA_ORIGEN.lat
  const origenLng = entrega?.origen?.lng ?? COORDENADAS_PLANTA_ORIGEN.lng
  const destinoLat =
    entrega?.cliente?.coordenadas?.lat ?? COORDENADAS_CLIENTE_DESTINO.lat
  const destinoLng =
    entrega?.cliente?.coordenadas?.lng ?? COORDENADAS_CLIENTE_DESTINO.lng

  // 1. Inicializar Mapa una sola vez
  useEffect(() => {
    if (!contenedorRef.current || mapaRef.current) return

    const mapa = L.map(contenedorRef.current, {
      center: [COORDENADAS_PLANTA_ORIGEN.lat, COORDENADAS_PLANTA_ORIGEN.lng],
      zoom: 14,
      zoomControl: false,
    })

    sincronizarCapasMapa(mapa, capasTilesRef, true)

    L.control.zoom({ position: 'bottomright' }).addTo(mapa)

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

    const marcadorDestino = L.marker(
      [COORDENADAS_CLIENTE_DESTINO.lat, COORDENADAS_CLIENTE_DESTINO.lng],
      { icon: crearIconoCasaCliente() }
    ).addTo(mapa)
    marcadorDestinoRef.current = marcadorDestino

    const marcadorCamion = L.marker(
      [COORDENADAS_PLANTA_ORIGEN.lat, COORDENADAS_PLANTA_ORIGEN.lng],
      { icon: crearIconoCamionCliente(180), zIndexOffset: 1000 }
    ).addTo(mapa)
    marcadorCamionRef.current = marcadorCamion

    const lineaRuta = L.polyline([], {
      color: PALETA_MAPA_UBER.noche.rutaActiva,
      weight: 6,
      opacity: 0.95,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(mapa)
    lineaRutaRef.current = lineaRuta

    mapaRef.current = mapa

    return () => {
      marcadoresAlertasRef.current.forEach((m) => m.remove())
      marcadoresAlertasRef.current = []
      mapa.remove()
      mapaRef.current = null
      capasTilesRef.current = { base: null, etiquetas: null }
    }
  }, [])

  // Mostrar alertas reportadas por el repartidor en modo solo lectura sobre el mapa
  useEffect(() => {
    marcadoresAlertasRef.current.forEach((m) => m.remove())
    marcadoresAlertasRef.current = []
    if (!mapaRef.current || !alertasRuta.length) return

    alertasRuta.forEach((alerta) => {
      const marcador = L.marker([alerta.lat, alerta.lng], {
        icon: crearIconoAlertaSoloLectura(alerta.color, alerta.textoColor),
        zIndexOffset: 850,
      })
        .bindPopup(
          `<div class="p-1 text-xs">
            <strong style="color:${escaparHtml(alerta.color)};font-weight:800;">${escaparHtml(alerta.etiqueta)}</strong>
            <p class="text-slate-600 mt-0.5">Aviso del repartidor${alerta.horaChile ? ` · ${escaparHtml(alerta.horaChile)}` : ''}</p>
            <p class="text-[10px] text-slate-400 mt-0.5">Información en tiempo real (solo lectura)</p>
          </div>`
        )
        .addTo(mapaRef.current)
      marcadoresAlertasRef.current.push(marcador)
    })
  }, [alertasRuta])

  // Cambiar tema del mapa (Nocturno / Día) y color de ruta activa
  useEffect(() => {
    if (!mapaRef.current) return
    sincronizarCapasMapa(mapaRef.current, capasTilesRef, modoOscuro)
    if (lineaRutaRef.current) {
      lineaRutaRef.current.setStyle({
        color: modoOscuro
          ? PALETA_MAPA_UBER.noche.rutaActiva
          : PALETA_MAPA_UBER.dia.rutaActiva,
      })
    }
  }, [modoOscuro])

  // 2. Cargar trazado OSRM según origen y destino del pedido actual
  useEffect(() => {
    let cancelado = false
    const cargar = async () => {
      const res = await obtenerRutaOSRM(
        { lat: origenLat, lng: origenLng },
        { lat: destinoLat, lng: destinoLng }
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
  }, [origenLat, origenLng, destinoLat, destinoLng])

  // 3. Sincronizar posición del camión y destino cuando cambie `entrega`
  useEffect(() => {
    if (marcadorDestinoRef.current) {
      marcadorDestinoRef.current.setLatLng([destinoLat, destinoLng])
      marcadorDestinoRef.current.bindPopup(
        `<div class="p-1 text-xs">
          <strong class="text-[#FF4500] font-bold">Tu Domicilio</strong>
          <p class="text-slate-700">${entrega?.cliente?.direccion || 'Av. Concha y Toro 1340'}</p>
        </div>`
      )
    }

    if (!marcadorCamionRef.current) return
    const lat = entrega?.posicionActual?.lat ?? origenLat
    const lng = entrega?.posicionActual?.lng ?? origenLng
    const rumbo = entrega?.posicionActual?.rumbo ?? 180

    marcadorCamionRef.current.setLatLng([lat, lng])
    marcadorCamionRef.current.setIcon(crearIconoCamionCliente(rumbo))
    marcadorCamionRef.current.bindPopup(
      `<div class="p-1 text-xs">
        <strong class="text-blue-700 font-bold">Repartidor</strong>
        <p class="text-slate-700 font-medium">${entrega?.repartidor?.nombre || 'Por asignar'}</p>
        <p class="text-slate-500 text-[11px]">${entrega?.repartidor?.vehiculo || 'Furgón Gas'} (${entrega?.repartidor?.patente || 'KJ-WP-42'})</p>
      </div>`
    )

    if (rutaPuntos.length > 0 && lineaRutaRef.current) {
      const idx = Math.min(
        entrega?.posicionActual?.indicePunto ?? 0,
        rutaPuntos.length - 1
      )
      const restante = rutaPuntos.slice(idx)
      lineaRutaRef.current.setLatLngs(restante.length ? restante : [[lat, lng]])
    }
  }, [entrega, rutaPuntos, origenLat, origenLng, destinoLat, destinoLng])

  const reenfocar = () => {
    if (mapaRef.current) {
      const lat = entrega?.posicionActual?.lat ?? origenLat
      const lng = entrega?.posicionActual?.lng ?? origenLng
      const bounds = L.latLngBounds([
        [lat, lng],
        [destinoLat, destinoLng],
      ])
      mapaRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 16 })
    }
  }

  const colorPuntoEstado =
    entrega?.estado === 'entregado'
      ? PALETA_MAPA_UBER.dinamica.traficoFluidoClaro
      : entrega?.estado === 'cancelado'
      ? PALETA_MAPA_UBER.dinamica.traficoDetenido
      : entrega?.estado === 'llegando'
      ? PALETA_MAPA_UBER.dinamica.demandaModerada
      : modoOscuro
      ? PALETA_MAPA_UBER.noche.rutaActiva
      : PALETA_MAPA_UBER.dia.rutaActiva

  const enfocarUltimaAlerta = () => {
    if (!mapaRef.current || alertasRuta.length === 0) return
    const ultima = alertasRuta[alertasRuta.length - 1]
    mapaRef.current.setView([ultima.lat, ultima.lng], 16, { animate: true })
    const marcadorUltimo =
      marcadoresAlertasRef.current[marcadoresAlertasRef.current.length - 1]
    marcadorUltimo?.openPopup()
  }

  const ultimaAlerta =
    alertasRuta.length > 0 ? alertasRuta[alertasRuta.length - 1] : null

  return (
    <div
      className={`relative h-full w-full overflow-hidden rounded-2xl shadow-md ${
        modoOscuro
          ? 'mapa-noche-superficie bg-[#121212]'
          : 'mapa-dia-superficie bg-[#F6F6F6]'
      }`}
    >
      <div ref={contenedorRef} className="h-full min-h-[420px] w-full" />

      {/* Aviso de solo lectura de alertas reportadas por el repartidor */}
      {ultimaAlerta && (
        <div className="pointer-events-none absolute top-4 left-4 z-20 max-w-[72%]">
          <button
            type="button"
            onClick={enfocarUltimaAlerta}
            title="Ver aviso del repartidor en el mapa"
            className={`pointer-events-auto inline-flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-xs shadow-lg backdrop-blur-md transition active:scale-95 ${
              modoOscuro
                ? 'bg-[#121212]/92 text-white hover:bg-[#242629]'
                : 'bg-white/95 text-[#121212] hover:bg-[#F6F6F6]'
            }`}
          >
            <span
              className="h-2.5 w-2.5 shrink-0 rounded-full"
              style={{ backgroundColor: ultimaAlerta.color }}
            />
            <span className="truncate font-bold">{ultimaAlerta.etiqueta}</span>
            {ultimaAlerta.horaChile && (
              <span
                className={`shrink-0 text-[10px] font-semibold ${
                  modoOscuro ? 'text-[#AFAFAF]' : 'text-[#545454]'
                }`}
              >
                {ultimaAlerta.horaChile}
              </span>
            )}
            {alertasRuta.length > 1 && (
              <span className="shrink-0 rounded-full bg-[#276EF1] px-1.5 py-0.5 text-[10px] font-black text-white">
                +{alertasRuta.length - 1}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Controles flotantes del mapa */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <button
          type="button"
          onClick={reenfocar}
          title="Centrar en el recorrido"
          aria-label="Centrar en el recorrido"
          className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl shadow-md transition active:scale-95 ${
            modoOscuro
              ? 'bg-[#121212]/90 text-[#AFAFAF] hover:bg-[#242629] hover:text-[#4788FF]'
              : 'bg-white text-[#545454] hover:bg-[#F6F6F6] hover:text-[#276EF1]'
          }`}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={() => setModoOscuro((prev) => !prev)}
          title={modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo nocturno'}
          aria-label={modoOscuro ? 'Cambiar a modo claro' : 'Cambiar a modo nocturno'}
          aria-pressed={modoOscuro}
          className={`flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl shadow-md transition active:scale-95 ${
            modoOscuro
              ? 'bg-[#121212]/90 text-[#FFC043] hover:bg-[#242629]'
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
      </div>

      {/* Overlay inferior con estado dinámico */}
      <div className="pointer-events-none absolute right-4 bottom-4 left-4 z-20">
        <div
          className={`pointer-events-auto flex items-center justify-between rounded-xl px-4 py-3 shadow-lg backdrop-blur-md transition-colors ${
            modoOscuro
              ? 'bg-[#121212]/92 text-white'
              : 'bg-white/95 text-[#121212]'
          }`}
        >
          <div className="flex items-center gap-3">
            <span className="relative flex h-3.5 w-3.5">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ backgroundColor: colorPuntoEstado }}
              />
              <span
                className="relative inline-flex h-3.5 w-3.5 rounded-full"
                style={{ backgroundColor: colorPuntoEstado }}
              />
            </span>
            <div>
              <p className={`text-xs font-bold ${modoOscuro ? 'text-white' : 'text-[#121212]'}`}>
                {entrega?.estado === 'entregado'
                  ? '¡Pedido Entregado con Éxito!'
                  : entrega?.estado === 'cancelado'
                  ? 'Pedido Cancelado'
                  : entrega?.estado === 'llegando'
                  ? '¡El repartidor ha llegado a tu puerta!'
                  : entrega?.estado === 'pendiente'
                  ? 'Esperando asignación de repartidor en planta'
                  : 'Repartidor en camino a tu domicilio'}
              </p>
              <p className={`text-[11px] ${modoOscuro ? 'text-[#AFAFAF]' : 'text-[#545454]'}`}>
                {entrega?.repartidor?.nombre} • {entrega?.cliente?.direccion}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`text-sm font-black ${
                entrega?.estado === 'entregado'
                  ? 'text-[#3AA76D]'
                  : entrega?.estado === 'cancelado'
                  ? 'text-[#E11900]'
                  : modoOscuro
                  ? 'text-[#4788FF]'
                  : 'text-[#276EF1]'
              }`}
            >
              {entrega?.estado === 'entregado'
                ? 'Entregado'
                : entrega?.estado === 'cancelado'
                ? 'Cancelado'
                : entrega?.estado === 'pendiente'
                ? 'En planta'
                : `~${entrega?.etaMinutos ?? 8} min`}
            </span>
            <p className={`text-[10px] ${modoOscuro ? 'text-[#AFAFAF]' : 'text-[#545454]'}`}>
              {entrega?.estado === 'entregado'
                ? 'Completado'
                : entrega?.estado === 'cancelado'
                ? 'Anulado'
                : `${entrega?.distanciaKm ?? 2.1} km`}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
