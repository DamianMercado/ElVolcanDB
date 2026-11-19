import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { IniciarSesion as IniciarSesionServicio } from '../service/sesionService.js'
import { guardarSesion, rutaSegunRol } from '../utils/token.js'
import { useSesion } from '../context/Sesion.jsx'
import { Campo } from '../components/ui/Campo.jsx'
import { BannerAlerta } from '../components/ui/BannerAlerta.jsx'
import {
  EsqueletoFormularioAutenticacion,
  EsqueletoProceso,
  useEsperaEsqueleto,
} from '../components/ui/Esqueleto.jsx'

export function IniciarSesion() {
  const navigate = useNavigate()
  const { iniciar } = useSesion()

  const [email, setEmail] = useState(
    () => localStorage.getItem('recordar_email') || ''
  )
  const [password, setPassword] = useState('')
  const [recordar, setRecordar] = useState(() =>
    Boolean(localStorage.getItem('recordar_email'))
  )
  const [alerta, setAlerta] = useState({ mensaje: '', tipo: '' })
  const [cargando, setCargando] = useState(false)
  const cargandoVista = useEsperaEsqueleto()

  function mostrarAlerta(mensaje, tipo = 'error') {
    setAlerta({ mensaje, tipo })
  }

  function limpiarAlerta() {
    setAlerta({ mensaje: '', tipo: '' })
  }

  async function verificarInicioSesion(event) {
    event.preventDefault()
    limpiarAlerta()
    setCargando(true)

    try {
      const respuesta = await IniciarSesionServicio({
        correo: email,
        clave: password,
      })

      if (recordar) {
        localStorage.setItem('recordar_email', email)
      } else {
        localStorage.removeItem('recordar_email')
      }

      const usrFinal = respuesta.usuario
      if (respuesta.token) {
        iniciar(respuesta.token, usrFinal)
      } else if (usrFinal) {
        guardarSesion(usrFinal)
      }

      const nombreBienvenida =
        usrFinal?.nombreUsuario ||
        usrFinal?.nombres ||
        usrFinal?.nombre ||
        'Cliente'
      mostrarAlerta(`¡Bienvenido, ${nombreBienvenida}!`, 'exito')

      setTimeout(() => {
        navigate(rutaSegunRol(usrFinal?.rol || usrFinal?.perfil))
      }, 900)
    } catch (err) {
      mostrarAlerta(
        err?.message || 'Correo o contraseña incorrectos',
        'error'
      )
    } finally {
      setCargando(false)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-gradient-to-b from-[#0A2540] to-[#113a63] px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#0A2540]/90 p-7 shadow-2xl backdrop-blur-md md:p-8">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-extrabold text-white md:text-3xl">
            Iniciar Sesión
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Accede a tu cuenta de El Volcán
          </p>
        </div>

        {cargandoVista ? (
          <EsqueletoFormularioAutenticacion filas={2} />
        ) : (
          <form
            onSubmit={verificarInicioSesion}
            className="flex flex-col gap-4"
          >
            <BannerAlerta mensaje={alerta.mensaje} tipo={alerta.tipo} />

            <Campo
              id="email"
              name="email"
              type="email"
              etiqueta="Correo Electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@correo.com"
              variante="oscuro"
              required
            />

            <Campo
              id="password"
              name="password"
              type="password"
              etiqueta="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Contraseña"
              variante="oscuro"
              required
            />

            <div className="flex items-center justify-between text-xs text-white/85">
              <label className="flex cursor-pointer items-center gap-2">
                <input
                  type="checkbox"
                  checked={recordar}
                  onChange={(e) => setRecordar(e.target.checked)}
                  className="h-4 w-4 rounded border-white/30 accent-[#00A8E8]"
                />
                <span>Recordarme</span>
              </label>
              <Link
                to="/recuperar-contrasena"
                className="font-semibold text-[#00A8E8] no-underline hover:underline"
              >
                ¿Olvidaste tu contraseña?
              </Link>
            </div>

            {cargando && (
              <EsqueletoProceso
                etiqueta="Verificando credenciales de acceso..."
                variante="oscuro"
              />
            )}

            <button
              type="submit"
              disabled={cargando}
              className="mt-2 w-full cursor-pointer rounded-xl bg-[#FF4500] py-3 text-sm font-bold text-white shadow-lg transition hover:bg-[#e03d00] disabled:opacity-60"
            >
              {cargando ? 'Ingresando...' : 'Iniciar Sesión'}
            </button>

            <div className="mt-2 border-t border-white/10 pt-4 text-center text-xs text-white/75">
              ¿Aún no tienes cuenta?{' '}
              <Link
                to="/register"
                className="font-semibold text-[#00A8E8] no-underline hover:underline"
              >
                Regístrate aquí
              </Link>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}

export const Login = IniciarSesion
export default IniciarSesion
