import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useFormulario } from '../hooks/useFormulario.js'
import { RegistrarCuenta } from '../service/sesionService.js'
import { useSesion } from '../context/Sesion.jsx'
import { rutaSegunRol } from '../utils/token.js'
import { Campo } from '../components/ui/Campo.jsx'
import { BannerAlerta } from '../components/ui/BannerAlerta.jsx'
import {
  EsqueletoFormularioAutenticacion,
  EsqueletoProceso,
  useEsperaEsqueleto,
} from '../components/ui/Esqueleto.jsx'

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const LONGITUD_MINIMA_CLAVE = 6

const VALORES_INICIALES = {
  nombre: '',
  apellido: '',
  rut: '',
  telefono: '',
  direccion: '',
  depto: '',
  comuna: '',
  email: '',
  password: '',
  confirmarPassword: '',
}

export function Registro() {
  const navigate = useNavigate()
  const { iniciar } = useSesion()
  const { valores, cambiar, reiniciar } = useFormulario(VALORES_INICIALES)
  const [alerta, setAlerta] = useState({ mensaje: '', tipo: '' })
  const [cargando, setCargando] = useState(false)
  const cargandoVista = useEsperaEsqueleto()

  const mostrarAlerta = (mensaje, tipo = 'error') => {
    setAlerta({ mensaje, tipo })
  }

  const limpiarAlerta = () => {
    setAlerta({ mensaje: '', tipo: '' })
  }

  const enviarFormulario = async (e) => {
    e.preventDefault()
    limpiarAlerta()

    const nombreTrim = valores.nombre.trim()
    const apellidoTrim = valores.apellido.trim()
    const rutTrim = valores.rut.trim()
    const telefonoTrim = valores.telefono.trim()
    const direccionTrim = valores.direccion.trim()
    const comunaTrim = valores.comuna.trim()
    const emailTrim = valores.email.trim()

    if (
      !nombreTrim ||
      !apellidoTrim ||
      !rutTrim ||
      !telefonoTrim ||
      !direccionTrim ||
      !comunaTrim ||
      !emailTrim ||
      !valores.password ||
      !valores.confirmarPassword
    ) {
      mostrarAlerta('Por favor, completa todos los campos obligatorios.')
      return
    }

    if (!PATRON_CORREO.test(emailTrim)) {
      mostrarAlerta('Por favor, ingresa un correo electrónico válido.')
      return
    }

    if (valores.password.length < LONGITUD_MINIMA_CLAVE) {
      mostrarAlerta(
        `La contraseña debe tener al menos ${LONGITUD_MINIMA_CLAVE} caracteres.`
      )
      return
    }

    if (valores.password !== valores.confirmarPassword) {
      mostrarAlerta('Las contraseñas no coinciden.')
      return
    }

    setCargando(true)

    try {
      const resultado = await RegistrarCuenta({
        nombres: nombreTrim,
        apellidos: apellidoTrim,
        rut: rutTrim,
        telefono: telefonoTrim,
        direccion: direccionTrim,
        depto: valores.depto.trim(),
        comuna: comunaTrim,
        email: emailTrim,
        contraseña: valores.password,
        rol: 'cliente',
      })

      if (!resultado.exito) {
        setCargando(false)
        mostrarAlerta(resultado.mensaje, 'error')
        return
      }

      mostrarAlerta('¡Cuenta creada con éxito! Iniciando tu sesión...', 'exito')
      reiniciar(VALORES_INICIALES)

      if (resultado.token && resultado.usuario) {
        iniciar(resultado.token, resultado.usuario)
        navigate(rutaSegunRol(resultado.usuario.rol), { replace: true })
      } else {
        navigate('/login', { replace: true })
      }
    } catch (err) {
      setCargando(false)
      mostrarAlerta(
        err?.message || 'No se pudo completar el registro.',
        'error'
      )
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-gradient-to-b from-[#0A2540] to-[#113a63] px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-white/15 bg-[#0A2540]/90 p-7 shadow-2xl backdrop-blur-md md:p-9">
        <div className="mb-6 border-b border-white/15 pb-4 text-center">
          <h1 className="text-2xl font-extrabold text-white md:text-3xl">
            Crear Cuenta
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Únete a El Volcán y pide tu gas más rápido
          </p>
        </div>

        {cargandoVista ? (
          <EsqueletoFormularioAutenticacion filas={6} />
        ) : (
          <form onSubmit={enviarFormulario} className="flex flex-col gap-4">
          <BannerAlerta mensaje={alerta.mensaje} tipo={alerta.tipo} />

          {/* Sección 1: Datos Personales */}
          <h2 className="mt-1 text-sm font-bold uppercase tracking-wider text-[#00A8E8]">
            1. Datos Personales
          </h2>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Campo
              id="nombre"
              name="nombre"
              etiqueta="Nombre"
              value={valores.nombre}
              onChange={cambiar}
              placeholder="Tu Nombre"
              variante="oscuro"
              required
            />
            <Campo
              id="apellido"
              name="apellido"
              etiqueta="Apellido"
              value={valores.apellido}
              onChange={cambiar}
              placeholder="Tu Apellido"
              variante="oscuro"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Campo
              id="rut"
              name="rut"
              etiqueta="RUT"
              value={valores.rut}
              onChange={cambiar}
              placeholder="12.345.678-9"
              variante="oscuro"
              required
            />
            <Campo
              id="telefono"
              name="telefono"
              type="tel"
              etiqueta="Teléfono de Contacto"
              value={valores.telefono}
              onChange={cambiar}
              placeholder="+56 9 1234 5678"
              variante="oscuro"
              required
            />
          </div>

          {/* Sección 2: Dirección de Despacho */}
          <h2 className="mt-2 text-sm font-bold uppercase tracking-wider text-[#00A8E8]">
            2. Dirección de Entrega (Gas a Domicilio)
          </h2>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <Campo
                id="direccion"
                name="direccion"
                etiqueta="Calle y Número"
                value={valores.direccion}
                onChange={cambiar}
                placeholder="Av. Principal 1234"
                variante="oscuro"
                required
              />
            </div>
            <Campo
              id="depto"
              name="depto"
              etiqueta="Depto / Block (Opcional)"
              value={valores.depto}
              onChange={cambiar}
              placeholder="Depto 302"
              variante="oscuro"
            />
          </div>

          <Campo
            id="comuna"
            name="comuna"
            etiqueta="Comuna / Ciudad"
            value={valores.comuna}
            onChange={cambiar}
            placeholder="Ej: Puente Alto, La Florida, Santiago..."
            variante="oscuro"
            required
          />

          {/* Sección 3: Seguridad y Acceso */}
          <h2 className="mt-2 text-sm font-bold uppercase tracking-wider text-[#00A8E8]">
            3. Datos de Acceso y Seguridad
          </h2>

          <Campo
            id="email"
            name="email"
            type="email"
            etiqueta="Correo Electrónico"
            value={valores.email}
            onChange={cambiar}
            placeholder="correo@ejemplo.com"
            variante="oscuro"
            required
          />

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Campo
              id="password"
              name="password"
              type="password"
              etiqueta="Contraseña"
              value={valores.password}
              onChange={cambiar}
              placeholder="Mínimo 6 caracteres"
              variante="oscuro"
              required
            />
            <Campo
              id="confirm-password"
              name="confirmarPassword"
              type="password"
              etiqueta="Confirmar Contraseña"
              value={valores.confirmarPassword}
              onChange={cambiar}
              placeholder="Repite tu contraseña"
              variante="oscuro"
              required
            />
          </div>

          {cargando && (
            <EsqueletoProceso
              etiqueta="Creando tu cuenta en El Volcán..."
              variante="oscuro"
            />
          )}

          <button
            type="submit"
            disabled={cargando}
            className="mt-3 w-full cursor-pointer rounded-xl bg-[#FF4500] py-3.5 text-sm font-bold text-white shadow-lg transition hover:bg-[#e03d00] disabled:opacity-60"
          >
            {cargando ? 'Verificando credenciales...' : 'Crear Cuenta'}
          </button>

            <div className="mt-2 border-t border-white/10 pt-4 text-center text-xs text-white/75">
              <span>
                ¿Ya tienes una cuenta?{' '}
                <Link
                  to="/login"
                  className="font-semibold text-[#00A8E8] no-underline hover:underline"
                >
                  Inicia sesión aquí
                </Link>
              </span>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}

export const Register = Registro
export default Registro
