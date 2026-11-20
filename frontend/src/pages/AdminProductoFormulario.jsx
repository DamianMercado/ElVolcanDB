import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useFormulario } from '../hooks/useFormulario.js'
import {
  CrearProducto,
  ObtenerProducto,
  ActualizarProducto,
  EliminarProducto,
} from '../service/productoService.js'
import {
  VALORES_INICIALES_PRODUCTO,
  CATEGORIAS_PRODUCTO,
  aValoresFormularioProducto,
  aPayloadProducto,
} from '../utils/formularioProducto.js'
import { formatearPesos } from '../utils/formato.js'
import { CabeceraAdminNav } from '../components/admin/CabeceraAdminNav.jsx'
import { Campo } from '../components/ui/Campo.jsx'
import { Miniatura } from '../components/ui/Miniatura.jsx'
import { BannerAlerta } from '../components/ui/BannerAlerta.jsx'
import {
  EsqueletoFormularioProducto,
  EsqueletoProceso,
  DURACION_ESQUELETO_MS,
  esperarEsqueleto,
} from '../components/ui/Esqueleto.jsx'

export function AdminProductoFormulario() {
  const { id } = useParams()
  const navigate = useNavigate()
  const esEdicion = Boolean(id)

  const { valores, cambiar, reiniciar } = useFormulario(
    VALORES_INICIALES_PRODUCTO
  )
  const [cargando, setCargando] = useState(
    () => esEdicion || DURACION_ESQUELETO_MS > 0
  )
  const [guardando, setGuardando] = useState(false)
  const [eliminando, setEliminando] = useState(false)
  const [confirmandoEliminar, setConfirmandoEliminar] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    let montado = true

    if (!esEdicion) {
      reiniciar(VALORES_INICIALES_PRODUCTO)
      if (DURACION_ESQUELETO_MS > 0) {
        esperarEsqueleto().then(() => {
          if (montado) setCargando(false)
        })
      }
      return () => {
        montado = false
      }
    }

    Promise.all([ObtenerProducto(id), esperarEsqueleto()])
      .then(([producto]) => {
        if (montado && producto) {
          setError(null)
          reiniciar(aValoresFormularioProducto(producto))
        }
      })
      .catch(async (err) => {
        await esperarEsqueleto()
        if (montado) {
          setError(
            err?.message ||
              'En este momento no pudimos obtener la información del producto.'
          )
        }
      })
      .finally(() => {
        if (montado) setCargando(false)
      })

    return () => {
      montado = false
    }
  }, [id, esEdicion, reiniciar])

  const enviar = async (e) => {
    e.preventDefault()
    setError(null)

    if (!valores.nombre.trim()) {
      setError('El nombre del producto es obligatorio.')
      return
    }
    if (Number(valores.precio) <= 0) {
      setError('El precio debe ser mayor a $0.')
      return
    }

    setGuardando(true)
    try {
      const datosProducto = aPayloadProducto(valores)
      if (esEdicion) {
        await ActualizarProducto(id, datosProducto)
      } else {
        await CrearProducto(datosProducto)
      }
      navigate('/administradora/productos', {
        state: {
          mensajeExito: esEdicion
            ? `Producto "${datosProducto.nombre}" actualizado con éxito.`
            : `Producto "${datosProducto.nombre}" creado e incorporado al catálogo.`,
        },
      })
    } catch (err) {
      setError(err?.message || 'Error al guardar los datos del producto.')
    } finally {
      setGuardando(false)
    }
  }

  const confirmarEliminacion = async () => {
    setEliminando(true)
    setError(null)
    try {
      await EliminarProducto(id)
      navigate('/administradora/productos', {
        state: {
          mensajeExito: 'Producto eliminado correctamente.',
        },
      })
    } catch (err) {
      setError(err?.message || 'Error al eliminar el producto.')
      setEliminando(false)
      setConfirmandoEliminar(false)
    }
  }

  const precioVistaPrevia = Number(valores.precio) || 0

  return (
    <div className="min-h-[calc(100vh-140px)] bg-[#f4f7fb] px-4 py-7 text-[#1f2d3d] md:px-6">
      <div className="mx-auto max-w-[1150px]">
        <CabeceraAdminNav
          titulo={
            esEdicion ? 'Editar Producto del Catálogo' : 'Crear Nuevo Producto'
          }
          subtitulo={
            esEdicion
              ? `Modificando registro #${id} · Los cambios se reflejan en la tienda y panel de stock`
              : 'Completa los datos para incorporar un nuevo cilindro o accesorio al catálogo'
          }
          accionesDerecha={
            <Link
              to="/administradora/productos"
              className="rounded-lg border border-[#c5d1e0] bg-white px-4 py-2 text-sm font-semibold text-[#1d3963] no-underline transition hover:bg-[#eef4fc]"
            >
              ← Volver al listado
            </Link>
          }
        />

        {cargando ? (
          <EsqueletoFormularioProducto />
        ) : (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Columna Principal: Formulario (2/3) */}
            <section className="rounded-[10px] border-l-[5px] border-[#2358b9] bg-white p-6 shadow-sm lg:col-span-2">
              <h3 className="mb-4 text-lg font-bold text-[#1d3963]">
                {esEdicion
                  ? 'Datos del Producto'
                  : 'Información del Nuevo Producto'}
              </h3>

              <BannerAlerta
                mensaje={error}
                tipo="error"
                variante="claro"
                className="mb-4"
              />

              {(guardando || eliminando) && (
                <div className="mb-4">
                  <EsqueletoProceso
                    etiqueta={
                      eliminando
                        ? 'Eliminando producto del catálogo...'
                        : 'Guardando información del producto...'
                    }
                    variante="claro"
                  />
                </div>
              )}

              <form onSubmit={enviar} className="flex flex-col gap-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Campo
                    id="codigo"
                    name="codigo"
                    etiqueta="Código Interno"
                    value={valores.codigo}
                    onChange={cambiar}
                    placeholder="Ej: GAS-15KG"
                    required
                  />
                  <div className="sm:col-span-2">
                    <Campo
                      id="nombre"
                      name="nombre"
                      etiqueta="Nombre del Producto"
                      value={valores.nombre}
                      onChange={cambiar}
                      placeholder="Ej: Cilindro gas licuado 15 kg"
                      required
                    />
                  </div>
                </div>

                <Campo
                  id="descripcion"
                  name="descripcion"
                  as="textarea"
                  rows={3}
                  etiqueta="Descripción comercial"
                  value={valores.descripcion}
                  onChange={cambiar}
                  placeholder="Describe el uso recomendado, formato o características del producto..."
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Campo
                    id="precio"
                    name="precio"
                    type="number"
                    min="0"
                    step="10"
                    etiqueta="Precio Unitario (CLP)"
                    value={valores.precio}
                    onChange={cambiar}
                    placeholder="23500"
                    required
                  />
                  <Campo
                    id="stock"
                    name="stock"
                    type="number"
                    min="0"
                    step="1"
                    etiqueta="Stock en Bodega"
                    value={valores.stock}
                    onChange={cambiar}
                    placeholder="50"
                    required
                  />
                  <Campo
                    id="minimo"
                    name="minimo"
                    type="number"
                    min="0"
                    step="1"
                    etiqueta="Stock Mínimo (Alerta)"
                    value={valores.minimo}
                    onChange={cambiar}
                    placeholder="15"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Campo
                    id="categoria"
                    name="categoria"
                    as="select"
                    etiqueta="Categoría"
                    value={valores.categoria}
                    onChange={cambiar}
                  >
                    {CATEGORIAS_PRODUCTO.map((cat) => (
                      <option key={cat.valor} value={cat.valor}>
                        {cat.etiqueta}
                      </option>
                    ))}
                  </Campo>
                  <div className="sm:col-span-2">
                    <Campo
                      id="imagen"
                      name="imagen"
                      type="url"
                      etiqueta="URL de Imagen (Opcional)"
                      value={valores.imagen}
                      onChange={cambiar}
                      placeholder="https://res.cloudinary.com/..."
                    />
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-[#eef2f7] pt-4">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="submit"
                      disabled={guardando || eliminando}
                      className="cursor-pointer rounded-lg bg-[#2358b9] px-5 py-2.5 text-sm font-bold text-white shadow-sm transition hover:bg-[#1b4592] disabled:opacity-50"
                    >
                      {guardando
                        ? 'Guardando...'
                        : esEdicion
                        ? 'Guardar cambios'
                        : 'Crear producto'}
                    </button>
                    <Link
                      to="/administradora/productos"
                      className="rounded-lg border border-[#c5d1e0] bg-white px-4 py-2.5 text-sm font-semibold text-[#4a5c73] no-underline transition hover:bg-slate-50"
                    >
                      Cancelar
                    </Link>
                  </div>

                  {esEdicion &&
                    (confirmandoEliminar ? (
                      <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5">
                        <span className="text-xs font-semibold text-[#a12a22]">
                          ¿Confirmar eliminación?
                        </span>
                        <button
                          type="button"
                          disabled={eliminando}
                          onClick={confirmarEliminacion}
                          className="cursor-pointer rounded bg-[#d9534f] px-2.5 py-1 text-xs font-bold text-white transition hover:bg-[#b9382c] disabled:opacity-50"
                        >
                          {eliminando ? 'Eliminando...' : 'Sí, eliminar'}
                        </button>
                        <button
                          type="button"
                          disabled={eliminando}
                          onClick={() => setConfirmandoEliminar(false)}
                          className="cursor-pointer rounded border border-[#c5d1e0] bg-white px-2.5 py-1 text-xs font-semibold text-[#4a5c73]"
                        >
                          No
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={guardando}
                        onClick={() => setConfirmandoEliminar(true)}
                        className="cursor-pointer rounded-lg border border-[#f5c6c4] bg-[#fdecea] px-3.5 py-2 text-xs font-semibold text-[#a12a22] transition hover:bg-[#f9d6d3]"
                      >
                        Eliminar producto
                      </button>
                    ))}
                </div>
              </form>
            </section>

            {/* Columna Derecha: Vista Previa en Tiempo Real (1/3) */}
            <aside className="flex flex-col gap-4">
              <div className="rounded-[10px] bg-white p-5 shadow-sm">
                <h4 className="mb-3 text-sm font-bold uppercase tracking-wider text-[#4a5c73]">
                  Vista Previa de Tarjeta
                </h4>
                <div className="flex flex-col items-center rounded-xl border border-[#e3eaf3] bg-[#fafbfd] p-5 text-center">
                  <Miniatura
                    src={valores.imagen}
                    nombre={valores.nombre || 'Nuevo Producto'}
                    className="mb-3 h-36 w-36 rounded-lg border border-[#e3eaf3] bg-white object-contain p-2"
                  />
                  <span className="mb-1 rounded-full bg-[#eef4fc] px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#2358b9]">
                    {valores.codigo || 'CÓDIGO'}
                  </span>
                  <h5 className="text-base font-bold text-[#1d3963]">
                    {valores.nombre || 'Nombre del producto'}
                  </h5>
                  {valores.descripcion && (
                    <p className="mt-1 line-clamp-2 text-xs text-[#6e7a89]">
                      {valores.descripcion}
                    </p>
                  )}
                  <p className="mt-2 text-xl font-extrabold text-[#2358b9]">
                    {formatearPesos(precioVistaPrevia)}
                  </p>
                  <p className="mt-1 text-xs text-[#5b6776]">
                    Stock inicial: <strong>{valores.stock || 0}</strong> · Mín:{' '}
                    <strong>{valores.minimo || 0}</strong>
                  </p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminProductoFormulario
