// Servicio de gestión de reparto, sincronización con ms-venta y navegación GPS en tiempo real
import {
  ListarPedidosServicio,
  obtenerPedidoPorId,
  obtenerPedidoPorCodigo,
  obtenerPedidosPorUsuario,
  obtenerUltimoPedido,
  actualizarSeguimientoPedido,
  marcarPedidoEntregado,
} from './pedidoService'
import { fechaDeHoy } from '../utils/formato'

const CLAVE_ENTREGA_REPARTO = 'el_volcan_entrega_activa'
const EVENTO_REPARTO = 'reparto_actualizado'
const CLAVE_ALERTAS_PREFIX = 'el_volcan_alertas_ruta_'
const EVENTO_ALERTAS = 'reparto_alertas_actualizadas'

const normalizarCodigoAlerta = (codigo) =>
  String(codigo || '')
    .replace('#', '')
    .trim()
    .toUpperCase()

export const normalizarAlertasRuta = (lista) => {
  if (!Array.isArray(lista)) return []
  return lista
    .filter(
      (a) =>
        a &&
        typeof a.lat === 'number' &&
        typeof a.lng === 'number' &&
        typeof a.etiqueta === 'string' &&
        a.etiqueta.trim().length > 0
    )
    .map((a, idx) => ({
      id: String(a.id || `alerta-${idx}-${a.lat}-${a.lng}`),
      tipo: String(a.tipo || 'alerta'),
      etiqueta: a.etiqueta.trim(),
      color: String(a.color || '#FFC043'),
      textoColor: String(a.textoColor || '#121212'),
      lat: a.lat,
      lng: a.lng,
      horaChile: String(a.horaChile || ''),
      reportadoPor: String(a.reportadoPor || 'Repartidor'),
    }))
}

export function obtenerAlertasRutaPedido(codigoVenta) {
  const clave = normalizarCodigoAlerta(codigoVenta)
  if (!clave) return []
  try {
    const raw = localStorage.getItem(`${CLAVE_ALERTAS_PREFIX}${clave}`)
    return raw ? normalizarAlertasRuta(JSON.parse(raw)) : []
  } catch {
    return []
  }
}

export function guardarAlertasRutaPedido(codigoVenta, alertas = []) {
  const clave = normalizarCodigoAlerta(codigoVenta)
  const limpias = normalizarAlertasRuta(alertas)
  if (!clave) return limpias
  try {
    localStorage.setItem(`${CLAVE_ALERTAS_PREFIX}${clave}`, JSON.stringify(limpias))
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent(EVENTO_ALERTAS, {
          detail: { codigoVenta: clave, alertas: limpias },
        })
      )
    }
  } catch {
    // Ignorar errores de cuota de almacenamiento
  }
  return limpias
}

export function suscribirAlertasRuta(codigoVenta, callback) {
  const clave = normalizarCodigoAlerta(codigoVenta)
  if (!clave || typeof window === 'undefined') return () => {}

  const manejadorCustom = (e) => {
    if (normalizarCodigoAlerta(e?.detail?.codigoVenta) === clave) {
      callback(normalizarAlertasRuta(e.detail.alertas))
    }
  }
  const manejadorStorage = (e) => {
    if (e.key === `${CLAVE_ALERTAS_PREFIX}${clave}`) {
      try {
        callback(e.newValue ? normalizarAlertasRuta(JSON.parse(e.newValue)) : [])
      } catch {
        // Ignorar
      }
    }
  }

  window.addEventListener(EVENTO_ALERTAS, manejadorCustom)
  window.addEventListener('storage', manejadorStorage)

  return () => {
    window.removeEventListener(EVENTO_ALERTAS, manejadorCustom)
    window.removeEventListener('storage', manejadorStorage)
  }
}

export async function sincronizarAlertasRutaConBackend(entrega, alertas = []) {
  const codigo = entrega?.codigoVenta || entrega?.id
  const limpias = guardarAlertasRutaPedido(codigo, alertas)

  // Actualizar también la entrega activa en localStorage si coincide
  try {
    const raw = localStorage.getItem(CLAVE_ENTREGA_REPARTO)
    if (raw) {
      const actual = JSON.parse(raw)
      if (normalizarCodigoAlerta(actual?.codigoVenta) === normalizarCodigoAlerta(codigo)) {
        guardarEntregaActiva({ ...actual, alertasRuta: limpias })
      }
    }
  } catch {
    // Ignorar
  }

  const ventaId = entrega?.ventaId
  if (!ventaId) return limpias

  try {
    await actualizarSeguimientoPedido(ventaId, {
      alertasRuta: limpias,
      ...(entrega.repartidor?.asignado && entrega.repartidor?.nombre
        ? { repartidor: entrega.repartidor.nombre }
        : {}),
    })
  } catch {
    // Se mantienen disponibles localmente en caso de error temporal de red
  }
  return limpias
}

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
    instruccion: 'Gire levemente a la derecha hacia el destino',
    tipo: 'turn-slight-right',
    distancia: 150,
    calle: 'Av. Concha y Toro 1340',
  },
  {
    instruccion: 'Ha llegado a su destino de entrega',
    tipo: 'arrive',
    distancia: 0,
    calle: 'Domicilio Cliente',
  },
]

const AVATAR_REPARTIDOR_DEFECTO =
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'

export const ENTREGA_EJEMPLO = {
  id: 'EV-1024',
  ventaId: null,
  codigoVenta: 'EV-1024',
  esDemo: true,
  estado: 'en_camino', // 'pendiente' | 'asignado' | 'en_camino' | 'llegando' | 'entregado' | 'cancelado'
  estadoPago: 'pendiente',
  fecha: fechaDeHoy(),
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
    foto: AVATAR_REPARTIDOR_DEFECTO,
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
  auditoria: [],
  alertasRuta: [],
  ultimaActualizacion: new Date().toISOString(),
}

const mapearEstadoDespacho = (venta) => {
  const estadoDespachoBackend = String(
    venta?.entrega?.estado_despacho || ''
  ).toLowerCase()
  if (
    ['pendiente', 'asignado', 'en_camino', 'llegando', 'entregado', 'cancelado'].includes(
      estadoDespachoBackend
    )
  ) {
    return estadoDespachoBackend
  }

  const estadoVenta = String(venta?.estadoVenta || venta?.estado || '').toUpperCase()
  if (estadoVenta.includes('ENTREGADO')) return 'entregado'
  if (estadoVenta.includes('CANCELAD')) return 'cancelado'
  if (estadoVenta.includes('RUTA')) return 'en_camino'
  if (venta?.repartidor) return 'asignado'
  return 'pendiente'
}

const resolverCoordenadasValidas = (entregaBackend, comuna = '') => {
  const dest = entregaBackend?.destino
  if (
    dest &&
    typeof dest.lat === 'number' &&
    typeof dest.lng === 'number' &&
    dest.lat < -32.5 &&
    dest.lat > -34.5
  ) {
    return {
      lat: dest.lat,
      lng: dest.lng,
      direccion: dest.direccion || COORDENADAS_CLIENTE_DESTINO.direccion,
    }
  }

  const geo = entregaBackend?.ubicacion?.coordinates
  if (
    Array.isArray(geo) &&
    geo.length === 2 &&
    typeof geo[1] === 'number' &&
    typeof geo[0] === 'number' &&
    geo[1] < -32.5 &&
    geo[1] > -34.5
  ) {
    return {
      lat: geo[1],
      lng: geo[0],
      direccion: entregaBackend?.direccion_entrega || COORDENADAS_CLIENTE_DESTINO.direccion,
    }
  }

  const c = String(comuna || '').toLowerCase()
  if (c.includes('florida')) {
    return { lat: -33.5425, lng: -70.5882, direccion: 'La Florida, Santiago' }
  }
  return COORDENADAS_CLIENTE_DESTINO
}

/**
 * Convierte una Venta real del backend (ms-venta / MongoDB) en el objeto de seguimiento/entrega
 */
