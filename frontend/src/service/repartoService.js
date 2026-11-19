// Servicio de gestión de reparto y navegación GPS en tiempo real para El Volcán
const CLAVE_ENTREGA_REPARTO = 'el_volcan_entrega_activa'
const EVENTO_REPARTO = 'reparto_actualizado'

// Coordenadas reales en Puente Alto (Santiago de Chile) para trazado de ruta
export const COORDENADAS_PLANTA_ORIGEN = {
  lat: -33.5985,
  lng: -70.578,
  nombre: 'Planta El Volcán - Distribuidora Central',
  direccion: 'Av. Vicuña Mackenna 450, Puente Alto, Santiago',
}

export const COORDENADAS_CLIENTE_DESTINO = {
  lat: -33.6145,
  lng: -70.5765,
  nombre: 'Domicilio Cliente',
  direccion: 'Av. Concha y Toro 1340, Puente Alto, Santiago',
}

// Ruta de respaldo (fallback por Av. Concha y Toro) si falla la conexión a OSRM
export const RUTA_FALLBACK_PUENTE_ALTO = [
  [-33.5985, -70.578],
  [-33.6001, -70.5778],
  [-33.6018, -70.5775],
  [-33.6035, -70.5773],
  [-33.6052, -70.5771],
  [-33.607, -70.5769],
  [-33.6088, -70.5768],
  [-33.6105, -70.5767],
  [-33.6122, -70.5766],
  [-33.6135, -70.5765],
  [-33.6145, -70.5765],
]

export const PASOS_FALLBACK_OSRM = [
  {
    instruccion: 'Salga de Planta El Volcán hacia el sur por Av. Concha y Toro',
    tipo: 'depart',
    distancia: 450,
    calle: 'Av. Concha y Toro',
  },
  {
    instruccion: 'Continúe recto por Av. Concha y Toro durante 1.2 km',
    tipo: 'continue',
    distancia: 1200,
    calle: 'Av. Concha y Toro',
  },
  {
    instruccion: 'Pase la intersección con San Carlos',
    tipo: 'continue',
    distancia: 600,
    calle: 'Av. Concha y Toro',
  },
  {
    instruccion: 'Gire levemente a la derecha hacia el número 1340',
    tipo: 'turn-slight-right',
    distancia: 150,
    calle: 'Av. Concha y Toro 1340',
  },
  {
    instruccion: 'Ha llegado a su destino: Domicilio de Camila Soto',
    tipo: 'arrive',
    distancia: 0,
    calle: 'Av. Concha y Toro 1340',
  },
]

export const ENTREGA_EJEMPLO = {
  id: 'EV-1024',
  codigoVenta: 'EV-1024',
  estado: 'en_camino', // 'asignado' | 'en_camino' | 'llegando' | 'entregado'
  fecha: new Date().toLocaleDateString('es-CL'),
  horaSalida: '11:45',
  etaMinutos: 9,
  distanciaKm: 2.4,
  velocidadActualKmH: 42,
  cliente: {
    nombre: 'Camila Soto Valenzuela',
    telefono: '+56 9 8765 4321',
    direccion: 'Av. Concha y Toro 1340, Puente Alto',
    comuna: 'Puente Alto',
    depto: 'Casa interior 3B',
    instrucciones: 'Tocar timbre negro al lado del portón blanco.',
    coordenadas: COORDENADAS_CLIENTE_DESTINO,
  },
  origen: COORDENADAS_PLANTA_ORIGEN,
  repartidor: {
    id: 'REP-04',
    nombre: 'Carlos Silva Morales',
    telefono: '+56 9 4432 1190',
    foto: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    vehiculo: 'Furgón Hyundai H-100 (Reparto Gas)',
    patente: 'BV-9281',
    calificacion: 4.9,
    entregasRealizadas: 428,
  },
  items: [
    {
      codigo: 'GAS-15KG',
      nombre: 'Cilindro de Gas Licuado 15 Kg',
      cantidad: 1,
      precioUnitario: 21500,
      subtotal: 21500,
    },
    {
      codigo: 'REG-PREMIUM',
      nombre: 'Regulador Premium Gas Licuado con Flexible Certificado',
      cantidad: 1,
      precioUnitario: 14990,
      subtotal: 14990,
    },
  ],
  total: 36490,
  metodoPago: 'Pago al Repartidor',
  subMetodoPago: 'Efectivo / Tarjeta POS',
  posicionActual: {
    lat: COORDENADAS_PLANTA_ORIGEN.lat,
    lng: COORDENADAS_PLANTA_ORIGEN.lng,
    indicePunto: 0,
    rumbo: 185,
  },
  ultimaActualizacion: new Date().toISOString(),
}

/**
 * Obtiene la entrega activa de localStorage o inicializa la de ejemplo
 */
export function obtenerEntregaActiva() {
  try {
    const raw = localStorage.getItem(CLAVE_ENTREGA_REPARTO)
    if (raw) {
      return JSON.parse(raw)
    }
  } catch (err) {
    console.warn('Error leyendo entrega activa de localStorage', err)
  }
  // Si no existe, guardar la de ejemplo
  guardarEntregaActiva(ENTREGA_EJEMPLO)
  return ENTREGA_EJEMPLO
}

/**
 * Guarda y notifica cambios a todas las pestañas y componentes
 */
export function guardarEntregaActiva(datos) {
  try {
    const actualizado = {
      ...datos,
      ultimaActualizacion: new Date().toISOString(),
    }
    localStorage.setItem(CLAVE_ENTREGA_REPARTO, JSON.stringify(actualizado))
    window.dispatchEvent(
      new CustomEvent(EVENTO_REPARTO, { detail: actualizado })
    )
    return actualizado
  } catch (err) {
    console.error('Error guardando entrega en localStorage', err)
    return datos
  }
}

