import { PALETA_MAPA_UBER } from './mapaTiles'

const CARTO_STYLE_META_URL =
  'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const CARTO_VECTOR_TILES_DEFAULT = [
  'https://tiles.basemaps.cartocdn.com/v/20261118-01/vectortiles/carto.streets/v2/{z}/{x}/{y}.mvt',
]
const CARTO_VECTOR_GLYPHS_DEFAULT =
  'https://tiles.basemaps.cartocdn.com/v/20261118-01/fonts/{fontstack}/{range}.pbf'

const OPENFREEMAP_PLANET_URL = 'https://tiles.openfreemap.org/planet'
const OPENFREEMAP_GLYPHS_URL =
  'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf'

const CARTO_RASTER_NOCHE = [
  'https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
  'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
  'https://c.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
  'https://d.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
]

const CARTO_RASTER_DIA = [
  'https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
  'https://b.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
  'https://c.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
  'https://d.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png',
]

let cacheConfigCarto = null

/**
 * Obtiene la URL vigente de teselas vectoriales CARTO v2 desde su estilo oficial
 * para mantenerse siempre actualizado si CARTO cambia la versión de snapshot.
 */
export async function resolverConfigCartoVector() {
  if (cacheConfigCarto) return cacheConfigCarto
  try {
    const resp = await fetch(CARTO_STYLE_META_URL)
    if (!resp.ok) return null
    const json = await resp.json()
    const tiles = json?.sources?.protomaps?.tiles
    const glyphs = json?.glyphs
    if (Array.isArray(tiles) && tiles.length > 0 && typeof glyphs === 'string') {
      cacheConfigCarto = {
        tiles,
        glyphs,
        maxzoom: json.sources.protomaps.maxzoom || 15,
      }
      return cacheConfigCarto
    }
  } catch {
    // Se mantiene el snapshot por defecto o se escala al respaldo automático
  }
  return null
}

function construirFuentesRuta(coordsRecorrida = [], coordsActiva = []) {
  return {
    'ruta-recorrida': {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coordsRecorrida },
      },
    },
    'ruta-activa': {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: { type: 'LineString', coordinates: coordsActiva },
      },
    },
  }
}

function construirCapasRuta(modoOscuro) {
  const p = modoOscuro ? PALETA_MAPA_UBER.noche : PALETA_MAPA_UBER.dia
  const colorRutaActiva = p.rutaActiva
  const colorRutaHalo = modoOscuro ? '#276EF1' : '#1B54C4'
  const colorRutaRecorrida = p.rutaRecorrida

  return [
    {
      id: 'linea-ruta-recorrida',
      type: 'line',
      source: 'ruta-recorrida',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': colorRutaRecorrida,
        'line-width': 6,
        'line-opacity': 0.78,
        'line-dasharray': [1.2, 1.6],
      },
    },
    {
      id: 'linea-ruta-activa-halo',
      type: 'line',
      source: 'ruta-activa',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': colorRutaHalo,
        'line-width': ['interpolate', ['linear'], ['zoom'], 13, 11, 17, 18],
        'line-opacity': modoOscuro ? 0.45 : 0.32,
      },
    },
    {
      id: 'linea-ruta-activa',
      type: 'line',
      source: 'ruta-activa',
      layout: {
        'line-cap': 'round',
        'line-join': 'round',
      },
      paint: {
        'line-color': colorRutaActiva,
        'line-width': ['interpolate', ['linear'], ['zoom'], 13, 6.5, 17, 11.5],
        'line-opacity': 0.98,
      },
    },
  ]
}

