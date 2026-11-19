import { Outlet, useLocation } from 'react-router-dom'
import { Navbar } from './Navbar'
import { Footer } from './Footer'

export const Layout = () => {
  const { pathname } = useLocation()

  // En la pasarela de Webpay Plus (/pago) se muestra la interfaz externa oficial de Transbank
  if (pathname === '/pago') {
    return <Outlet />
  }

  const esRutaAdmin = pathname.startsWith('/administradora')
  const esRutaRepartidor = pathname === '/repartidor'
  const esRutaMapa =
    pathname === '/repartidor' || pathname.startsWith('/seguimiento')

  return (
    <div
      className={`flex flex-col bg-[#F7F9FC] ${
        esRutaRepartidor ? 'h-screen overflow-hidden' : 'min-h-screen'
      }`}
    >
      {/* En móvil, en la vista del repartidor se prioriza el mapa a pantalla completa y se utiliza el menú hamburguesa interno */}
      <div className={esRutaRepartidor ? 'hidden lg:block shrink-0' : ''}>
        <Navbar />
      </div>
      <main
        className={
          esRutaRepartidor
            ? 'flex flex-1 min-h-0 flex-col p-0 m-0 w-full h-full overflow-hidden'
            : esRutaAdmin
            ? 'mx-auto w-full max-w-[1120px] flex-1 px-4 py-6 sm:px-6'
            : 'flex flex-1 flex-col'
        }
      >
        <Outlet />
      </main>
      {/* El footer se oculta completamente en todas las vistas de mapas (repartidor y seguimiento) */}
      {!esRutaMapa && <Footer />}
    </div>
  )
}

export default Layout