export function ventaAEntrega(venta) {
  if (!venta) return null

  const ent = venta.entrega || {}
  const estado = mapearEstadoDespacho(venta)
  const destinoCoords = resolverCoordenadasValidas(ent, venta.comuna)
  const origenCoords =
    ent.origen && typeof ent.origen.lat === 'number' && typeof ent.origen.lng === 'number'
      ? ent.origen
      : COORDENADAS_PLANTA_ORIGEN

  const posBackend = ent.posicion_actual || {}
  const latActual =
    typeof posBackend.lat === 'number'
      ? posBackend.lat
      : estado === 'entregado'
      ? destinoCoords.lat
      : origenCoords.lat
  const lngActual =
    typeof posBackend.lng === 'number'
      ? posBackend.lng
      : estado === 'entregado'
      ? destinoCoords.lng
      : origenCoords.lng

  const direccionCompleta =
    ent.direccion_entrega ||
    [venta.direccion, venta.comuna].filter(Boolean).join(', ') ||
    'Dirección registrada en pedido'

  const itemsNormalizados = Array.isArray(venta.items) && venta.items.length > 0
    ? venta.items.map((it) => ({
        codigo: it.producto?.codigo || it.codigoProducto || 'PROD',
        nombre: it.producto?.nombre || it.nombreProducto || 'Producto El Volcán',
        cantidad: Number(it.cantidad || 1),
        precioUnitario: Number(it.producto?.precio ?? it.precioUnitario ?? 0),
        subtotal: Number(it.subtotal || 0),
      }))
    : venta.detalle
    ? [
        {
          codigo: 'PED',
          nombre: venta.detalle,
          cantidad: 1,
          precioUnitario: Number(venta.total || 0),
          subtotal: Number(venta.total || 0),
        },
      ]
    : []

  const nombreRepartidor = venta.repartidor || ent.repartidor_nombre || null

  return {
    id: String(venta.codigo || venta.codigoVenta || venta.id),
    ventaId: Number(venta.id) || null,
    codigoVenta: String(venta.codigo || venta.codigoVenta || `EV-${venta.id}`),
    esDemo: false,
    estado,
    estadoPago: String(venta.estadoPago || 'pendiente').toLowerCase(),
    fecha: venta.fecha || fechaDeHoy(),
    horaSalida: venta.hora || '',
    fechaVentaChile: venta.fechaVentaChile || null,
    etaMinutos:
      estado === 'entregado'
        ? 0
        : Number(ent.eta_minutos ?? (estado === 'pendiente' ? 15 : 9)),
    distanciaKm:
      estado === 'entregado' ? 0 : Number(ent.distancia_km ?? 2.4),
    velocidadActualKmH:
      estado === 'entregado' ? 0 : Number(ent.velocidad_kmh ?? (estado === 'en_camino' ? 38 : 0)),
    cliente: {
      nombre: venta.cliente || 'Cliente El Volcán',
      telefono: venta.telefono || '+56 9 0000 0000',
      direccion: direccionCompleta,
      comuna: venta.comuna || 'Puente Alto',
      depto: venta.direccionDetalle?.direccion2 || '',
      instrucciones: venta.observacion || 'Sin indicaciones adicionales.',
      coordenadas: destinoCoords,
    },
    origen: origenCoords,
    repartidor: {
      id: nombreRepartidor ? `REP-${nombreRepartidor.slice(0, 3).toUpperCase()}` : 'SIN-ASIGNAR',
      nombre: nombreRepartidor || 'Por asignar en planta',
      asignado: Boolean(nombreRepartidor),
      telefono: ent.repartidor_telefono || '+56 9 3333 3333',
      foto: AVATAR_REPARTIDOR_DEFECTO,
      vehiculo: ent.repartidor_vehiculo || 'Camión Reparto Gas El Volcán',
      patente: ent.repartidor_patente || 'KJ-WP-42',
      calificacion: 4.9,
      entregasRealizadas: 428,
    },
    items: itemsNormalizados,
    total: Number(venta.total || 0),
    metodoPago:
      venta.metodoPago === 'pagar_ahora' ? 'Pago en Línea (Webpay)' : 'Pago al Repartidor',
    subMetodoPago:
      venta.subMetodoPago ||
      (venta.metodoPago === 'pagar_ahora' ? 'Webpay' : 'Efectivo / Tarjeta POS'),
    posicionActual: {
      lat: latActual,
      lng: lngActual,
      indicePunto: Number(posBackend.indice_punto ?? 0),
      rumbo: Number(posBackend.rumbo ?? 180),
    },
    auditoria: Array.isArray(venta.auditoria) ? venta.auditoria : [],
    alertasRuta: Array.isArray(ent.alertas_ruta)
      ? normalizarAlertasRuta(ent.alertas_ruta)
      : obtenerAlertasRutaPedido(
          String(venta.codigo || venta.codigoVenta || `EV-${venta.id}`)
        ),
    ultimaActualizacion:
      ent.ultima_actualizacion_chile || venta.fechaVentaChile || new Date().toISOString(),
  }
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
      ultimaActualizacion: datos.ultimaActualizacion || new Date().toISOString(),
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
 * Carga una entrega real desde ms-venta (por código, ID, usuario autenticado o último pedido)
 */
export async function cargarEntregaDesdeBackend(identificador = null, usuario = null) {
  try {
    if (identificador) {
      const idStr = String(identificador).replace('#', '').trim()
      let venta = null
      if (/^\d+$/.test(idStr)) {
        venta = await obtenerPedidoPorId(idStr)
      } else {
        venta = await obtenerPedidoPorCodigo(idStr)
      }
      if (venta) {
        const entrega = ventaAEntrega(venta)
        return guardarEntregaActiva(entrega)
      }
    }

    // Si el usuario tiene un último pedido recién creado en esta sesión, priorizarlo desde el backend
    const ultimoLocal = obtenerUltimoPedido()
    if (ultimoLocal?.id && /^\d+$/.test(String(ultimoLocal.id))) {
      try {
        const ventaFresca = await obtenerPedidoPorId(ultimoLocal.id)
        if (ventaFresca) {
          return guardarEntregaActiva(ventaAEntrega(ventaFresca))
        }
      } catch {
        // Continuar buscando en pedidos del usuario
      }
    }

    // Si hay usuario autenticado, buscar su pedido más reciente en ms-venta
    const idUsuario = usuario?.idUsuario ?? usuario?.id
    if (idUsuario && /^\d+$/.test(String(idUsuario))) {
      const pedidosUsuario = await obtenerPedidosPorUsuario(idUsuario)
      if (Array.isArray(pedidosUsuario) && pedidosUsuario.length > 0) {
        const ordenados = [...pedidosUsuario].sort(
          (a, b) => Number(b.id || 0) - Number(a.id || 0)
        )
        const preferido =
          ordenados.find((p) => p.estado !== 'Cancelada') || ordenados[0]
        return guardarEntregaActiva(ventaAEntrega(preferido))
      }
    }

    // Si no hay usuario o no tiene pedidos propios, buscar el pedido en ruta más reciente en el sistema
    const todos = await ListarPedidosServicio()
    if (Array.isArray(todos) && todos.length > 0) {
      const ordenados = [...todos].sort((a, b) => Number(b.id || 0) - Number(a.id || 0))
      const activo =
        ordenados.find((p) => p.estado === 'En ruta') ||
        ordenados.find((p) => p.estado === 'Pendiente') ||
        ordenados[0]
      if (activo) {
        return guardarEntregaActiva(ventaAEntrega(activo))
      }
    }
  } catch {
    // Fallback elegante si el backend no está disponible
  }

  return obtenerEntregaActiva()
}

/**
 * Carga únicamente entregas REALES desde ms-venta (sin fallback a datos demo).
 * Retorna null si el cliente no tiene pedidos o si el código no existe.
 */
export async function cargarEntregaRealDesdeBackend(
  identificador = null,
  usuario = null
) {
  if (identificador) {
    const idStr = String(identificador).replace('#', '').trim()
    const venta = /^\d+$/.test(idStr)
      ? await obtenerPedidoPorId(idStr)
      : await obtenerPedidoPorCodigo(idStr)
    return venta ? ventaAEntrega(venta) : null
  }

  const idUsuario = usuario?.idUsuario ?? usuario?.id
  if (idUsuario && /^\d+$/.test(String(idUsuario))) {
    try {
      const pedidosUsuario = await obtenerPedidosPorUsuario(idUsuario)
      if (Array.isArray(pedidosUsuario) && pedidosUsuario.length > 0) {
        const ordenados = [...pedidosUsuario].sort(
          (a, b) => Number(b.id || 0) - Number(a.id || 0)
        )
        const preferido =
          ordenados.find((p) => p.estado !== 'Cancelada') || ordenados[0]
        return ventaAEntrega(preferido)
      }
    } catch {
      return null
    }
  }

  return null
}

/**
 * Genera una copia aislada de datos de prueba para la vista Test de Seguimiento
 * (no modifica localStorage ni afecta al seguimiento real del cliente).
 */
export function crearEntregaTestInicial() {
  return {
    ...ENTREGA_EJEMPLO,
    id: 'TEST-1024',
    codigoVenta: 'TEST-1024',
    esDemo: true,
    estado: 'en_camino',
    fecha: fechaDeHoy(),
    fechaVentaChile: new Date().toISOString(),
    etaMinutos: 9,
    distanciaKm: 2.4,
    velocidadActualKmH: 42,
    cliente: {
      ...ENTREGA_EJEMPLO.cliente,
      coordenadas: { ...COORDENADAS_CLIENTE_DESTINO },
    },
    origen: { ...COORDENADAS_PLANTA_ORIGEN },
    repartidor: { ...ENTREGA_EJEMPLO.repartidor, asignado: true },
    items: ENTREGA_EJEMPLO.items.map((it) => ({ ...it })),
    posicionActual: {
      lat: COORDENADAS_PLANTA_ORIGEN.lat,
      lng: COORDENADAS_PLANTA_ORIGEN.lng,
      indicePunto: 0,
      rumbo: 185,
    },
    auditoria: [
      {
        evento: 'TEST_INICIADO',
        descripcion: 'Simulación de seguimiento iniciada desde Planta El Volcán',
        fecha_chile: new Date().toISOString(),
      },
    ],
    ultimaActualizacion: new Date().toISOString(),
  }
}

/**
 * Obtiene la cola real de entregas desde ms-venta para la consola del repartidor
 */
export async function listarEntregasParaRepartidor(usuario = null) {
  try {
    const todas = await ListarPedidosServicio()
    if (!Array.isArray(todas) || todas.length === 0) return []

    const activas = todas
      .filter((v) => v.estado !== 'Cancelada')
      .sort((a, b) => {
        const prioridad = (e) => (e === 'En ruta' ? 0 : e === 'Pendiente' ? 1 : 2)
        const diff = prioridad(a.estado) - prioridad(b.estado)
        return diff !== 0 ? diff : Number(b.id || 0) - Number(a.id || 0)
      })

    const rol = String(usuario?.rol || usuario?.perfil || '').toLowerCase()
    const nombreRepartidor = String(usuario?.nombre || '').trim().toLowerCase()

    if (rol === 'repartidor' && nombreRepartidor) {
      const propias = activas.filter(
        (v) =>
          !v.repartidor ||
          String(v.repartidor).trim().toLowerCase() === nombreRepartidor
      )
      if (propias.length > 0) {
        return propias.map(ventaAEntrega)
      }
    }

    return activas.map(ventaAEntrega)
  } catch {
    return []
  }
}

/**
 * Sincroniza la telemetría GPS con ms-venta (MongoDB) si la entrega corresponde a una venta real
 */
export async function sincronizarPosicionConBackend(entrega, telemetria = {}) {
  const ventaId = entrega?.ventaId
  if (!ventaId) return null

  try {
    const ventaActualizada = await actualizarSeguimientoPedido(ventaId, {
      lat: telemetria.lat,
      lng: telemetria.lng,
      rumbo: telemetria.rumbo,
      indicePunto: telemetria.indicePunto,
      distanciaKm: telemetria.distanciaRestanteKm ?? telemetria.distanciaKm,
      etaMinutos: telemetria.etaMinutos,
      velocidadKmH: telemetria.velocidadKmH,
      estadoDespacho: telemetria.nuevoEstado || entrega.estado,
      repartidor: entrega.repartidor?.asignado ? entrega.repartidor.nombre : undefined,
    })
    return ventaAEntrega(ventaActualizada)
  } catch {
    return null
  }
}

/**
 * Sincroniza un cambio de estado ('en_camino', 'llegando', 'entregado') con ms-venta (MongoDB)
 */
export async function sincronizarEstadoConBackend(entrega, nuevoEstado, nombreRepartidor = null) {
  const ventaId = entrega?.ventaId
  if (!ventaId) return null

  try {
    let ventaActualizada
    if (nuevoEstado === 'entregado') {
      ventaActualizada = await marcarPedidoEntregado(ventaId)
    } else {
      ventaActualizada = await actualizarSeguimientoPedido(ventaId, {
        lat: entrega.posicionActual?.lat,
        lng: entrega.posicionActual?.lng,
        rumbo: entrega.posicionActual?.rumbo,
        indicePunto: entrega.posicionActual?.indicePunto,
        etaMinutos: nuevoEstado === 'llegando' ? 1 : entrega.etaMinutos,
        distanciaKm: nuevoEstado === 'llegando' ? 0.1 : entrega.distanciaKm,
        velocidadKmH: nuevoEstado === 'llegando' ? 0 : entrega.velocidadActualKmH,
        estadoDespacho: nuevoEstado,
        ...(nombreRepartidor ? { repartidor: nombreRepartidor } : {}),
      })
    }
    const sincronizada = ventaAEntrega(ventaActualizada)
    return guardarEntregaActiva(sincronizada)
  } catch {
    return null
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
 * Actualiza la posición y telemetría del repartidor (local + evento)
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
    ultimaActualizacion: new Date().toISOString(),
  }
  return guardarEntregaActiva(actualizado)
}

/**
 * Cambia el estado de la entrega ('pendiente', 'asignado', 'en_camino', 'llegando', 'entregado')
 */
export function cambiarEstadoEntrega(nuevoEstado) {
  const actual = obtenerEntregaActiva()
  return guardarEntregaActiva({
    ...actual,
    estado: nuevoEstado,
    ...(nuevoEstado === 'entregado' && {
      etaMinutos: 0,
      distanciaKm: 0,
      velocidadActualKmH: 0,
      estadoPago: 'pagado',
    }),
    ultimaActualizacion: new Date().toISOString(),
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
      const puntos = ruta.geometry.coordinates.map(([lng, lat]) => [lat, lng])
      const distanciaTotalMetros = ruta.distance
      const duracionSegundos = ruta.duration

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

/**
 * Calcula la distancia estimada en km por trama urbana entre dos puntos lat/lng (Haversine * factor vial 1.28)
 */
export function calcularDistanciaKm(lat1, lng1, lat2, lng2) {
  if (
    typeof lat1 !== 'number' ||
    typeof lng1 !== 'number' ||
    typeof lat2 !== 'number' ||
    typeof lng2 !== 'number'
  ) {
    return 0
  }
  const R = 6371
  const toRad = (deg) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const recta = R * c
  return Number((recta * 1.28).toFixed(2))
}

const resolverOrdenOptimoDesdeMatriz = (matriz) => {
  const totalNodos = matriz.length
  const n = totalNodos - 1 // nodo 0 = punto actual, nodos 1..n = pedidos pendientes
  if (n <= 0) return []
  if (n === 1) return [0]

  // Programación dinámica exacta (Held-Karp) para hasta 10 paradas pendientes: garantiza óptimo global
  if (n <= 10) {
    const estados = 1 << n
    const dp = Array.from({ length: estados }, () => new Float64Array(n).fill(Infinity))
    const padre = Array.from({ length: estados }, () => new Int8Array(n).fill(-1))

    for (let i = 0; i < n; i++) {
      dp[1 << i][i] = matriz[0][i + 1]
    }

    for (let mask = 1; mask < estados; mask++) {
      for (let ultimo = 0; ultimo < n; ultimo++) {
        const costoActual = dp[mask][ultimo]
        if (!Number.isFinite(costoActual)) continue
        for (let sig = 0; sig < n; sig++) {
          if (mask & (1 << sig)) continue
          const sigMask = mask | (1 << sig)
          const nuevoCosto = costoActual + matriz[ultimo + 1][sig + 1]
          if (nuevoCosto < dp[sigMask][sig]) {
            dp[sigMask][sig] = nuevoCosto
            padre[sigMask][sig] = ultimo
          }
        }
      }
    }

    const maskFinal = estados - 1
    let mejorFin = 0
    let mejorCosto = Infinity
    for (let i = 0; i < n; i++) {
      if (dp[maskFinal][i] < mejorCosto) {
        mejorCosto = dp[maskFinal][i]
        mejorFin = i
      }
    }

    const orden = []
    let mask = maskFinal
    let curr = mejorFin
    while (curr !== -1) {
      orden.push(curr)
      const prev = padre[mask][curr]
      mask ^= 1 << curr
      curr = prev
    }
    return orden.reverse()
  }

  // Vecino más cercano + mejora 2-opt para colas grandes (> 10 paradas)
  const visitados = new Set()
  const ruta = []
  let nodoActual = 0
  while (ruta.length < n) {
    let mejorIdx = -1
    let mejorDist = Infinity
    for (let i = 0; i < n; i++) {
      if (visitados.has(i)) continue
      const d = matriz[nodoActual][i + 1]
      if (d < mejorDist) {
        mejorDist = d
        mejorIdx = i
      }
    }
    visitados.add(mejorIdx)
    ruta.push(mejorIdx)
    nodoActual = mejorIdx + 1
  }

  const costoRuta = (seq) => {
    let total = matriz[0][seq[0] + 1]
    for (let i = 1; i < seq.length; i++) {
      total += matriz[seq[i - 1] + 1][seq[i] + 1]
    }
    return total
  }

  let mejoro = true
  while (mejoro) {
    mejoro = false
    const base = costoRuta(ruta)
    for (let i = 0; i < ruta.length - 1; i++) {
      for (let j = i + 1; j < ruta.length; j++) {
        const candidata = [
          ...ruta.slice(0, i),
          ...ruta.slice(i, j + 1).reverse(),
          ...ruta.slice(j + 1),
        ]
        if (costoRuta(candidata) + 1e-6 < base) {
          ruta.splice(0, ruta.length, ...candidata)
          mejoro = true
          break
        }
      }
      if (mejoro) break
    }
  }

  return ruta
}

const extraerCoordsEntrega = (entrega) => {
  const c = entrega?.cliente?.coordenadas
  if (c && typeof c.lat === 'number' && typeof c.lng === 'number') {
    return { lat: c.lat, lng: c.lng }
  }
  return {
    lat: COORDENADAS_CLIENTE_DESTINO.lat,
    lng: COORDENADAS_CLIENTE_DESTINO.lng,
  }
}

/**
 * Calcula la mejor ruta óptima de entrega para todos los pedidos pendientes
 * partiendo desde la ubicación actual del repartidor (o Planta El Volcán).
 */
export function calcularMejorRutaEntregas(
  entregas = [],
  puntoActual = COORDENADAS_PLANTA_ORIGEN,
  matrizPersonalizada = null
) {
  const origen = {
    lat:
      typeof puntoActual?.lat === 'number'
        ? puntoActual.lat
        : COORDENADAS_PLANTA_ORIGEN.lat,
    lng:
      typeof puntoActual?.lng === 'number'
        ? puntoActual.lng
        : COORDENADAS_PLANTA_ORIGEN.lng,
    nombre: puntoActual?.nombre || COORDENADAS_PLANTA_ORIGEN.nombre,
    direccion: puntoActual?.direccion || COORDENADAS_PLANTA_ORIGEN.direccion,
  }

  const pendientes = (Array.isArray(entregas) ? entregas : []).filter(
    (e) => e && e.estado !== 'entregado' && e.estado !== 'cancelado'
  )

  if (pendientes.length === 0) {
    return {
      origen,
      paradas: [],
      distanciaTotalKm: 0,
      distanciaOriginalKm: 0,
      ahorroKm: 0,
      ahorroPorcentaje: 0,
      duracionTotalMin: 0,
      ahorroMin: 0,
      pedidoRecomendado: null,
      usandoCallesReales: false,
    }
  }

  const nodos = [origen, ...pendientes.map(extraerCoordsEntrega)]
  const totalNodos = nodos.length

  const matrizKm =
    matrizPersonalizada?.distanciasKm &&
    matrizPersonalizada.distanciasKm.length === totalNodos
      ? matrizPersonalizada.distanciasKm
      : Array.from({ length: totalNodos }, (_, i) =>
          Array.from({ length: totalNodos }, (_, j) =>
            i === j
              ? 0
              : calcularDistanciaKm(
                  nodos[i].lat,
                  nodos[i].lng,
                  nodos[j].lat,
                  nodos[j].lng
                )
          )
        )

  const matrizMin =
    matrizPersonalizada?.duracionesMin &&
    matrizPersonalizada.duracionesMin.length === totalNodos
      ? matrizPersonalizada.duracionesMin
      : matrizKm.map((fila, i) =>
          fila.map((km, j) =>
            i === j ? 0 : Math.max(2, Math.round((km / 28) * 60))
          )
        )

  // Costo del orden original sin optimizar
  let distanciaOriginalKm = 0
  let duracionOriginalMin = 0
  let nodoPrevOrig = 0
  for (let i = 0; i < pendientes.length; i++) {
    distanciaOriginalKm += matrizKm[nodoPrevOrig][i + 1]
    duracionOriginalMin += matrizMin[nodoPrevOrig][i + 1]
    nodoPrevOrig = i + 1
  }

  // Orden óptimo calculado
  const ordenOptimo = resolverOrdenOptimoDesdeMatriz(matrizKm)

  let distanciaAcumuladaKm = 0
  let etaAcumuladaMin = 0
  let nodoPrevOpt = 0

  const paradas = ordenOptimo.map((idxPendiente, pos) => {
    const nodoDestino = idxPendiente + 1
    const distanciaTramoKm = Number(
      matrizKm[nodoPrevOpt][nodoDestino].toFixed(1)
    )
    const distanciaDesdeActualKm = Number(
      matrizKm[0][nodoDestino].toFixed(1)
    )
    const etaTramoMin = Math.max(1, Math.round(matrizMin[nodoPrevOpt][nodoDestino]))

    distanciaAcumuladaKm = Number(
      (distanciaAcumuladaKm + distanciaTramoKm).toFixed(1)
    )
    etaAcumuladaMin += etaTramoMin
    nodoPrevOpt = nodoDestino

    return {
      orden: pos + 1,
      esRecomendado: pos === 0,
      entrega: pendientes[idxPendiente],
      distanciaTramoKm,
      distanciaDesdeActualKm,
      distanciaAcumuladaKm,
      etaTramoMin,
      etaAcumuladaMin,
    }
  })

  const distanciaTotalKm = Number(distanciaAcumuladaKm.toFixed(1))
  const distanciaOriginalRedondeada = Number(distanciaOriginalKm.toFixed(1))
  const ahorroKm = Math.max(
    0,
    Number((distanciaOriginalRedondeada - distanciaTotalKm).toFixed(1))
  )
  const ahorroPorcentaje =
    distanciaOriginalRedondeada > 0 && ahorroKm > 0
      ? Math.round((ahorroKm / distanciaOriginalRedondeada) * 100)
      : 0
  const ahorroMin = Math.max(0, Math.round(duracionOriginalMin - etaAcumuladaMin))

  return {
    origen,
    paradas,
    distanciaTotalKm,
    distanciaOriginalKm: distanciaOriginalRedondeada,
    ahorroKm,
    ahorroPorcentaje,
    duracionTotalMin: etaAcumuladaMin,
    ahorroMin,
    pedidoRecomendado: paradas[0]?.entrega || null,
    usandoCallesReales: Boolean(matrizPersonalizada?.distanciasKm),
  }
}

/**
 * Refina la mejor ruta consultando la matriz real de conducción OSRM Table API.
 * Si OSRM falla o supera el tiempo límite, retorna el cálculo local instantáneo.
 */
export async function calcularMejorRutaConOSRM(
  entregas = [],
  puntoActual = COORDENADAS_PLANTA_ORIGEN
) {
  const resultadoLocal = calcularMejorRutaEntregas(entregas, puntoActual)
  const pendientes = (Array.isArray(entregas) ? entregas : []).filter(
    (e) => e && e.estado !== 'entregado' && e.estado !== 'cancelado'
  )

  if (pendientes.length < 2 || pendientes.length > 12) {
    return resultadoLocal
  }

  const nodos = [resultadoLocal.origen, ...pendientes.map(extraerCoordsEntrega)]
  const coordsStr = nodos.map((p) => `${p.lng},${p.lat}`).join(';')
  const url = `https://router.project-osrm.org/table/v1/driving/${coordsStr}?annotations=distance,duration`

  const controlador =
    typeof AbortController !== 'undefined' ? new AbortController() : null
  const timer = controlador
    ? setTimeout(() => controlador.abort(), 3500)
    : null

  try {
    const resp = await fetch(url, {
      headers: { Accept: 'application/json' },
      ...(controlador ? { signal: controlador.signal } : {}),
    })
    if (!resp.ok) return resultadoLocal
    const datos = await resp.json()
    if (
      datos?.code === 'Ok' &&
      Array.isArray(datos.distances) &&
      datos.distances.length === nodos.length
    ) {
      const distanciasKm = datos.distances.map((fila, i) =>
        fila.map((metros, j) =>
          typeof metros === 'number'
            ? Number((metros / 1000).toFixed(2))
            : calcularDistanciaKm(
                nodos[i].lat,
                nodos[i].lng,
                nodos[j].lat,
                nodos[j].lng
              )
        )
      )
      const duracionesMin = Array.isArray(datos.durations)
        ? datos.durations.map((fila, i) =>
            fila.map((seg, j) =>
              i === j
                ? 0
                : typeof seg === 'number'
                ? Math.max(1, Math.round(seg / 60))
                : Math.max(2, Math.round((distanciasKm[i][j] / 28) * 60))
            )
          )
        : null

      return calcularMejorRutaEntregas(entregas, puntoActual, {
        distanciasKm,
        duracionesMin,
      })
    }
  } catch {
    // Fallback elegante al cálculo urbano local
  } finally {
    if (timer) clearTimeout(timer)
  }

  return resultadoLocal
}