function crearEstiloCartoVector(
  modoOscuro,
  coordsRecorrida,
  coordsActiva,
  cartoConfig
) {
  const p = modoOscuro ? PALETA_MAPA_UBER.noche : PALETA_MAPA_UBER.dia

  const colorFondo = p.fondo
  const colorParques = p.parques
  const colorAgua = p.agua
  const colorEdificio = modoOscuro ? '#1B1D22' : '#EAEAEA'
  const colorBordeCalle = modoOscuro ? '#181A1F' : '#E2E2E2'
  const colorCalleMenor = p.callesSecundarias
  const colorAvenida = modoOscuro ? p.avenidas : p.avenidasGris
  const colorAutopista = modoOscuro ? p.avenidas : p.avenidasAmarillo
  const colorBordeAutopista = modoOscuro ? '#202328' : '#E2D69A'
  const colorTexto = p.etiquetas
  const colorHalo = modoOscuro ? '#121212' : '#F6F6F6'

  const tiles = cartoConfig?.tiles || CARTO_VECTOR_TILES_DEFAULT
  const glyphs = cartoConfig?.glyphs || CARTO_VECTOR_GLYPHS_DEFAULT
  const maxzoom = cartoConfig?.maxzoom || 15

  return {
    version: 8,
    name: modoOscuro
      ? 'El Volcán Waze Nocturno (CARTO Vector)'
      : 'El Volcán Waze Día (CARTO Vector)',
    glyphs,
    sources: {
      'carto-streets': {
        type: 'vector',
        tiles,
        minzoom: 0,
        maxzoom,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/about-carto/">CARTO</a>',
      },
      ...construirFuentesRuta(coordsRecorrida, coordsActiva),
    },
    layers: [
      // 1. Fondo / Tierra (#121212 noche / #F6F6F6 día)
      {
        id: 'fondo',
        type: 'background',
        paint: { 'background-color': colorFondo },
      },

      // 2. Parques y áreas verdes (#182921 noche / #D9F2E4 día)
      {
        id: 'parques-landuse',
        type: 'fill',
        source: 'carto-streets',
        'source-layer': 'landuse',
        filter: [
          'in',
          ['get', 'kind'],
          [
            'literal',
            [
              'park',
              'pitch',
              'recreation_ground',
              'playground',
              'grass',
              'garden',
              'forest',
              'wood',
              'scrub',
              'meadow',
              'cemetery',
              'stadium',
              'nature_reserve',
            ],
          ],
        ],
        paint: {
          'fill-color': colorParques,
          'fill-opacity': modoOscuro ? 0.94 : 0.9,
        },
      },

      // 3. Agua — ríos, canales, lagos (#0F1E36 noche / #CBE4FF día)
      {
        id: 'agua-relleno',
        type: 'fill',
        source: 'carto-streets',
        'source-layer': 'water',
        filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
        paint: { 'fill-color': colorAgua },
      },
      {
        id: 'agua-cursos',
        type: 'line',
        source: 'carto-streets',
        'source-layer': 'water',
        filter: ['in', ['geometry-type'], ['literal', ['LineString', 'MultiLineString']]],
        paint: {
          'line-color': colorAgua,
          'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.5, 17, 5],
        },
      },

      // 4. Edificios 2D + Extrusión 3D sutil
      {
        id: 'edificios-base',
        type: 'fill',
        source: 'carto-streets',
        'source-layer': 'buildings',
        minzoom: 14,
        paint: {
          'fill-color': colorEdificio,
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.3, 16, 0.78],
        },
      },
      {
        id: 'edificios-3d',
        type: 'fill-extrusion',
        source: 'carto-streets',
        'source-layer': 'buildings',
        minzoom: 15.2,
        paint: {
          'fill-extrusion-color': colorEdificio,
          'fill-extrusion-height': ['min', ['coalesce', ['get', 'height'], 8], 22],
          'fill-extrusion-base': ['coalesce', ['get', 'min_height'], 0],
          'fill-extrusion-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15.2,
            0,
            16.5,
            modoOscuro ? 0.68 : 0.55,
          ],
        },
      },

      // 5. Calles secundarias y pasajes (#242629 noche / #FFFFFF día)
      {
        id: 'calles-menores-borde',
        type: 'line',
        source: 'carto-streets',
        'source-layer': 'roads',
        minzoom: 12,
        filter: [
          'any',
          ['==', ['get', 'kind'], 'minor_road'],
          ['==', ['get', 'kind_detail'], 'living_street'],
        ],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': colorBordeCalle,
          'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12, 1.8, 15, 6, 18, 18],
        },
      },
      {
        id: 'calles-menores',
        type: 'line',
        source: 'carto-streets',
        'source-layer': 'roads',
        minzoom: 12,
        filter: [
          'any',
          ['==', ['get', 'kind'], 'minor_road'],
          ['==', ['get', 'kind_detail'], 'living_street'],
        ],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': colorCalleMenor,
          'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12, 1.2, 15, 4.8, 18, 15.5],
        },
      },

      // 6. Avenidas secundarias y terciarias (#383B40 noche / #E2E2E2 día)
      {
        id: 'avenidas-borde',
        type: 'line',
        source: 'carto-streets',
        'source-layer': 'roads',
        filter: [
          'in',
          ['get', 'kind_detail'],
          ['literal', ['secondary', 'secondary_link', 'tertiary', 'tertiary_link']],
        ],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': colorBordeCalle,
          'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 11, 2.2, 15, 9.5, 18, 26],
        },
      },
      {
        id: 'avenidas',
        type: 'line',
        source: 'carto-streets',
        'source-layer': 'roads',
        filter: [
          'in',
          ['get', 'kind_detail'],
          ['literal', ['secondary', 'secondary_link', 'tertiary', 'tertiary_link']],
        ],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': colorAvenida,
          'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 11, 1.6, 15, 7.8, 18, 23],
        },
      },

      // 7. Autopistas y arterias principales (#383B40 noche / #FFF2AF día)
      {
        id: 'autopistas-borde',
        type: 'line',
        source: 'carto-streets',
        'source-layer': 'roads',
        filter: [
          'any',
          ['==', ['get', 'kind'], 'highway'],
          [
            'in',
            ['get', 'kind_detail'],
            ['literal', ['motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link']],
          ],
        ],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': colorBordeAutopista,
          'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 10, 2.8, 15, 12, 18, 32],
        },
      },
      {
        id: 'autopistas',
        type: 'line',
        source: 'carto-streets',
        'source-layer': 'roads',
        filter: [
          'any',
          ['==', ['get', 'kind'], 'highway'],
          [
            'in',
            ['get', 'kind_detail'],
            ['literal', ['motorway', 'motorway_link', 'trunk', 'trunk_link', 'primary', 'primary_link']],
          ],
        ],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': colorAutopista,
          'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 10, 2, 15, 10, 18, 28],
        },
      },

      // 8 y 9. Ruta recorrida + Ruta activa
      ...construirCapasRuta(modoOscuro),

      // 10. Etiquetas de calles (siempre derechas al rotar 360°)
      {
        id: 'etiquetas-calles',
        type: 'symbol',
        source: 'carto-streets',
        'source-layer': 'roads',
        minzoom: 13,
        filter: [
          'all',
          ['has', 'name'],
          ['in', ['get', 'kind'], ['literal', ['highway', 'major_road', 'minor_road', 'other']]],
        ],
        layout: {
          'symbol-placement': 'line',
          'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 13, 11, 16, 13, 18, 15],
          'text-keep-upright': true,
          'text-max-angle': 30,
          'symbol-spacing': 240,
        },
        paint: {
          'text-color': colorTexto,
          'text-halo-color': colorHalo,
          'text-halo-width': 2,
          'text-halo-blur': 0.4,
        },
      },

      // 11. Etiquetas de barrios y comunas (#AFAFAF noche / #545454 día)
      {
        id: 'etiquetas-barrios',
        type: 'symbol',
        source: 'carto-streets',
        'source-layer': 'places',
        minzoom: 11,
        filter: [
          'all',
          ['has', 'name'],
          ['in', ['get', 'kind'], ['literal', ['neighbourhood', 'locality', 'town', 'city', 'suburb']]],
        ],
        layout: {
          'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']],
          'text-font': ['Open Sans Bold'],
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.08,
          'text-size': ['interpolate', ['linear'], ['zoom'], 11, 10.5, 15, 13],
        },
        paint: {
          'text-color': colorTexto,
          'text-halo-color': colorHalo,
          'text-halo-width': 2,
          'text-opacity': 0.88,
        },
      },
    ],
  }
}

