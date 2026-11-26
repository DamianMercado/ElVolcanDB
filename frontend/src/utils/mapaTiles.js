import L from 'leaflet'
import { Variables } from '../config/variables'

const CARTO_API_KEY = Variables.cartoApiKey

const ATRIBUCION_MAPA =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'

const SUBDOMINIOS = ['a', 'b', 'c', 'd']

/**
 * Paleta oficial estilo Uber Base para todos los mapas del proyecto:
 * - Modo Día: #F6F6F6 tierra, #FFFFFF calles, #E2E2E2/#FFF2AF avenidas, #D9F2E4 parques, #CBE4FF agua, #545454 textos
 * - Modo Noche: #121212/#141414 tierra, #242629 calles, #383B40 avenidas, #182921 parques, #0F1E36 agua, #AFAFAF textos
 * - Ruta activa: #276EF1 (día) / #4788FF (noche)
 * - Capas dinámicas: verde #048848/#3AA76D, amarillo #FFC043, naranja #ED6E33, rojo #E11900/#D44333, morado #7356BF
 */
export const PALETA_MAPA_UBER = {
  dia: {
    fondo: '#F6F6F6',
    callesSecundarias: '#FFFFFF',
    avenidasGris: '#E2E2E2',
    avenidasAmarillo: '#FFF2AF',
    parques: '#D9F2E4',
    agua: '#CBE4FF',
    rutaActiva: '#276EF1',
    rutaRecorrida: '#545454',
    etiquetas: '#545454',
  },
  noche: {
    fondo: '#121212',
    fondoAlterno: '#141414',
    callesSecundarias: '#242629',
    avenidas: '#383B40',
    parques: '#182921',
    agua: '#0F1E36',
    rutaActiva: '#4788FF',
    rutaActivaBase: '#276EF1',
    rutaRecorrida: '#383B40',
    etiquetas: '#AFAFAF',
  },
  dinamica: {
    traficoFluido: '#048848',
    traficoFluidoClaro: '#3AA76D',
    demandaModerada: '#FFC043',
    demandaAlta: '#ED6E33',
    traficoDetenido: '#E11900',
    traficoDetenidoClaro: '#D44333',
    bonificacion: '#7356BF',
  },
}

const RGB_DIA = {
  fondo: [246, 246, 246], // #F6F6F6
  edificio: [236, 236, 236],
  bordeCalle: [226, 226, 226], // #E2E2E2
  calle: [255, 255, 255], // #FFFFFF
  avenidaAmarillo: [255, 242, 175], // #FFF2AF
  parque: [217, 242, 228], // #D9F2E4
  agua: [203, 228, 255], // #CBE4FF
  etiqueta: [84, 84, 84], // #545454
  haloEtiqueta: [246, 246, 246], // #F6F6F6
}

const RGB_NOCHE = {
  fondo: [18, 18, 18], // #121212
  fondoAlt: [20, 20, 20], // #141414
  edificio: [26, 27, 30],
  calle: [36, 38, 41], // #242629
  avenida: [56, 59, 64], // #383B40
  parque: [24, 41, 33], // #182921
  agua: [15, 30, 54], // #0F1E36
  etiqueta: [175, 175, 175], // #AFAFAF
  haloEtiqueta: [18, 18, 18], // #121212
}

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v)
const mix = (a, b, t) => a + (b - a) * t

const construirUrlCarto = (tipoCapa, coords, retina) => {
  const s = SUBDOMINIOS[Math.abs(coords.x + coords.y) % SUBDOMINIOS.length]
  const r = retina ? '@2x' : ''
  const queryParam = CARTO_API_KEY ? `?key=${CARTO_API_KEY}` : ''
  return `https://${s}.basemaps.cartocdn.com/rastertiles/${tipoCapa}/${coords.z}/${coords.x}/${coords.y}${r}.png${queryParam}`
}

export const obtenerUrlBaseMapa = () => {
  const queryParam = CARTO_API_KEY ? `?key=${CARTO_API_KEY}` : ''
  return `https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png${queryParam}`
}

export const obtenerUrlEtiquetasMapa = () => {
  const queryParam = CARTO_API_KEY ? `?key=${CARTO_API_KEY}` : ''
  return `https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png${queryParam}`
}

