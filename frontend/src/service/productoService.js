import { Variables } from '../config/variables'
import {
  Rutas,
  realizarPeticion,
  obtenerMensaje,
} from './endpoints'

const obtenerHeadersAuth = (conJson = false) => {
  const token = localStorage.getItem(Variables.tokenKey)
  const headers = {
    Accept: 'application/json',
  }
  if (conJson) {
    headers['Content-Type'] = 'application/json'
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }
  return headers
}

const normalizarProducto = (item, idx = 0) => ({
  id: item.id ?? idx + 1,
  codigo: item.codigo || `PR00${idx + 1}`,
  nombre: item.nombre,
  descripcion: item.descripcion || '',
  categoria: item.categoria || 'Cilindros',
  precio: Number(item.precio ?? 0),
  stock: Number(item.stock ?? 0),
  minimo: Number(item.minimo ?? 20),
  imagen: item.imagen || '',
})

export const ListarProductos = async () => {
  const respuesta = await realizarPeticion(Rutas.productos, {
    method: 'GET',
    headers: obtenerHeadersAuth(false),
  })

  const datos = await respuesta.json().catch(() => null)
  if (!respuesta.ok || !Array.isArray(datos)) {
    throw new Error(
      obtenerMensaje(
        datos?.mensaje || datos?.message,
        'En este momento no pudimos cargar el catálogo de productos. Por favor, actualiza la página en unos instantes.',
      ),
    )
  }

  return datos.map((item, idx) => normalizarProducto(item, idx))
}

export const ObtenerProducto = async (id) => {
  const respuesta = await realizarPeticion(Rutas.producto(id), {
    method: 'GET',
    headers: obtenerHeadersAuth(false),
  })

  const datos = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) {
    const error = new Error(
      obtenerMensaje(
        datos.mensaje || datos.message,
        'No encontramos la información de este producto.',
      ),
    )
    error.errores = datos.errores || {}
    throw error
  }

  return normalizarProducto(datos)
}

export const CrearProducto = async (producto) => {
  if (!producto.nombre || producto.precio <= 0) {
    const error = new Error('Completa todos los campos obligatorios con valores válidos.')
    error.errores = {}
    throw error
  }

  const respuesta = await realizarPeticion(Rutas.productos, {
    method: 'POST',
    headers: obtenerHeadersAuth(true),
    body: JSON.stringify(producto),
  })

  const datos = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) {
    const error = new Error(
      obtenerMensaje(
        datos.mensaje || datos.message,
        'No pudimos guardar el nuevo producto en este momento. Inténtalo nuevamente.',
      ),
    )
    error.errores = datos.errores || {}
    throw error
  }

  return normalizarProducto(datos)
}

export const ActualizarProducto = async (id, producto) => {
  if (!producto.nombre || producto.precio <= 0) {
    const error = new Error('Completa todos los campos obligatorios con valores válidos.')
    error.errores = {}
    throw error
  }

  const respuesta = await realizarPeticion(Rutas.producto(id), {
    method: 'PUT',
    headers: obtenerHeadersAuth(true),
    body: JSON.stringify(producto),
  })

  const datos = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) {
    const error = new Error(
      obtenerMensaje(
        datos.mensaje || datos.message,
        'No pudimos guardar los cambios del producto en este momento. Inténtalo nuevamente.',
      ),
    )
    error.errores = datos.errores || {}
    throw error
  }

  return normalizarProducto(datos)
}

export const EliminarProducto = async (id) => {
  const respuesta = await realizarPeticion(Rutas.producto(id), {
    method: 'DELETE',
    headers: obtenerHeadersAuth(false),
  })

  if (respuesta.status === 204 || respuesta.ok) {
    return null
  }

  const datos = await respuesta.json().catch(() => ({}))
  const error = new Error(
    obtenerMensaje(
      datos.mensaje || datos.message,
      'No pudimos eliminar el producto en este momento. Inténtalo nuevamente.',
    ),
  )
  error.errores = datos.errores || {}
  throw error
}