function crearEstiloOpenFreeMap(modoOscuro, coordsRecorrida, coordsActiva) {
  const p = modoOscuro ? PALETA_MAPA_UBER.noche : PALETA_MAPA_UBER.dia

  const colorFondo = p.fondo
  const colorParques = p.parques
  const colorAgua = p.agua
  const colorEdificio = modoOscuro ? '#1B1D22' : '#EAEAEA'
  const colorBordeCalle = modoOscuro ? '#181A1F' : '#E2E2E2'
  const colorCalleMenor = p.callesSecundarias
  const colorAvenida = modoOscuro ? p.avenidas : p.avenidasGris
  const colorAutopista = modoOscuro ? p.avenidas : p.avenidasAmarillo
  const colorBordeAutopista = modoOscuro ? '#202328' : '#E2D69A'
  const colorTexto = p.etiquetas
  const colorHalo = modoOscuro ? '#121212' : '#F6F6F6'

  return {
    version: 8,
    name: modoOscuro
      ? 'El Volcán Waze Nocturno (OpenFreeMap)'
      : 'El Volcán Waze Día (OpenFreeMap)',
    glyphs: OPENFREEMAP_GLYPHS_URL,
    sources: {
      openmaptiles: {
        type: 'vector',
        url: OPENFREEMAP_PLANET_URL,
      },
      ...construirFuentesRuta(coordsRecorrida, coordsActiva),
    },
    layers: [
      { id: 'fondo', type: 'background', paint: { 'background-color': colorFondo } },
      {
        id: 'parques-landcover',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landcover',
        filter: ['in', ['get', 'class'], ['literal', ['grass', 'wood', 'forest', 'wetland']]],
        paint: { 'fill-color': colorParques, 'fill-opacity': modoOscuro ? 0.92 : 0.85 },
      },
      {
        id: 'parques-landuse',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'landuse',
        filter: ['in', ['get', 'class'], ['literal', ['park', 'cemetery', 'pitch', 'stadium', 'playground', 'grass']]],
        paint: { 'fill-color': colorParques, 'fill-opacity': modoOscuro ? 0.95 : 0.9 },
      },
      {
        id: 'parques-capa',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'park',
        paint: { 'fill-color': colorParques, 'fill-opacity': 0.95 },
      },
      {
        id: 'agua-relleno',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'water',
        paint: { 'fill-color': colorAgua },
      },
      {
        id: 'agua-cursos',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'waterway',
        paint: {
          'line-color': colorAgua,
          'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.5, 17, 5],
        },
      },
      {
        id: 'edificios-base',
        type: 'fill',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 14,
        paint: {
          'fill-color': colorEdificio,
          'fill-opacity': ['interpolate', ['linear'], ['zoom'], 14, 0.3, 16, 0.78],
        },
      },
      {
        id: 'edificios-3d',
        type: 'fill-extrusion',
        source: 'openmaptiles',
        'source-layer': 'building',
        minzoom: 15.2,
        paint: {
          'fill-extrusion-color': colorEdificio,
          'fill-extrusion-height': ['min', ['coalesce', ['get', 'render_height'], 8], 22],
          'fill-extrusion-base': ['coalesce', ['get', 'render_min_height'], 0],
          'fill-extrusion-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            15.2,
            0,
            16.5,
            modoOscuro ? 0.68 : 0.55,
          ],
        },
      },
      {
        id: 'calles-menores-borde',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        minzoom: 12,
        filter: ['in', ['get', 'class'], ['literal', ['minor', 'service', 'track', 'path']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': colorBordeCalle,
          'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12, 1.8, 15, 6, 18, 18],
        },
      },
      {
        id: 'calles-menores',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        minzoom: 12,
        filter: ['in', ['get', 'class'], ['literal', ['minor', 'service']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': colorCalleMenor,
          'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 12, 1.2, 15, 4.8, 18, 15.5],
        },
      },
      {
        id: 'avenidas-borde',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['tertiary', 'secondary']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': colorBordeCalle,
          'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 11, 2.2, 15, 9.5, 18, 26],
        },
      },
      {
        id: 'avenidas',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['tertiary', 'secondary']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': colorAvenida,
          'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 11, 1.6, 15, 7.8, 18, 23],
        },
      },
      {
        id: 'autopistas-borde',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['primary', 'trunk', 'motorway']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': colorBordeAutopista,
          'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 10, 2.8, 15, 12, 18, 32],
        },
      },
      {
        id: 'autopistas',
        type: 'line',
        source: 'openmaptiles',
        'source-layer': 'transportation',
        filter: ['in', ['get', 'class'], ['literal', ['primary', 'trunk', 'motorway']]],
        layout: { 'line-cap': 'round', 'line-join': 'round' },
        paint: {
          'line-color': colorAutopista,
          'line-width': ['interpolate', ['exponential', 1.6], ['zoom'], 10, 2, 15, 10, 18, 28],
        },
      },
      ...construirCapasRuta(modoOscuro),
      {
        id: 'etiquetas-calles',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'transportation_name',
        minzoom: 13,
        layout: {
          'symbol-placement': 'line',
          'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']],
          'text-font': ['Noto Sans Regular'],
          'text-size': ['interpolate', ['linear'], ['zoom'], 13, 11, 16, 13, 18, 15],
          'text-keep-upright': true,
          'text-max-angle': 30,
          'symbol-spacing': 240,
        },
        paint: {
          'text-color': colorTexto,
          'text-halo-color': colorHalo,
          'text-halo-width': 2,
          'text-halo-blur': 0.4,
        },
      },
      {
        id: 'etiquetas-barrios',
        type: 'symbol',
        source: 'openmaptiles',
        'source-layer': 'place',
        minzoom: 11,
        filter: ['in', ['get', 'class'], ['literal', ['neighbourhood', 'suburb', 'quarter', 'town', 'city']]],
        layout: {
          'text-field': ['coalesce', ['get', 'name:es'], ['get', 'name']],
          'text-font': ['Noto Sans Bold'],
          'text-transform': 'uppercase',
          'text-letter-spacing': 0.08,
          'text-size': ['interpolate', ['linear'], ['zoom'], 11, 10.5, 15, 13],
        },
        paint: {
          'text-color': colorTexto,
          'text-halo-color': colorHalo,
          'text-halo-width': 2,
          'text-opacity': 0.88,
        },
      },
    ],
  }
}