function remapearPixelesBase(datos, modoOscuro) {
  for (let i = 0; i < datos.length; i += 4) {
    const a = datos[i + 3]
    if (a === 0) continue

    const r = datos[i]
    const g = datos[i + 1]
    const b = datos[i + 2]
    const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255

    // Detección continua (anti-aliased) de rasgos de Carto Voyager
    const wAgua = clamp01((b - r - 10) / 34) * clamp01((b - g + 6) / 20)
    const wParque =
      clamp01((g - r - 3) / 18) * clamp01((g - b - 5) / 26) * (1 - wAgua)
    const wAvenida =
      clamp01((r - b - 14) / 36) *
      clamp01((r - g + 8) / 14) *
      (1 - wParque) *
      (1 - wAgua)

    const wNatural = clamp01(wAgua + wParque + wAvenida)
    const wNeutro = 1 - wNatural
    const wCalle = clamp01((lum - 0.962) / 0.032) * wNeutro
    const wDetalle = clamp01((0.922 - lum) / 0.08) * wNeutro

    let nr
    let ng
    let nb

    if (modoOscuro) {
      // Fondo base #121212 / #141414 con relieve sutil de edificios
      nr = mix(RGB_NOCHE.fondo[0], RGB_NOCHE.edificio[0], wDetalle)
      ng = mix(RGB_NOCHE.fondo[1], RGB_NOCHE.edificio[1], wDetalle)
      nb = mix(RGB_NOCHE.fondo[2], RGB_NOCHE.edificio[2], wDetalle)

      // Calles secundarias -> #242629
      if (wCalle > 0) {
        nr = mix(nr, RGB_NOCHE.calle[0], wCalle)
        ng = mix(ng, RGB_NOCHE.calle[1], wCalle)
        nb = mix(nb, RGB_NOCHE.calle[2], wCalle)
      }
      // Avenidas y autopistas -> #383B40
      if (wAvenida > 0) {
        nr = mix(nr, RGB_NOCHE.avenida[0], wAvenida)
        ng = mix(ng, RGB_NOCHE.avenida[1], wAvenida)
        nb = mix(nb, RGB_NOCHE.avenida[2], wAvenida)
      }
      // Parques -> #182921
      if (wParque > 0) {
        nr = mix(nr, RGB_NOCHE.parque[0], wParque)
        ng = mix(ng, RGB_NOCHE.parque[1], wParque)
        nb = mix(nb, RGB_NOCHE.parque[2], wParque)
      }
      // Agua -> #0F1E36
      if (wAgua > 0) {
        nr = mix(nr, RGB_NOCHE.agua[0], wAgua)
        ng = mix(ng, RGB_NOCHE.agua[1], wAgua)
        nb = mix(nb, RGB_NOCHE.agua[2], wAgua)
      }
    } else {
      // Fondo base #F6F6F6 con contorno sutil #E2E2E2
      nr = mix(RGB_DIA.fondo[0], RGB_DIA.bordeCalle[0], wDetalle * 0.7)
      ng = mix(RGB_DIA.fondo[1], RGB_DIA.bordeCalle[1], wDetalle * 0.7)
      nb = mix(RGB_DIA.fondo[2], RGB_DIA.bordeCalle[2], wDetalle * 0.7)

      // Calles secundarias -> #FFFFFF
      if (wCalle > 0) {
        nr = mix(nr, RGB_DIA.calle[0], wCalle)
        ng = mix(ng, RGB_DIA.calle[1], wCalle)
        nb = mix(nb, RGB_DIA.calle[2], wCalle)
      }
      // Avenidas y autopistas -> #E2E2E2 / #FFF2AF según jerarquía vial
      if (wAvenida > 0) {
        const fuerzaAutopista = clamp01((r - b - 35) / 55)
        const avR = mix(RGB_DIA.bordeCalle[0], RGB_DIA.avenidaAmarillo[0], fuerzaAutopista)
        const avG = mix(RGB_DIA.bordeCalle[1], RGB_DIA.avenidaAmarillo[1], fuerzaAutopista)
        const avB = mix(RGB_DIA.bordeCalle[2], RGB_DIA.avenidaAmarillo[2], fuerzaAutopista)
        nr = mix(nr, avR, wAvenida)
        ng = mix(ng, avG, wAvenida)
        nb = mix(nb, avB, wAvenida)
      }
      // Parques -> #D9F2E4
      if (wParque > 0) {
        nr = mix(nr, RGB_DIA.parque[0], wParque)
        ng = mix(ng, RGB_DIA.parque[1], wParque)
        nb = mix(nb, RGB_DIA.parque[2], wParque)
      }
      // Agua -> #CBE4FF
      if (wAgua > 0) {
        nr = mix(nr, RGB_DIA.agua[0], wAgua)
        ng = mix(ng, RGB_DIA.agua[1], wAgua)
        nb = mix(nb, RGB_DIA.agua[2], wAgua)
      }
    }

    datos[i] = Math.round(nr)
    datos[i + 1] = Math.round(ng)
    datos[i + 2] = Math.round(nb)
  }
}

