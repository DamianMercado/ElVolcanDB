import { Variables } from '../config/variables'

export const MENSAJE_ERROR_CONEXION =
  'No pudimos comunicarnos con el sistema en este momento. Por favor, inténtalo nuevamente en unos minutos.'

export const obtenerMensaje = (
  error,
  mensajePorDefecto = MENSAJE_ERROR_CONEXION,
) => {
  const texto = String(error?.message || error || '').trim()
  if (!texto) return mensajePorDefecto

  const textoMin = texto.toLowerCase()
  if (
    textoMin.includes('failed to fetch') ||
    textoMin.includes('fetch') ||
    textoMin.includes('networkerror') ||
    textoMin.includes('network request failed') ||
    textoMin.includes('load failed') ||
    textoMin.includes('err_connection') ||
    textoMin.includes('unexpected token') ||
    textoMin.includes(' internal server error')
  ) {
    return MENSAJE_ERROR_CONEXION
  }

  return texto
}

const esRutaAuthPublica = (url = '') => {
  return (
    url.includes('/auth/login') ||
    url.includes('/auth/registro') ||
    url.includes('/auth/recuperar-clave')
  )
}

export const realizarPeticion = async (url, opciones = {}) => {
  try {
    const respuesta = await fetch(url, opciones)

    // Si una petición autenticada recibe 401 (token expirado/revocado), limpiar sesión automáticamente
    if (
      respuesta &&
      respuesta.status === 401 &&
      !esRutaAuthPublica(String(url)) &&
      opciones?.headers?.Authorization
    ) {
      try {
        window.dispatchEvent(new CustomEvent('sesion_expirada'))
      } catch {
        // Entorno sin soporte de window
      }
    }

    return respuesta
  } catch {
    throw new Error(MENSAJE_ERROR_CONEXION)
  }
}

export const Rutas = {
  login: `${Variables.apiUrl}/auth/login`,
  registro: `${Variables.apiUrl}/auth/registro`,
  recuperarClave: `${Variables.apiUrl}/auth/recuperar-clave`,
  validarToken: `${Variables.apiUrl}/auth/validar`,
  logout: `${Variables.apiUrl}/auth/logout`,
  productos: `${Variables.apiUrl}/catalogo`,
  producto: (id) => `${Variables.apiUrl}/catalogo/${id}`,
  inventario: `${Variables.apiUrl}/inventario`,
  movimientosInventario: `${Variables.apiUrl}/inventario/movimientos`,
  confirmarMovimientoInventario: (id) =>
    `${Variables.apiUrl}/inventario/movimientos/${id}/confirmar`,
  ventas: `${Variables.apiUrl}/ventas`,
  venta: (id) => `${Variables.apiUrl}/ventas/${id}`,
  ventaPorCodigo: (codigo) =>
    `${Variables.apiUrl}/ventas/codigo/${encodeURIComponent(codigo)}`,
  ventasPorUsuario: (idUsuario) =>
    `${Variables.apiUrl}/ventas/usuario/${idUsuario}`,
  ventasPorRepartidor: (repartidor) =>
    `${Variables.apiUrl}/ventas/repartidor/${encodeURIComponent(repartidor)}`,
  ventaRepartidor: (id, repartidor) =>
    `${Variables.apiUrl}/ventas/${id}/asignar-repartidor?repartidor=${encodeURIComponent(repartidor)}`,
  ventaSeguimiento: (id) => `${Variables.apiUrl}/ventas/${id}/seguimiento`,
  ventaEntregar: (id) => `${Variables.apiUrl}/ventas/${id}/entregar`,
  ventaCancelar: (id) => `${Variables.apiUrl}/ventas/${id}/cancelar`,
  pagos: `${Variables.apiUrl}/pagos`,
  repartidores: `${Variables.apiUrl}/usuarios/rol/REPARTIDOR`,
}