function crearEstiloCartoRaster(modoOscuro, coordsRecorrida, coordsActiva) {
  const p = modoOscuro ? PALETA_MAPA_UBER.noche : PALETA_MAPA_UBER.dia
  return {
    version: 8,
    name: modoOscuro
      ? 'El Volcán Waze Nocturno (CARTO Respaldo)'
      : 'El Volcán Waze Día (CARTO Respaldo)',
    sources: {
      'carto-raster': {
        type: 'raster',
        tiles: modoOscuro ? CARTO_RASTER_NOCHE : CARTO_RASTER_DIA,
        tileSize: 256,
        maxzoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/about-carto/">CARTO</a>',
      },
      ...construirFuentesRuta(coordsRecorrida, coordsActiva),
    },
    layers: [
      { id: 'fondo', type: 'background', paint: { 'background-color': p.fondo } },
      {
        id: 'carto-raster-capa',
        type: 'raster',
        source: 'carto-raster',
        paint: { 'raster-opacity': 1 },
      },
      ...construirCapasRuta(modoOscuro),
    ],
  }
}

/**
 * Construye el estilo MapLibre GL JS con la paleta exacta Uber Base (Día y Noche).
 * Proveedor primario: 'carto' (teselas vectoriales CARTO v2 en basemaps.cartocdn.com).
 * Respaldos automáticos: 'openfreemap' (vectorial OpenMapTiles) y 'raster' (CARTO raster 3D).
 */
export function crearEstiloVectorialUber(
  modoOscuro = true,
  coordsRecorrida = [],
  coordsActiva = [],
  proveedor = 'carto',
  cartoConfig = null
) {
  if (proveedor === 'openfreemap') {
    return crearEstiloOpenFreeMap(modoOscuro, coordsRecorrida, coordsActiva)
  }
  if (proveedor === 'raster') {
    return crearEstiloCartoRaster(modoOscuro, coordsRecorrida, coordsActiva)
  }
  return crearEstiloCartoVector(
    modoOscuro,
    coordsRecorrida,
    coordsActiva,
    cartoConfig
  )
}
