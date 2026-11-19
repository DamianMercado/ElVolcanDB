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

export const realizarPeticion = async (url, opciones = {}) => {
  try {
    return await fetch(url, opciones)
  } catch {
    throw new Error(MENSAJE_ERROR_CONEXION)
  }
}

export const Rutas = {
  login: `${Variables.apiUrl}/auth/login`,
  registro: `${Variables.apiUrl}/auth/registro`,
  recuperarClave: `${Variables.apiUrl}/auth/recuperar-clave`,
  logout: `${Variables.apiUrl}/auth/logout`,
  productos: `${Variables.apiUrl}/catalogo`,
  producto: (id) => `${Variables.apiUrl}/catalogo/${id}`,
  inventario: `${Variables.apiUrl}/inventario`,
  movimientosInventario: `${Variables.apiUrl}/inventario/movimientos`,
  confirmarMovimientoInventario: (id) =>
    `${Variables.apiUrl}/inventario/movimientos/${id}/confirmar`,
  ventas: `${Variables.apiUrl}/ventas`,
  venta: (id) => `${Variables.apiUrl}/ventas/${id}`,
  ventaRepartidor: (id, repartidor) =>
    `${Variables.apiUrl}/ventas/${id}/asignar-repartidor?repartidor=${encodeURIComponent(repartidor)}`,
  pagos: `${Variables.apiUrl}/pagos`,
  repartidores: `${Variables.apiUrl}/usuarios/rol/REPARTIDOR`,
}
