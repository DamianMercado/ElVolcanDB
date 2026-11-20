import { useState, useEffect } from 'react'
import { ListarProductos } from '../service/productoService.js'
import { useCarrito } from '../context/Carrito.jsx'
import { TarjetaProducto } from '../components/productos/TarjetaProducto.jsx'
import { FiltroCategorias } from '../components/productos/FiltroCategorias.jsx'
import { BannerAlerta } from '../components/ui/BannerAlerta.jsx'
import {
  EsqueletoCatalogoProductos,
  esperarEsqueleto,
} from '../components/ui/Esqueleto.jsx'

export function Productos() {
  const { agregarAlCarrito } = useCarrito()
  const [listaProductos, setListaProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [categoriaActiva, setCategoriaActiva] = useState('todos')
  const [avisoError, setAvisoError] = useState('')

  useEffect(() => {
    let montado = true
    Promise.all([ListarProductos(), esperarEsqueleto()])
      .then(([datos]) => {
        if (montado && Array.isArray(datos)) {
          setListaProductos(datos)
          setAvisoError('')
        }
      })
      .catch(async (err) => {
        await esperarEsqueleto()
        if (montado) {
          setAvisoError(
            err?.message ||
              'En este momento no pudimos mostrar los productos disponibles. Por favor, intenta nuevamente en unos minutos.'
          )
        }
      })
      .finally(() => {
        if (montado) {
          setCargando(false)
        }
      })
    return () => {
      montado = false
    }
  }, [])

  const productosFiltrados =
    categoriaActiva === 'todos'
      ? listaProductos
      : listaProductos.filter(
          (p) =>
            String(p.categoria || '').toLowerCase() ===
            categoriaActiva.toLowerCase()
        )

  return (
    <main className="min-h-[calc(100vh-140px)] bg-gradient-to-b from-[#0A2540] to-[#113a63] px-5 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
            Nuestros Productos
          </h2>
          <p className="mt-2 text-base text-white/75">
            Selecciona los cilindros y accesorios que necesitas
          </p>
        </div>

        <FiltroCategorias
          categoriaActiva={categoriaActiva}
          alCambiarCategoria={setCategoriaActiva}
        />

        <BannerAlerta
          mensaje={avisoError}
          tipo="error"
          className="mx-auto mb-6 max-w-2xl"
        />

        {cargando ? (
          <EsqueletoCatalogoProductos cantidad={12} />
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {productosFiltrados.map((prod) => (
              <TarjetaProducto
                key={prod.codigo || prod.id}
                producto={prod}
                alAgregar={agregarAlCarrito}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  )
}

export default Productos
