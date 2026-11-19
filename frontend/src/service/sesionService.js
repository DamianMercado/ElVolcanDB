import {
  Rutas,
  realizarPeticion,
  obtenerMensaje,
} from './endpoints'

export const IniciarSesion = async ({ correo, email, clave, password }) => {
  const emailFinal = (correo || email || '').trim()
  const passwordFinal = clave || password || ''

  const respuesta = await realizarPeticion(Rutas.login, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: emailFinal,
      password: passwordFinal,
      correo: emailFinal,
      clave: passwordFinal,
    }),
  })

  const datos = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) {
    throw new Error(
      obtenerMensaje(
        datos.mensaje || datos.message,
        'Correo electrónico o contraseña incorrectos.',
      ),
    )
  }

  return {
    token: datos.token,
    usuario: datos,
  }
}

export const RegistrarCuenta = async (datosRegistro) => {
  try {
    const respuesta = await realizarPeticion(Rutas.registro, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        nombre: datosRegistro.nombres,
        apellido: datosRegistro.apellidos,
        rut: datosRegistro.rut,
        telefono: datosRegistro.telefono,
        direccion: datosRegistro.direccion,
        comuna: datosRegistro.comuna,
        email: datosRegistro.email,
        password: datosRegistro.contraseña || datosRegistro.password,
        rol: (datosRegistro.rol || 'CLIENTE').toUpperCase(),
      }),
    })

    const datos = await respuesta.json().catch(() => ({}))
    if (!respuesta.ok) {
      return {
        exito: false,
        mensaje: obtenerMensaje(
          datos.mensaje || datos.message,
          'No pudimos crear tu cuenta en este momento. Por favor, verifica tus datos e inténtalo nuevamente.',
        ),
      }
    }

    return {
      exito: true,
      usuario: datos,
      token: datos.token,
    }
  } catch (err) {
    return {
      exito: false,
      mensaje: obtenerMensaje(
        err,
        'No pudimos comunicarnos con el sistema para crear tu cuenta. Inténtalo nuevamente en unos minutos.',
      ),
    }
  }
}

export const RecuperarClaveServicio = async ({ email, nuevaPassword }) => {
  const emailLimpio = (email || '').trim().toLowerCase()

  const respuesta = await realizarPeticion(Rutas.recuperarClave, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: emailLimpio,
      password: nuevaPassword,
    }),
  })

  const datos = await respuesta.json().catch(() => ({}))
  if (!respuesta.ok) {
    throw new Error(
      obtenerMensaje(
        datos.mensaje || datos.message,
        'No encontramos una cuenta asociada a ese correo electrónico.',
      ),
    )
  }

  return {
    exito: true,
    mensaje: 'Contraseña restablecida exitosamente.',
  }
}
