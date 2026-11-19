import { Variables } from '../config/variables'
import {
  Rutas,
  realizarPeticion,
  obtenerMensaje,
} from './endpoints'
import { fechaDeHoy } from '../utils/formato'

const CLAVE_ULTIMO_PEDIDO = 'ultimo_pedido_creado'

const obtenerHeadersAuth = (conJson = false) => {
  const token = localStorage.getItem(Variables.tokenKey)
  const headers = { Accept: 'application/json' }
  if (conJson) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

const formatearEstadoVenta = (estadoVenta) => {
  const norm = String(estadoVenta || '').toUpperCase()
  if (norm === 'ENTREGADO') return 'Entregado'
  if (norm === 'EN_RUTA') return 'En ruta'
  return 'Pendiente'
}

const normalizarVenta = (v) => {
  const fechaObj = v.fechaVenta ? new Date(v.fechaVenta) : new Date()
  const fechaValida = !Number.isNaN(fechaObj.getTime())

  return {
    id: String(v.id ?? ''),
    codigo: v.codigoVenta || `EV-${v.id}`,
    idUsuario: v.idUsuario ?? null,
    cliente: v.cliente || 'Cliente Particular',
    rut: v.rut || '',
    email: v.email || '',
    telefono: v.telefono || '',
    direccion: v.direccion || '',
    comuna: v.comuna || '',
    observacion: v.observacion || '',
    direccionDetalle: {
      direccion1: v.direccion || '',
      direccion2: '',
      comuna: v.comuna || '',
      observacion: v.observacion || '',
    },
    detalle: v.detalle || '',
    items: Array.isArray(v.items)
      ? v.items.map((it) => ({
          producto: {
            codigo: it.codigoProducto || it.producto?.codigo,
            nombre: it.nombreProducto || it.producto?.nombre,
            precio: Number(it.precioUnitario ?? it.producto?.precio ?? 0),
          },
          cantidad: Number(it.cantidad ?? 1),
          subtotal: Number(it.subtotal ?? 0),
        }))
      : [],
    total: Number(v.total ?? 0),
    metodoPago: v.metodoPago || 'efectivo',
    subMetodoPago:
      v.subMetodoPago || (v.metodoPago === 'pagar_ahora' ? 'webpay' : 'efectivo'),
    estado: v.estado && !v.estadoVenta ? v.estado : formatearEstadoVenta(v.estadoVenta),
    estadoPago: String(v.estadoPago || 'pendiente').toLowerCase(),
    repartidor: v.repartidor || null,
    fecha: fechaValida
      ? fechaObj
          .toLocaleDateString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
          .replaceAll('-', '/')
      : fechaDeHoy(),
    hora: fechaValida
      ? fechaObj.toLocaleTimeString('es-CL', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : '',
    codigoTransaccion: v.codigoTransaccion || null,
    codigoAutorizacion: v.codigoAutorizacion || null,
  }
}

export async function ListarPedidosServicio() {
  const respuesta = await realizarPeticion(Rutas.ventas, {
    method: 'GET',
    headers: obtenerHeadersAuth(false),
  })

  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok || !Array.isArray(datos)) {
    throw new Error(
      obtenerMensaje(
        datos?.mensaje || datos?.message,
        'No pudimos cargar la lista de pedidos en este momento.',
      ),
    )
  }

  return datos.map(normalizarVenta)
}

export const obtenerPedidos = ListarPedidosServicio

export async function crearNuevoPedido(datos) {
  const payload = {
    idUsuario: datos.idUsuario || 4,
    cliente: datos.cliente || 'Cliente Particular',
    rut: datos.rut || '',
    email: datos.email || '',
    telefono: datos.telefono || '+56 9 0000 0000',
    direccion: datos.direccion || 'Dirección no informada',
    comuna: datos.direccionDetalle?.comuna || datos.comuna || '',
    observacion: datos.direccionDetalle?.observacion || datos.observacion || '',
    metodoPago: datos.metodoPago || 'repartidor',
    items: (datos.items || []).map((it) => ({
      codigoProducto: it.producto?.codigo || it.codigoProducto,
      cantidad: Number(it.cantidad || 1),
    })),
  }

  const respuesta = await realizarPeticion(Rutas.ventas, {
    method: 'POST',
    headers: obtenerHeadersAuth(true),
    body: JSON.stringify(payload),
  })

  const resultado = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) {
    throw new Error(
      obtenerMensaje(
        resultado.mensaje || resultado.message,
        'No pudimos registrar tu pedido en este momento. Por favor, inténtalo nuevamente.',
      ),
    )
  }

  const pedidoNormalizado = {
    ...normalizarVenta(resultado),
    direccionDetalle: datos.direccionDetalle || {
      direccion1: datos.direccion || '',
      direccion2: '',
      comuna: datos.comuna || '',
      observacion: datos.observacion || '',
    },
    subMetodoPago: datos.subMetodoPago || 'efectivo',
    montoPaga: datos.montoPaga ?? datos.total ?? resultado.total,
    vuelto: datos.vuelto ?? 0,
    desgloseVuelto: datos.desgloseVuelto ?? null,
  }

  try {
    localStorage.setItem(CLAVE_ULTIMO_PEDIDO, JSON.stringify(pedidoNormalizado))
  } catch {
    // Ignorar error de almacenamiento
  }

  return pedidoNormalizado
}

