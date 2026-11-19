import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { SesionProvider } from './context/Sesion.jsx'
import { CarritoProvider } from './context/Carrito.jsx'
import { Layout } from './components/layouts/Layout.jsx'
import { RutaPublica, RutaPrivada } from './components/layouts/Rutas.jsx'

import { Inicio } from './pages/Inicio.jsx'
import { Productos } from './pages/Productos.jsx'
import { CreacionPedido } from './pages/CreacionPedido.jsx'
import { Pago } from './pages/Pago.jsx'
import { PedidoCreado } from './pages/PedidoCreado.jsx'
import { IniciarSesion } from './pages/IniciarSesion.jsx'
import { Registro } from './pages/Registro.jsx'
import { RecuperarContrasena } from './pages/RecuperarContrasena.jsx'
import { Administradora } from './pages/Administradora.jsx'
import { AdminProductosLista } from './pages/AdminProductosLista.jsx'
import { AdminProductoFormulario } from './pages/AdminProductoFormulario.jsx'
import { Repartidor } from './pages/Repartidor.jsx'
import { SeguimientoPedido } from './pages/SeguimientoPedido.jsx'

export function App() {
  return (
    <SesionProvider>
      <CarritoProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              {/* Rutas públicas de tienda y pago */}
              <Route path="/" element={<Inicio />} />
              <Route path="/productos" element={<Productos />} />
              <Route path="/creacion-pedido" element={<CreacionPedido />} />
              <Route path="/pedido" element={<CreacionPedido />} />
              <Route path="/pago" element={<Pago />} />
              <Route path="/pedido-creado" element={<PedidoCreado />} />

              {/* Rutas interactivas de despacho y seguimiento con mapa en tiempo real */}
              <Route path="/repartidor" element={<Repartidor />} />
              <Route path="/seguimiento" element={<SeguimientoPedido />} />
              <Route path="/seguimiento/:id" element={<SeguimientoPedido />} />

              {/* Rutas de autenticación (redirigen si ya hay sesión activa) */}
              <Route element={<RutaPublica />}>
                <Route path="/login" element={<IniciarSesion />} />
                <Route path="/register" element={<Registro />} />
                <Route
                  path="/recuperar-contrasena"
                  element={<RecuperarContrasena />}
                />
                <Route
                  path="/recuperar-contraseña"
                  element={<RecuperarContrasena />}
                />
              </Route>

              {/* Rutas protegidas del flujo de Administración (JWT + Rol Admin) */}
              <Route element={<RutaPrivada roles={['admin']} />}>
                <Route path="/administradora" element={<Administradora />} />
                <Route
                  path="/administradora/productos"
                  element={<AdminProductosLista />}
                />
                <Route
                  path="/administradora/productos/nuevo"
                  element={<AdminProductoFormulario />}
                />
                <Route
                  path="/administradora/productos/:id/editar"
                  element={<AdminProductoFormulario />}
                />
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CarritoProvider>
    </SesionProvider>
  )
}

export default App
