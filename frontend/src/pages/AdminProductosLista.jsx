import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  ListarProductos,
  EliminarProducto,
} from '../service/productoService.js'
import { estadoStock, formatearPesos } from '../utils/formato.js'
import { CabeceraAdminNav } from '../components/admin/CabeceraAdminNav.jsx'
import { AdminProductoTabla } from '../components/admin/AdminProductoTabla.jsx'
import { BannerAlerta } from '../components/ui/BannerAlerta.jsx'
import {
  EsqueletoTarjetasResumen,
  EsqueletoTabla,
  esperarEsqueleto,
} from '../components/ui/Esqueleto.jsx'

export function AdminProductosLista() {
  const location = useLocation()
  const [productos, setProductos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState(null)
  const [avisoExito, setAvisoExito] = useState(
    () => location.state?.mensajeExito || ''
  )
  const [busqueda, setBusqueda] = useState('')
  const [categoriaFiltro, setCategoriaFiltro] = useState('todos')
  const [confirmandoId, setConfirmandoId] = useState(null)
  const [eliminando, setEliminando] = useState(false)

  useEffect(() => {
    let montado = true
    Promise.all([ListarProductos(), esperarEsqueleto()])
      .then(([datos]) => {
        if (montado && Array.isArray(datos)) {
          setProductos(datos)
        }
      })
      .catch(async (err) => {
        await esperarEsqueleto()
        if (montado)
          setError(
            err?.message ||
              'En este momento no pudimos cargar los productos del catálogo. Por favor, intenta nuevamente en unos minutos.'
          )
      })
      .finally(() => {
        if (montado) setCargando(false)
      })
    return () => {
      montado = false
    }
  }, [])

  const confirmarEliminacion = async (id) => {
    setEliminando(true)
    setError(null)
    try {
      await EliminarProducto(id)
      setProductos((prev) =>
        prev.filter((p) => String(p.id ?? p.codigo) !== String(id))
      )
      setConfirmandoId(null)
      setAvisoExito('Producto eliminado correctamente del catálogo.')
    } catch (err) {
      setError(err?.message || 'No se pudo eliminar el producto.')
    } finally {
      setEliminando(false)
    }
  }

  const productosFiltrados = productos.filter((p) => {
    const coincideCategoria =
      categoriaFiltro === 'todos' ||
      String(p.categoria || '').toLowerCase() ===
        categoriaFiltro.toLowerCase()
    const termino = busqueda.trim().toLowerCase()
    if (!termino) return coincideCategoria
    return (
      concideBusqueda(p, termino) && coincideCategoria
    )
  })

  function concideBusqueda(p, termino) {
    return (
      String(p.nombre || '')
        .toLowerCase()
        .includes(termino) ||
      String(p.codigo || '')
        .toLowerCase()
        .includes(termino) ||
      String(p.descripcion || '')
        .toLowerCase()
        .includes(termino)
    )
  }

  const totalProductos = productos.length
  const totalUnidades = productos.reduce((acc, p) => acc + (p.stock || 0), 0)
  const valorTotal = productos.reduce(
    (acc, p) => acc + (p.precio || 0) * (p.stock || 0),
    0
  )
  const conStockBajo = productos.filter((p) => estadoStock(p) !== 'OK').length

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#f4f7fb] px-4 py-7 text-[#1f2d3d] md:px-6">
      <div className="mx-auto max-w-[1150px]">
        <CabeceraAdminNav
          titulo="Gestión de Productos del Catálogo"
          subtitulo="Administra precios, stock, categorías e imágenes de cilindros y accesorios"
          accionesDerecha={
            <Link
              to="/administradora/productos/nuevo"
              className="rounded-lg bg-[#FF4500] px-4 py-2 text-sm font-bold text-white no-underline shadow-sm transition hover:bg-[#e03d00]"
            >
              + Nuevo Producto
            </Link>
          }
        />

        {/* Tarjetas de Resumen de Catálogo */}
        {cargando && productos.length === 0 ? (
          <EsqueletoTarjetasResumen cantidad={4} />
        ) : (
          <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-1 rounded-[10px] border-l-[5px] border-[#2358b9] bg-white p-4 shadow-sm">
              <span className="text-[13px] text-[#5b6776]">
                Productos activos
              </span>
              <strong className="text-2xl font-bold text-[#1d3963]">
                {totalProductos}
              </strong>
              <small className="text-xs text-[#6e7a89]">
                en catálogo de tienda
              </small>
            </div>

            <div className="flex flex-col gap-1 rounded-[10px] border-l-[5px] border-[#2358b9] bg-white p-4 shadow-sm">
              <span className="text-[13px] text-[#5b6776]">
                Unidades totales
              </span>
              <strong className="text-2xl font-bold text-[#1d3963]">
                {totalUnidades}
              </strong>
              <small className="text-xs text-[#6e7a89]">
                disponibles en inventario
              </small>
            </div>

            <div className="flex flex-col gap-1 rounded-[10px] border-l-[5px] border-[#2358b9] bg-white p-4 shadow-sm">
              <span className="text-[13px] text-[#5b6776]">
                Valorización total
              </span>
              <strong className="text-2xl font-bold text-[#1d3963]">
                {formatearPesos(valorTotal)}
              </strong>
              <small className="text-xs text-[#6e7a89]">
                precio × stock actual
              </small>
            </div>

            <div
              className={`flex flex-col gap-1 rounded-[10px] border-l-[5px] bg-white p-4 shadow-sm ${
                conStockBajo > 0 ? 'border-[#d9534f]' : 'border-[#2358b9]'
              }`}
            >
              <span className="text-[13px] text-[#5b6776]">
                Alertas de reposición
              </span>
              <strong
                className={`text-2xl font-bold ${
                  conStockBajo > 0 ? 'text-[#d9534f]' : 'text-[#1d3963]'
                }`}
              >
                {conStockBajo}
              </strong>
              <small className="text-xs text-[#6e7a89]">
                bajo el stock mínimo
              </small>
            </div>
          </div>
        )}

        <BannerAlerta
          mensaje={avisoExito}
          tipo="exito"
          variante="claro"
          className="mb-4"
        />
        <BannerAlerta
          mensaje={error}
          tipo="error"
          variante="claro"
          className="mb-4"
        />

        {/* Barra de búsqueda y filtro */}
        <section className="mb-5 rounded-[10px] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="flex flex-1 flex-wrap items-center gap-3">
              <input
                type="search"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar por código, nombre o descripción..."
                className="w-full max-w-sm rounded-lg border border-[#c5d1e0] bg-white px-3.5 py-2 text-sm text-slate-800 focus:border-[#2358b9] focus:outline-none"
              />
              <select
                value={categoriaFiltro}
                onChange={(e) => setCategoriaFiltro(e.target.value)}
                aria-label="Filtrar por categoría"
                className="rounded-lg border border-[#c5d1e0] bg-white px-3 py-2 text-sm text-slate-800 focus:border-[#2358b9] focus:outline-none"
              >
                <option value="todos">Todas las categorías</option>
                <option value="Cilindros">Cilindros de Gas</option>
                <option value="Reguladores">Reguladores</option>
                <option value="Mangueras">Mangueras</option>
                <option value="Accesorios">Accesorios</option>
                <option value="Kits">Kits de Conexión</option>
              </select>
              <span className="text-xs font-medium text-[#6e7a89]">
                Mostrando {productosFiltrados.length} de {productos.length}{' '}
                productos
              </span>
            </div>

            <Link
              to="/administradora/productos/nuevo"
              className="inline-flex items-center justify-center rounded-lg bg-[#2358b9] px-4 py-2 text-sm font-semibold text-white no-underline transition hover:bg-[#1b4592]"
            >
              Nuevo producto
            </Link>
          </div>

          {cargando && productos.length === 0 ? (
            <EsqueletoTabla filas={6} columnas={6} conMiniatura />
          ) : (
            <AdminProductoTabla
              productos={productosFiltrados}
              confirmandoId={confirmandoId}
              alSolicitarEliminar={setConfirmandoId}
              alCancelarEliminar={() => setConfirmandoId(null)}
              alConfirmarEliminar={confirmarEliminacion}
              eliminando={eliminando}
            />
          )}
        </section>
      </div>
    </div>
  )
}

export default AdminProductosLista