function remapearPixelesEtiquetas(datos, modoOscuro) {
  const tinta = modoOscuro ? RGB_NOCHE.etiqueta : RGB_DIA.etiqueta
  const halo = modoOscuro ? RGB_NOCHE.haloEtiqueta : RGB_DIA.haloEtiqueta

  for (let i = 0; i < datos.length; i += 4) {
    const a = datos[i + 3]
    if (a === 0) continue

    const lum = (0.299 * datos[i] + 0.587 * datos[i + 1] + 0.114 * datos[i + 2]) / 255
    // En voyager_only_labels: tinta oscura (lum < 0.62) y halo blanco (lum > 0.85)
    const tHalo = clamp01((lum - 0.58) / 0.3)

    datos[i] = Math.round(mix(tinta[0], halo[0], tHalo))
    datos[i + 1] = Math.round(mix(tinta[1], halo[1], tHalo))
    datos[i + 2] = Math.round(mix(tinta[2], halo[2], tHalo))
  }
}

const soportaCanvasEnNavegador = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test') {
    return false
  }
  if (typeof document === 'undefined') return false
  try {
    const c = document.createElement('canvas')
    return Boolean(c.getContext && c.getContext('2d'))
  } catch {
    return false
  }
}

const CapaCanvasPaletaUber = L.GridLayer.extend({
  createTile(coords, done) {
    const tile = document.createElement('canvas')
    const tam = this.getTileSize()
    const dpr =
      typeof window !== 'undefined' && window.devicePixelRatio > 1 ? 2 : 1
    tile.width = tam.x * dpr
    tile.height = tam.y * dpr
    tile.style.width = `${tam.x}px`
    tile.style.height = `${tam.y}px`

    const ctx = tile.getContext('2d', { willReadFrequently: true })
    const img = new Image()
    img.crossOrigin = 'anonymous'

    const tipoCapa = this.options.tipoCapa || 'voyager_nolabels'
    const modoOscuro = Boolean(this.options.modoOscuro)
    const esEtiquetas = tipoCapa === 'voyager_only_labels'

    img.onload = () => {
      try {
        ctx.clearRect(0, 0, tile.width, tile.height)
        ctx.drawImage(img, 0, 0, tile.width, tile.height)
        const imgData = ctx.getImageData(0, 0, tile.width, tile.height)
        if (esEtiquetas) {
          remapearPixelesEtiquetas(imgData.data, modoOscuro)
        } else {
          remapearPixelesBase(imgData.data, modoOscuro)
        }
        ctx.putImageData(imgData, 0, 0)
      } catch {
        // Si CORS bloquea getImageData, mantener la imagen original renderizada
      }
      done(null, tile)
    }

    img.onerror = () => {
      done(null, tile)
    }

    img.src = construirUrlCarto(tipoCapa, coords, dpr > 1)
    return tile
  },
})

/**
 * Monta o actualiza las capas de tiles de Carto aplicando exactamente la paleta Uber:
 * - Usa Canvas 2D con remapeo anti-aliased por rasgo (tierra, calles, avenidas, parques, agua y etiquetas).
 * - Los íconos de marcadores y la polilínea de ruta no se ven afectados.
 * - En entornos sin Canvas 2D (como jsdom en pruebas), usa L.tileLayer estándar.
 */
export function sincronizarCapasMapa(mapa, capasRef, modoOscuro = true) {
  if (!mapa) return

  if (capasRef.current.base) {
    mapa.removeLayer(capasRef.current.base)
    capasRef.current.base = null
  }
  if (capasRef.current.etiquetas) {
    mapa.removeLayer(capasRef.current.etiquetas)
    capasRef.current.etiquetas = null
  }

  if (soportaCanvasEnNavegador()) {
    const capaBase = new CapaCanvasPaletaUber({
      attribution: ATRIBUCION_MAPA,
      maxZoom: 19,
      zIndex: 1,
      tipoCapa: 'voyager_nolabels',
      modoOscuro,
      className: modoOscuro ? 'mapa-capa-uber-noche' : 'mapa-capa-uber-dia',
    }).addTo(mapa)

    const capaEtiquetas = new CapaCanvasPaletaUber({
      maxZoom: 19,
      zIndex: 5,
      tipoCapa: 'voyager_only_labels',
      modoOscuro,
      className: 'mapa-capa-uber-etiquetas',
    }).addTo(mapa)

    capasRef.current.base = capaBase
    capasRef.current.etiquetas = capaEtiquetas
    return
  }

  const capaBaseFallback = L.tileLayer(obtenerUrlBaseMapa(), {
    attribution: ATRIBUCION_MAPA,
    maxZoom: 19,
    subdomains: 'abcd',
    className: modoOscuro ? 'mapa-capa-uber-noche' : 'mapa-capa-uber-dia',
  }).addTo(mapa)

  const capaEtiquetasFallback = L.tileLayer(obtenerUrlEtiquetasMapa(), {
    maxZoom: 19,
    subdomains: 'abcd',
    zIndex: 5,
    className: 'mapa-capa-uber-etiquetas',
  }).addTo(mapa)

  capasRef.current.base = capaBaseFallback
  capasRef.current.etiquetas = capaEtiquetasFallback
}
