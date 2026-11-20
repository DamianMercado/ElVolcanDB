import { Variables } from '../config/variables'

const CLAVE_SESION = Variables.sesionKey || 'usuario_sesion'

export const GuardarToken = (token) => {
  if (!token) return
  localStorage.setItem(Variables.tokenKey, token)
}

export const LeerToken = () => {
  const token = localStorage.getItem(Variables.tokenKey)
  if (!token || token === 'null' || token === 'undefined') return null
  return token
}

export const BorrarToken = () => {
  localStorage.removeItem(Variables.tokenKey)
}

export const esJwtEstandar = (token) => {
  return typeof token === 'string' && token.split('.').length === 3
}

const decodificarPayloadJwt = (token) => {
  if (!esJwtEstandar(token)) return null
  try {
    const parte = token.split('.')[1]
    if (!parte) return null
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/')
    const padding = base64.length % 4 === 0 ? '' : '='.repeat(4 - (base64.length % 4))
    const json = decodeURIComponent(
      atob(base64 + padding)
        .split('')
        .map((caracter) => `%${caracter.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )
    return JSON.parse(json)
  } catch {
    return null
  }
}

export const esTokenExpirado = (token) => {
  if (!token || !esJwtEstandar(token)) return false
  const payload = decodificarPayloadJwt(token)
  if (!payload) return true
  if (payload.exp && payload.exp * 1000 <= Date.now()) return true
  return false
}

export const UsuarioDesdeToken = (token) => {
  if (!token) return null
  const datos = decodificarPayloadJwt(token)
  if (!datos) return null

  const nombre = datos.nombre || datos.nombreUsuario || datos.nombres
  const perfil = (datos.perfil || datos.rol || '').toLowerCase()
  const correo = datos.correo || datos.email || datos.sub

  if (!nombre || !perfil || !correo) return null
  if (datos.exp && datos.exp * 1000 <= Date.now()) return null

  const partesNombre = String(nombre).trim().split(' ')
  const nombres = datos.nombres || partesNombre[0] || nombre
  const apellidos = datos.apellidos ?? partesNombre.slice(1).join(' ')
  const idRealUsuario = datos.idUsuario ?? datos.id ?? 1

  return {
    id: idRealUsuario,
    idUsuario: idRealUsuario,
    nombre,
    nombres,
    apellidos,
    perfil,
    rol: perfil,
    correo,
    email: correo,
    rut: datos.rut || '',
    telefono: datos.telefono || '',
    direccion: datos.direccion || '',
    depto: datos.depto || '',
    comuna: datos.comuna || '',
  }
}

export function normalizarUsuarioSesion(usuario, decodificadoJwt = null) {
  if (!usuario && !decodificadoJwt) return null
  const base = { ...(decodificadoJwt || {}), ...(usuario || {}) }
  delete base.contraseña
  delete base.password

  // Evitar que AuthResponse.id (ID de sesión) sobrescriba el ID real del usuario
  const idUsuarioReal =
    usuario?.idUsuario ?? decodificadoJwt?.idUsuario ?? decodificadoJwt?.id ?? usuario?.id

  const nombreCompleto = (
    base.nombreUsuario ||
    base.nombre ||
    `${base.nombres || ''} ${base.apellidos || ''}`
  ).trim()
  const partes = nombreCompleto ? nombreCompleto.split(' ') : []

  const nombres = base.nombres || base.nombre || partes[0] || ''
  const apellidos =
    base.apellidos ?? base.apellido ?? (partes.length > 1 ? partes.slice(1).join(' ') : '')
  const rolNormalizado = String(base.rol || base.perfil || 'cliente').toLowerCase()
  const emailFinal = base.email || base.correo || ''

  return {
    ...base,
    id: idUsuarioReal,
    idUsuario: idUsuarioReal,
    idSesion: base.idSesion ?? (usuario?.idUsuario && usuario?.id !== usuario?.idUsuario ? usuario.id : undefined),
    nombre: nombreCompleto || `${nombres} ${apellidos}`.trim(),
    nombres,
    apellidos,
    rol: rolNormalizado,
    perfil: rolNormalizado,
    email: emailFinal,
    correo: emailFinal,
    rut: base.rut || '',
    telefono: base.telefono || '',
    direccion: base.direccion || '',
    depto: base.depto || '',
    comuna: base.comuna || '',
  }
}

export function guardarSesion(usuario) {
  const tokenActual = usuario?.token || LeerToken()
  const decodificado = UsuarioDesdeToken(tokenActual)
  const datosPublicos = normalizarUsuarioSesion(usuario, decodificado)
  if (!datosPublicos) return

  localStorage.setItem(CLAVE_SESION, JSON.stringify(datosPublicos))

  if (usuario?.token) {
    GuardarToken(usuario.token)
  }

  try {
    window.dispatchEvent(new Event('sesion_cambiada'))
  } catch {
    // Entorno sin soporte de window
  }
}

export function obtenerSesion() {
  try {
    const token = LeerToken()
    if (token && esTokenExpirado(token)) {
      localStorage.removeItem(CLAVE_SESION)
      BorrarToken()
      return null
    }
    const raw = localStorage.getItem(CLAVE_SESION)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed) return null
    const decodificado = UsuarioDesdeToken(token)
    return normalizarUsuarioSesion(parsed, decodificado)
  } catch {
    return null
  }
}

export function cerrarSesion() {
  localStorage.removeItem(CLAVE_SESION)
  BorrarToken()
  try {
    window.dispatchEvent(new Event('sesion_cambiada'))
  } catch {
    // Entorno sin soporte de window
  }
}

export function rutaSegunRol(rol) {
  const norm = String(rol || '').toLowerCase()
  if (norm === 'admin' || norm === 'operador') return '/administradora'
  if (norm === 'repartidor') return '/repartidor'
  return '/'
}
