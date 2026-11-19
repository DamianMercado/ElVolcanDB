import { Variables } from '../config/variables'
import {
  Rutas,
  realizarPeticion,
  obtenerMensaje,
} from './endpoints'
import { fechaDeHoy } from '../utils/formato'

const obtenerHeadersAuth = (conJson = false) => {
  const token = localStorage.getItem(Variables.tokenKey)
  const headers = { Accept: 'application/json' }
  if (conJson) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

const normalizarMovimiento = (m) => {
  const fechaObj = m.fechaMovimiento ? new Date(m.fechaMovimiento) : null
  const fechaFormateada =
    fechaObj && !Number.isNaN(fechaObj.getTime())
      ? fechaObj
          .toLocaleDateString('es-CL', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
          })
          .replaceAll('-', '/')
      : m.fecha || fechaDeHoy()

  return {
    id: m.id ?? m.idMovimiento,
    codigo: m.codigoProducto ?? m.codigo,
    cantidad: Number(m.cantidad ?? 0),
    nota: m.observacion ?? m.nota ?? '',
    fecha: fechaFormateada,
    estado:
      String(m.estadoMovimiento || m.estado || '').toUpperCase() === 'COMPLETADO' ||
      m.estado === 'Recibida'
        ? 'Recibida'
        : 'Pendiente',
  }
}

export async function ListarSolicitudesStock() {
  const respuesta = await realizarPeticion(Rutas.movimientosInventario, {
    method: 'GET',
    headers: obtenerHeadersAuth(false),
  })

  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok || !Array.isArray(datos)) {
    throw new Error(
      obtenerMensaje(
        datos?.mensaje || datos?.message,
        'No pudimos cargar las solicitudes de reposición en este momento.',
      ),
    )
  }

  return datos.map(normalizarMovimiento)
}

export async function CrearSolicitudStock({ codigo, cantidad, nota }) {
  const respuesta = await realizarPeticion(Rutas.movimientosInventario, {
    method: 'POST',
    headers: obtenerHeadersAuth(true),
    body: JSON.stringify({
      codigoProducto: codigo,
      tipoMovimiento: 'SOLICITUD_REPOSICION',
      cantidad: Number(cantidad),
      observacion: nota || '',
    }),
  })

  const datos = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) {
    throw new Error(
      obtenerMensaje(
        datos.mensaje || datos.message,
        'No pudimos enviar la solicitud de stock en este momento. Inténtalo nuevamente.',
      ),
    )
  }

  return normalizarMovimiento(datos)
}

export async function ConfirmarRecepcionStock(idMovimiento) {
  const respuesta = await realizarPeticion(
    Rutas.confirmarMovimientoInventario(idMovimiento),
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
        'No pudimos registrar la recepción de stock en este momento.',
      ),
    )
  }

  return normalizarMovimiento(datos)
}

export async function ListarRepartidores() {
  const respuesta = await realizarPeticion(Rutas.repartidores, {
    method: 'GET',
    headers: obtenerHeadersAuth(false),
  })

  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok || !Array.isArray(datos)) {
    throw new Error(
      obtenerMensaje(
        datos?.mensaje || datos?.message,
        'No pudimos cargar la lista de repartidores en este momento.',
      ),
    )
  }

  return datos.map((u) => {
    const nombreCompleto =
      `${u.nombre || ''} ${u.apellido || ''}`.trim() ||
      u.nombreUsuario ||
      'Repartidor'
    const partes = nombreCompleto.split(' ')
    const iniciales = partes
      .map((p) => p[0] || '')
      .join('')
      .slice(0, 2)
      .toUpperCase()
    return {
      nombre: nombreCompleto,
      ruta: u.direccion
        ? u.direccion.split(' ').slice(0, 2).join(' ')
        : 'Ruta Asignada',
      iniciales: iniciales || 'RP',
    }
  })
}