/**
 * Reinicia la entrega a su estado inicial de demostración
 */
export function reiniciarEntregaDemo() {
  const reiniciado = {
    ...ENTREGA_EJEMPLO,
    estado: 'en_camino',
    posicionActual: {
      lat: COORDENADAS_PLANTA_ORIGEN.lat,
      lng: COORDENADAS_PLANTA_ORIGEN.lng,
      indicePunto: 0,
      rumbo: 185,
    },
    etaMinutos: 9,
    distanciaKm: 2.4,
    velocidadActualKmH: 42,
    ultimaActualizacion: new Date().toISOString(),
  }
  return guardarEntregaActiva(reiniciado)
}

/**
 * Actualiza la posición y telemetría del repartidor
 */
export function actualizarPosicionRepartidor({
  lat,
  lng,
  indicePunto = 0,
  rumbo = 0,
  distanciaRestanteKm = null,
  etaMinutos = null,
  velocidadKmH = 40,
  nuevoEstado = null,
}) {
  const actual = obtenerEntregaActiva()
  const actualizado = {
    ...actual,
    posicionActual: {
      lat,
      lng,
      indicePunto,
      rumbo,
    },
    velocidadActualKmH: velocidadKmH,
    ...(distanciaRestanteKm !== null && { distanciaKm: distanciaRestanteKm }),
    ...(etaMinutos !== null && { etaMinutos }),
    ...(nuevoEstado && { estado: nuevoEstado }),
  }
  return guardarEntregaActiva(actualizado)
}

/**
 * Cambia el estado de la entrega ('asignado', 'en_camino', 'llegando', 'entregado')
 */
export function cambiarEstadoEntrega(nuevoEstado) {
  const actual = obtenerEntregaActiva()
  return guardarEntregaActiva({
    ...actual,
    estado: nuevoEstado,
    ...(nuevoEstado === 'entregado' && { etaMinutos: 0, distanciaKm: 0, velocidadActualKmH: 0 }),
  })
}

/**
 * Suscribe un callback a cambios de la entrega (en la misma pestaña o en otra)
 */
export function suscribirCambiosEntrega(callback) {
  const manejadorCustom = (e) => {
    if (e.detail) callback(e.detail)
  }
  const manejadorStorage = (e) => {
    if (e.key === CLAVE_ENTREGA_REPARTO && e.newValue) {
      try {
        callback(JSON.parse(e.newValue))
      } catch {
        // Ignorar
      }
    }
  }

  window.addEventListener(EVENTO_REPARTO, manejadorCustom)
  window.addEventListener('storage', manejadorStorage)

  return () => {
    window.removeEventListener(EVENTO_REPARTO, manejadorCustom)
    window.removeEventListener('storage', manejadorStorage)
  }
}

/**
 * Consulta la API pública gratuita de OSRM para obtener la ruta y pasos de conducción
 */
export async function obtenerRutaOSRM(
  origen = COORDENADAS_PLANTA_ORIGEN,
  destino = COORDENADAS_CLIENTE_DESTINO
) {
  const url = `https://router.project-osrm.org/route/v1/driving/${origen.lng},${origen.lat};${destino.lng},${destino.lat}?overview=full&geometries=geojson&steps=true`

  try {
    const respuesta = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!respuesta.ok) throw new Error(`OSRM error: ${respuesta.status}`)
    const datos = await respuesta.json()

    if (datos.code === 'Ok' && datos.routes && datos.routes.length > 0) {
      const ruta = datos.routes[0]
      // Coordenadas en formato [lat, lng] para Leaflet
      const puntos = ruta.geometry.coordinates.map(([lng, lat]) => [lat, lng])
      const distanciaTotalMetros = ruta.distance
      const duracionSegundos = ruta.duration

      // Instrucciones paso a paso
      const pasos = (ruta.legs[0]?.steps || []).map((step) => {
        const tipo = step.maneuver?.type || 'continue'
        const modificador = step.maneuver?.modifier || ''
        const nombreCalle = step.name || 'Calle sin nombre'
        let instruccion = step.maneuver?.instruction

        if (!instruccion) {
          if (tipo === 'depart') instruccion = `Salida por ${nombreCalle}`
          else if (tipo === 'arrive') instruccion = `Llegada a destino: ${nombreCalle}`
          else if (modificador.includes('left')) instruccion = `Gire a la izquierda en ${nombreCalle}`
          else if (modificador.includes('right')) instruccion = `Gire a la derecha en ${nombreCalle}`
          else instruccion = `Continúe recto por ${nombreCalle}`
        }

        return {
          instruccion,
          tipo,
          modificador,
          calle: nombreCalle,
          distancia: Math.round(step.distance),
          duracion: Math.round(step.duration),
        }
      })

      return {
        exito: true,
        puntos,
        pasos: pasos.length ? pasos : PASOS_FALLBACK_OSRM,
        distanciaKm: Number((distanciaTotalMetros / 1000).toFixed(1)),
        duracionMinutos: Math.max(1, Math.round(duracionSegundos / 60)),
      }
    }
  } catch (error) {
    console.warn('No se pudo obtener ruta de OSRM, usando trazado local optimizado', error)
  }

  // Fallback garantizado
  return {
    exito: false,
    puntos: RUTA_FALLBACK_PUENTE_ALTO,
    pasos: PASOS_FALLBACK_OSRM,
    distanciaKm: 2.4,
    duracionMinutos: 9,
  }
}

/**
 * Calcula el ángulo (rumbo) entre dos coordenadas lat/lng
 */
export function calcularRumbo(lat1, lon1, lat2, lon2) {
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180)
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon)
  const brng = (Math.atan2(y, x) * 180) / Math.PI
  return (brng + 360) % 360
}
