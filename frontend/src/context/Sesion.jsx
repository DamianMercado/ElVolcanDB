/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'
import {
  BorrarToken,
  GuardarToken,
  LeerToken,
  UsuarioDesdeToken,
  obtenerSesion,
  guardarSesion,
  cerrarSesion as cerrarSesionStorage,
  rutaSegunRol,
} from '../utils/token'

const SesionContext = createContext(null)

const resolverEstadoInicial = () => {
  const tokenGuardado = LeerToken()
  const usuarioDesdeJwt = UsuarioDesdeToken(tokenGuardado)
  const sesionGuardada = obtenerSesion()

  if (sesionGuardada) {
    return {
      token: tokenGuardado,
      usuario: { ...(usuarioDesdeJwt || {}), ...sesionGuardada },
    }
  }

  if (usuarioDesdeJwt) {
    return { token: tokenGuardado, usuario: usuarioDesdeJwt }
  }

  return { token: null, usuario: null }
}

export const SesionProvider = ({ children }) => {
  const [{ token, usuario }, setEstadoSesion] = useState(resolverEstadoInicial)

  useEffect(() => {
    const sincronizar = () => {
      const sesionActual = obtenerSesion()
      const tokenActual = LeerToken()
      const usuarioJwt = UsuarioDesdeToken(tokenActual)

      if (sesionActual) {
        setEstadoSesion({
          token: tokenActual,
          usuario: { ...(usuarioJwt || {}), ...sesionActual },
        })
      } else if (usuarioJwt) {
        setEstadoSesion({ token: tokenActual, usuario: usuarioJwt })
      } else {
        setEstadoSesion({ token: null, usuario: null })
      }
    }

    window.addEventListener('sesion_cambiada', sincronizar)
    window.addEventListener('storage', sincronizar)
    return () => {
      window.removeEventListener('sesion_cambiada', sincronizar)
      window.removeEventListener('storage', sincronizar)
    }
  }, [])

  const iniciar = (nuevoToken, datosUsuarioOpcional = null) => {
    GuardarToken(nuevoToken)
    const decodificado = UsuarioDesdeToken(nuevoToken)
    const usuarioFinal = datosUsuarioOpcional
      ? { ...(decodificado || {}), ...datosUsuarioOpcional }
      : decodificado

    if (usuarioFinal) {
      guardarSesion(usuarioFinal)
    }
    setEstadoSesion({ token: nuevoToken, usuario: usuarioFinal })
  }

  const cerrar = () => {
    BorrarToken()
    cerrarSesionStorage()
    setEstadoSesion({ token: null, usuario: null })
  }

  const rolNormalizado = (usuario?.rol || usuario?.perfil || '').toLowerCase()
  const esAdmin = rolNormalizado === 'admin'

  return (
    <SesionContext.Provider
      value={{
        token,
        usuario,
        activa: Boolean(usuario),
        esAdmin,
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
    return {
      token: LeerToken(),
      usuario: usuarioActual,
      activa: Boolean(usuarioActual),
      esAdmin: (usuarioActual?.rol || '').toLowerCase() === 'admin',
      iniciar: (nuevoToken, usr) => {
        GuardarToken(nuevoToken)
        const dec = usr || UsuarioDesdeToken(nuevoToken)
        if (dec) guardarSesion(dec)
      },
      cerrar: () => {
        BorrarToken()
        cerrarSesionStorage()
      },
    }
  }
  return ctx
}

export { obtenerSesion, guardarSesion, cerrarSesionStorage as cerrarSesion, rutaSegunRol }