export async function actualizarEstadoPago(id, datosPago = {}) {
  const payload = {
    idVenta: Number(id),
    montoPago: Number(datosPago.montoPago || datosPago.total || 1),
    metodoPago: datosPago.subMetodoPago || 'webpay_debito',
    tarjetaTerminacion: datosPago.tarjetaTerminacion || '0001',
    emailComprobante: datosPago.email || '',
    nombreTitular: datosPago.cliente || '',
    aprobarInmediatamente: true,
  }

  const respuesta = await realizarPeticion(Rutas.pagos, {
    method: 'POST',
    headers: obtenerHeadersAuth(true),
    body: JSON.stringify(payload),
  })

  const pago = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) {
    throw new Error(
      obtenerMensaje(
        pago.mensaje || pago.message,
        'No pudimos completar tu pago en este momento. No se ha realizado ningún cargo; por favor inténtalo nuevamente.',
      ),
    )
  }

  const previo = obtenerUltimoPedido() || {}
  const pedidoActualizado = {
    ...previo,
    id: String(id),
    email: datosPago.email || previo.email || '',
    cliente: datosPago.cliente || previo.cliente || '',
    estadoPago: 'pagado',
    subMetodoPago: datosPago.subMetodoPago || 'webpay_debito',
    codigoTransaccion: pago.codigoTransaccion || datosPago.codigoTransaccion,
    codigoAutorizacion: pago.codigoAutorizacion || datosPago.codigoAutorizacion,
    tarjetaTerminacion:
      pago.tarjetaTerminacion || datosPago.tarjetaTerminacion || '0001',
    fechaPago: pago.fechaPago || new Date().toISOString(),
  }

  try {
    localStorage.setItem(CLAVE_ULTIMO_PEDIDO, JSON.stringify(pedidoActualizado))
  } catch {
    // Ignorar error de almacenamiento
  }

  return pedidoActualizado
}

export function obtenerUltimoPedido() {
  try {
    const guardado = localStorage.getItem(CLAVE_ULTIMO_PEDIDO)
    return guardado ? JSON.parse(guardado) : null
  } catch {
    return null
  }
}

export async function asignarRepartidorPedido(idPedido, nombreRepartidor) {
  const respuesta = await realizarPeticion(
    Rutas.ventaRepartidor(idPedido, nombreRepartidor),
    {
      method: 'PUT',
      headers: obtenerHeadersAuth(false),
    },
  )

  const datos = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) {
    throw new Error(
      obtenerMensaje(
        datos.mensaje || datos.message,
        'No pudimos asignar el repartidor en este momento. Inténtalo nuevamente.',
      ),
    )
  }

  return normalizarVenta(datos)
}
