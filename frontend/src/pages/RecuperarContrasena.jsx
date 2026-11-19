import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFormulario } from '../hooks/useFormulario.js'
import { RecuperarClaveServicio } from '../service/sesionService.js'
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
  email: '',
  nuevaPassword: '',
  confirmarPassword: '',
}

export function RecuperarContrasena() {
  const navigate = useNavigate()
  const { valores, cambiar, reiniciar } = useFormulario(VALORES_INICIALES)
  const [alerta, setAlerta] = useState({ mensaje: '', tipo: '' })
  const [procesando, setProcesando] = useState(false)
  const cargandoVista = useEsperaEsqueleto()

  const enviarFormulario = async (e) => {
    e.preventDefault()
    setAlerta({ mensaje: '', tipo: '' })

    const emailTrim = valores.email.trim()
    if (!PATRON_CORREO.test(emailTrim)) {
      setAlerta({
        mensaje: 'Por favor, ingresa un correo electrónico válido.',
        tipo: 'error',
      })
      return
    }

    if (valores.nuevaPassword.length < LONGITUD_MINIMA_CLAVE) {
      setAlerta({
        mensaje: `La nueva contraseña debe tener al menos ${LONGITUD_MINIMA_CLAVE} caracteres.`,
        tipo: 'error',
      })
      return
    }

    if (valores.nuevaPassword !== valores.confirmarPassword) {
      setAlerta({
        mensaje: 'Las contraseñas ingresadas no coinciden.',
        tipo: 'error',
      })
      return
    }

    setProcesando(true)
    try {
      const resultado = await RecuperarClaveServicio({
        email: emailTrim,
        nuevaPassword: valores.nuevaPassword,
      })

      setAlerta({
        mensaje:
          resultado?.mensaje ||
          '¡Contraseña restablecida con éxito! Redirigiendo al inicio de sesión...',
        tipo: 'exito',
      })
      reiniciar(VALORES_INICIALES)

      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (err) {
      setAlerta({
        mensaje:
          err?.message ||
          'No se encontró una cuenta asociada a ese correo electrónico.',
        tipo: 'error',
      })
    } finally {
      setProcesando(false)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-gradient-to-b from-[#0A2540] to-[#113a63] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0A2540]/90 p-7 shadow-2xl backdrop-blur-md md:p-8">
        <div className="mb-6 text-center">
          <span className="mb-2 inline-block rounded-full border border-[#00A8E8]/40 bg-[#00A8E8]/15 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-[#00A8E8]">
            Seguridad de Cuenta
          </span>
          <h1 className="text-2xl font-extrabold text-white md:text-3xl">
            Recuperar Contraseña
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Ingresa tu correo registrado y define una nueva contraseña de acceso
          </p>
        </div>

        {cargandoVista ? (
          <EsqueletoFormularioAutenticacion filas={3} />
        ) : (
          <form onSubmit={enviarFormulario} className="flex flex-col gap-4">
            <BannerAlerta mensaje={alerta.mensaje} tipo={alerta.tipo} />

            <Campo
              id="recuperar-email"
              name="email"
              type="email"
              etiqueta="Correo Electrónico Registrado"
              value={valores.email}
              onChange={cambiar}
              placeholder="tu@correo.com"
              variante="oscuro"
              required
            />

            <Campo
              id="recuperar-nueva-clave"
              name="nuevaPassword"
              type="password"
              etiqueta="Nueva Contraseña"
              value={valores.nuevaPassword}
              onChange={cambiar}
              placeholder="Mínimo 6 caracteres"
              variante="oscuro"
              required
            />

            <Campo
              id="recuperar-confirmar-clave"
              name="confirmarPassword"
              type="password"
              etiqueta="Confirmar Nueva Contraseña"
              value={valores.confirmarPassword}
              onChange={cambiar}
              placeholder="Repite tu nueva contraseña"
              variante="oscuro"
              required
            />

            {procesando && (
              <EsqueletoProceso
                etiqueta="Actualizando contraseña de acceso..."
                variante="oscuro"
              />
            )}

            <button
              type="submit"
              disabled={procesando}
              className="mt-2 w-full cursor-pointer rounded-xl bg-[#FF4500] py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#e03d00] disabled:opacity-60"
            >
              {procesando
                ? 'Actualizando contraseña...'
                : 'Restablecer Contraseña'}
            </button>

            <div className="mt-2 border-t border-white/10 pt-4 text-center text-xs text-white/75">
              ¿Recordaste tu contraseña?{' '}
              <Link
                to="/login"
                className="font-semibold text-[#00A8E8] no-underline hover:underline"
              >
                Volver a Iniciar Sesión
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}

export default RecuperarContrasena
