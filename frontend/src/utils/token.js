import { Variables } from '../config/variables'

const CLAVE_SESION = 'usuario_sesion'

export const GuardarToken = (token) => {
  if (!token) return
  localStorage.setItem(Variables.tokenKey, token)
}

export const LeerToken = () => localStorage.getItem(Variables.tokenKey)

export const BorrarToken = () => {
  localStorage.removeItem(Variables.tokenKey)
}

export const UsuarioDesdeToken = (token) => {
  if (!token) return null

  try {
    const parte = token.split('.')[1]
    if (!parte) return null
    const base64 = parte.replace(/-/g, '+').replace(/_/g, '/')
    const json = decodeURIComponent(
      atob(base64)
        .split('')
        .map((caracter) => `%${caracter.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join(''),
    )
    const datos = JSON.parse(json)

    const nombre = datos.nombre || datos.nombreUsuario || datos.nombres
    const perfil = (datos.perfil || datos.rol || '').toLowerCase()
    const correo = datos.correo || datos.email || datos.sub

    if (!nombre || !perfil || !correo) return null
    if (datos.exp && datos.exp * 1000 < Date.now()) return null

    const partesNombre = String(nombre).trim().split(' ')
    const nombres = datos.nombres || partesNombre[0] || nombre
    const apellidos = datos.apellidos ?? partesNombre.slice(1).join(' ')

    return {
      id: datos.idUsuario || datos.id || 1,
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
  } catch {
    return null
  }
}

export function guardarSesion(usuario) {
  const datosPublicos = { ...usuario }
  delete datosPublicos.contraseña
  delete datosPublicos.password
  if (datosPublicos.rol) {
    datosPublicos.rol = String(datosPublicos.rol).toLowerCase()
  }
  localStorage.setItem(CLAVE_SESION, JSON.stringify(datosPublicos))

  if (datosPublicos.token) {
    GuardarToken(datosPublicos.token)
  }

  try {
    window.dispatchEvent(new Event('sesion_cambiada'))
  } catch {
    // Entorno sin soporte de window
  }
}

export function obtenerSesion() {
  try {
    return JSON.parse(localStorage.getItem(CLAVE_SESION))
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
  if (String(rol || '').toLowerCase() === 'admin') return '/administradora'
  return '/'
}
