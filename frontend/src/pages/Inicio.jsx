import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BloqueEsqueleto,
  useEsperaEsqueleto,
} from '../components/ui/Esqueleto.jsx'

const bannerDespacho =
  'https://res.cloudinary.com/hsr9lgyw/image/upload/banner-despacho.jpg'

export function Inicio() {
  const navigate = useNavigate()
  const [cargandoBanner, setCargandoBanner] = useState(true)
  const esperandoEsqueleto = useEsperaEsqueleto()
  const mostrarEsqueleto = cargandoBanner || esperandoEsqueleto

  return (
    <div className="flex w-full flex-1 flex-col bg-[#0A2540]">
      <button
        type="button"
        className="relative block w-full cursor-pointer border-0 bg-transparent p-0 leading-none"
        onClick={() => navigate('/productos')}
        aria-label="Haz tu pedido online"
      >
        {mostrarEsqueleto && (
          <div className="flex aspect-video max-h-[calc(100vh-64px)] w-full flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
            <BloqueEsqueleto
              variante="oscuro"
              className="h-full w-full rounded-xl lg:rounded-2xl"
            />
          </div>
        )}
        <img
          src={bannerDespacho}
          alt="El Volcán: despacho a domicilio de cilindros de gas, reguladores y mangueras"
          onLoad={() => setCargandoBanner(false)}
          onError={() => setCargandoBanner(false)}
          className={`h-auto w-full object-contain transition-opacity duration-300 ${
            mostrarEsqueleto ? 'hidden' : 'block'
          }`}
        />
      </button>
    </div>
  )
}

export const Home = Inicio
export default Inicio
