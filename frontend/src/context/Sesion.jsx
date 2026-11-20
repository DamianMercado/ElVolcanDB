/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  BorrarToken,
  GuardarToken,
  LeerToken,
  UsuarioDesdeToken,
  esJwtEstandar,
  esTokenExpirado,
  normalizarUsuarioSesion,
  obtenerSesion,
  guardarSesion,
  cerrarSesion as cerrarSesionStorage,
  rutaSegunRol,
} from '../utils/token'
import {
  CerrarSesionServicio,
  ValidarSesionServicio,
} from '../service/sesionService'

const SesionContext = createContext(null)

const ES_ENTORNO_PRUEBA =
  typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'test'

const resolverEstadoInicial = () => {
  const tokenGuardado = LeerToken()

  if (tokenGuardado && esTokenExpirado(tokenGuardado)) {
    cerrarSesionStorage()
    return { token: null, usuario: null }
  }

  const usuarioDesdeJwt = UsuarioDesdeToken(tokenGuardado)
  const sesionGuardada = obtenerSesion()

  if (sesionGuardada) {
    return {
      token: tokenGuardado,
      usuario: normalizarUsuarioSesion(sesionGuardada, usuarioDesdeJwt),
    }
  }

  if (usuarioDesdeJwt) {
    return { token: tokenGuardado, usuario: usuarioDesdeJwt }
  }

  return { token: null, usuario: null }
}

export const SesionProvider = ({ children }) => {
  const [{ token, usuario }, setEstadoSesion] = useState(resolverEstadoInicial)

  const limpiarEstadoLocal = useCallback(() => {
    BorrarToken()
    cerrarSesionStorage()
    setEstadoSesion({ token: null, usuario: null })
  }, [])

  // Sincronización entre pestañas y expiración por 401
  useEffect(() => {
    const sincronizar = () => {
      setEstadoSesion(resolverEstadoInicial())
    }

    const manejarExpiracion = () => {
      limpiarEstadoLocal()
    }

    window.addEventListener('sesion_cambiada', sincronizar)
    window.addEventListener('storage', sincronizar)
    window.addEventListener('sesion_expirada', manejarExpiracion)
    return () => {
      window.removeEventListener('sesion_cambiada', sincronizar)
      window.removeEventListener('storage', sincronizar)
      window.removeEventListener('sesion_expirada', manejarExpiracion)
    }
  }, [limpiarEstadoLocal])

  // Validar token real JWT contra ms-auth al montar la app (evita sesiones revocadas)
  useEffect(() => {
    if (ES_ENTORNO_PRUEBA || !token || !esJwtEstandar(token)) return
    let cancelado = false

    ValidarSesionServicio(token).then((res) => {
      if (!cancelado && res && res.valido === false) {
        limpiarEstadoLocal()
      }
    })

    return () => {
      cancelado = true
    }
  }, [token, limpiarEstadoLocal])

  const iniciar = useCallback((nuevoToken, datosUsuarioOpcional = null) => {
    if (nuevoToken) {
      GuardarToken(nuevoToken)
    }
    const decodificado = UsuarioDesdeToken(nuevoToken)
    const usuarioFinal = normalizarUsuarioSesion(datosUsuarioOpcional, decodificado)

    if (usuarioFinal) {
      guardarSesion({ ...usuarioFinal, token: nuevoToken })
    }
    setEstadoSesion({ token: nuevoToken, usuario: usuarioFinal })
  }, [])

  const cerrar = useCallback(() => {
    const tokenActual = token || LeerToken()
    limpiarEstadoLocal()
    if (tokenActual && !ES_ENTORNO_PRUEBA) {
      CerrarSesionServicio(tokenActual)
    }
  }, [token, limpiarEstadoLocal])

  const rolNormalizado = (usuario?.rol || usuario?.perfil || '').toLowerCase()
  const esAdmin = rolNormalizado === 'admin'
  const esRepartidor = rolNormalizado === 'repartidor'

  return (
    <SesionContext.Provider
      value={{
        token,
        usuario,
        activa: Boolean(usuario),
        esAdmin,
        esRepartidor,
        iniciar,
        cerrar,
      }}
    >
      {children}
    </SesionContext.Provider>
  )
}

export const useSesion = () => {
  const ctx = useContext(SesionContext)
  if (!ctx) {
    const usuarioActual = obtenerSesion()
    const rol = (usuarioActual?.rol || usuarioActual?.perfil || '').toLowerCase()
    return {
      token: LeerToken(),
      usuario: usuarioActual,
      activa: Boolean(usuarioActual),
      esAdmin: rol === 'admin',
      esRepartidor: rol === 'repartidor',
      iniciar: (nuevoToken, usr) => {
        GuardarToken(nuevoToken)
        const dec = UsuarioDesdeToken(nuevoToken)
        const finalUsr = normalizarUsuarioSesion(usr, dec)
        if (finalUsr) guardarSesion({ ...finalUsr, token: nuevoToken })
      },
      cerrar: () => {
        const tokenActual = LeerToken()
        BorrarToken()
        cerrarSesionStorage()
        if (tokenActual && !ES_ENTORNO_PRUEBA) {
          CerrarSesionServicio(tokenActual)
        }
      },
    }
  }
  return ctx
}

export { obtenerSesion, guardarSesion, cerrarSesionStorage as cerrarSesion, rutaSegunRol }
