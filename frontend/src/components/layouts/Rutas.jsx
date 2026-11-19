import { Navigate, Outlet } from 'react-router-dom'
import { useSesion } from '../../context/Sesion'
import { rutaSegunRol } from '../../utils/token'

export const RutaPublica = ({ children }) => {
  const { activa, usuario } = useSesion()
  if (activa) {
    return <Navigate to={rutaSegunRol(usuario?.rol || usuario?.perfil)} replace />
  }
  return children || <Outlet />
}

export const RutaPrivada = ({ roles = [], children }) => {
  const { activa, usuario } = useSesion()
  if (!activa || !usuario) {
    return <Navigate to="/login" replace />
  }

  if (roles.length > 0) {
    const rolUsuario = String(usuario.rol || usuario.perfil || '').toLowerCase()
    const rolesPermitidos = roles.map((r) => String(r).toLowerCase())
    if (!rolesPermitidos.includes(rolUsuario)) {
      return <Navigate to="/" replace />
    }
  }

  return children || <Outlet />
}

export const RutaProtegida = RutaPrivada
