import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCarrito } from '../context/Carrito.jsx'
import { useSesion } from '../context/Sesion.jsx'
import { crearNuevoPedido } from '../service/pedidoService.js'
import { formatearPesos } from '../utils/formato.js'
import { BannerAlerta } from '../components/ui/BannerAlerta.jsx'
import { EstadoVacio } from '../components/ui/EstadoVacio.jsx'
import {
  EsqueletoCreacionPedido,
  EsqueletoProceso,
  useEsperaEsqueleto,
} from '../components/ui/Esqueleto.jsx'
import { ItemCarrito } from '../components/pedido/ItemCarrito.jsx'
import { TarjetaDireccionCuenta } from '../components/pedido/TarjetaDireccionCuenta.jsx'
import { FormularioDespacho } from '../components/pedido/FormularioDespacho.jsx'
import { SelectorMetodoPago } from '../components/pedido/SelectorMetodoPago.jsx'

export function CreacionPedido() {
  const navigate = useNavigate()
  const {
    carrito,
    aumentarCantidad,
    disminuirCantidad,
    eliminarDelCarrito,
    limpiarCarrito,
    total,
  } = useCarrito()

  const { usuario } = useSesion()

  // Estados de datos del cliente
  const [nombreCliente, setNombreCliente] = useState(
    usuario
      ? `${usuario.nombres || usuario.nombre || ''} ${usuario.apellidos || ''}`.trim()
      : ''
  )
  const [telefonoCliente, setTelefonoCliente] = useState(
    usuario?.telefono || ''
  )

  // Estados de dirección de entrega
  const [direccion1, setDireccion1] = useState(usuario?.direccion || '')
  const [direccion2, setDireccion2] = useState(usuario?.depto || '')
  const [comuna, setComuna] = useState(usuario?.comuna || 'Puente Alto')
  const [observacion, setObservacion] = useState('')

  const [usarDirCuenta, setUsarDirCuenta] = useState(() =>
    Boolean(usuario?.direccion)
  )
  const [metodoPago, setMetodoPago] = useState('')
  const [creandoPedido, setCreandoPedido] = useState(false)
  const [alerta, setAlerta] = useState({ mensaje: '', tipo: '' })
  const cargandoVista = useEsperaEsqueleto()

  const confirmarCreacionPedido = async (e) => {
    e.preventDefault()
    if (carrito.length === 0) {
      setAlerta({
        mensaje:
          'No tienes productos en tu pedido. Vuelve al catálogo para agregar.',
        tipo: 'error',
      })
      return
    }

    if (!metodoPago) {
      setAlerta({
        mensaje: 'Por favor, selecciona un método de pago antes de continuar.',
        tipo: 'error',
      })
      return
    }

    let nombreFinal = nombreCliente.trim()
    let telefonoFinal = telefonoCliente.trim()
    const rutFinal = usuario?.rut || ''
    const emailFinal = usuario?.email || usuario?.correo || ''
    let direccionFinal

    if (usarDirCuenta && usuario?.direccion) {
      nombreFinal =
        `${usuario.nombres || usuario.nombre || ''} ${usuario.apellidos || ''}`.trim() ||
        'Cliente El Volcán'
      telefonoFinal =
        usuario.telefono || telefonoCliente.trim() || '+56 9 8765 4321'
      direccionFinal = `${usuario.direccion}${
        usuario.depto ? `, Depto ${usuario.depto}` : ''
      }, ${usuario.comuna || 'Santiago'}`
    } else {
      if (!nombreFinal) {
        setAlerta({
          mensaje:
            'Por favor, ingresa el nombre de la persona que recibe el pedido.',
          tipo: 'error',
        })
        return
      }
      if (!telefonoFinal) {
        setAlerta({
          mensaje:
            'Por favor, ingresa un teléfono de contacto para que el repartidor pueda coordinar la entrega.',
          tipo: 'error',
        })
        return
      }
      if (!direccion1.trim()) {
        setAlerta({
          mensaje:
            'Por favor, ingresa la calle y número de entrega del gas.',
          tipo: 'error',
        })
        return
      }
      if (!comuna.trim()) {
        setAlerta({
          mensaje: 'Por favor, ingresa la comuna de entrega.',
          tipo: 'error',
        })
        return
      }

      direccionFinal = `${direccion1.trim()}${
        direccion2.trim() ? `, Depto ${direccion2.trim()}` : ''
      }, ${comuna.trim()}`
    }

    setCreandoPedido(true)
    setAlerta({ mensaje: '', tipo: '' })

    try {
      // FLUJO 1: PAGAR AHORA (En línea)
      if (metodoPago === 'pagar_ahora') {
        const nuevoPedido = await crearNuevoPedido({
          idUsuario: usuario?.id,
          cliente: nombreFinal,
          telefono: telefonoFinal,
          rut: rutFinal,
          email: emailFinal,
          direccion: direccionFinal,
          direccionDetalle: {
            direccion1: usarDirCuenta
              ? usuario?.direccion || ''
              : direccion1.trim(),
            direccion2: usarDirCuenta
              ? usuario?.depto || ''
              : direccion2.trim(),
            comuna: usarDirCuenta ? usuario?.comuna || '' : comuna.trim(),
            observacion: observacion.trim(),
          },
          items: carrito.map((item) => ({
            producto: item.producto,
            cantidad: item.cantidad,
            subtotal: item.producto.precio * item.cantidad,
          })),
          total,
          metodoPago: 'pagar_ahora',
          subMetodoPago: 'webpay',
          montoPaga: total,
          vuelto: 0,
          desgloseVuelto: null,
          estadoPago: 'pendiente',
        })

        navigate('/pago', {
          state: { pedido: nuevoPedido },
        })
        return
      }

      // FLUJO 2: PAGO AL REPARTIDOR
      if (metodoPago === 'efectivo') {
        const nuevoPedido = await crearNuevoPedido({
          idUsuario: usuario?.id,
          cliente: nombreFinal,
          telefono: telefonoFinal,
          rut: rutFinal,
          email: emailFinal,
          direccion: direccionFinal,
          direccionDetalle: {
            direccion1: usarDirCuenta
              ? usuario?.direccion || ''
              : direccion1.trim(),
            direccion2: usarDirCuenta
              ? usuario?.depto || ''
              : direccion2.trim(),
            comuna: usarDirCuenta ? usuario?.comuna || '' : comuna.trim(),
            observacion: observacion.trim(),
          },
          items: carrito.map((item) => ({
            producto: item.producto,
            cantidad: item.cantidad,
            subtotal: item.producto.precio * item.cantidad,
          })),
          total,
          metodoPago: 'repartidor',
          subMetodoPago: 'efectivo',
          montoPaga: total,
          vuelto: 0,
          desgloseVuelto: null,
          estadoPago: 'pendiente',
        })

        limpiarCarrito()

        navigate('/pedido-creado', {
          state: { pedido: nuevoPedido },
        })
      }
    } catch (err) {
      setAlerta({
        mensaje:
          err?.message ||
          'No pudimos registrar tu pedido en este momento. Por favor, inténtalo nuevamente en unos instantes.',
        tipo: 'error',
      })
    } finally {
      setCreandoPedido(false)
    }
  }

  return (
    <main className="flex min-h-[calc(100vh-140px)] items-start justify-center bg-gradient-to-b from-[#0A2540] to-[#113a63] px-4 py-10">
      <div className="w-full max-w-3xl rounded-2xl border border-white/15 bg-[#0A2540]/90 p-6 shadow-2xl backdrop-blur-md md:p-8">
        <div className="mb-6 border-b border-white/15 pb-4 text-center">
          <h1 className="text-2xl font-extrabold text-white md:text-3xl">
            Crear Pedido de Gas
          </h1>
          <p className="mt-1 text-sm text-white/70">
            Revisa tus productos y selecciona el flujo de entrega y pago
          </p>
        </div>

        <BannerAlerta
          mensaje={alerta.mensaje}
          tipo={alerta.tipo}
          className="mb-5"
        />

        {cargandoVista ? (
          <EsqueletoCreacionPedido />
        ) : (
          <>
            {/* Sección: Lista de Productos */}
            <div className="flex flex-1 flex-col">
              <h2 className="mb-3 text-base font-bold text-[#00A8E8]">
                {`Detalle de Productos (${carrito.length})`}
              </h2>

              {carrito.length === 0 ? (
                <EstadoVacio
                  descripcion="No hay productos en el pedido."
                  textoBoton="Ir al Catálogo de Productos"
                  alAccionar={() => navigate('/productos')}
                  variante="oscuro"
                />
              ) : (
                <>
                  <div className="flex flex-col gap-2.5">
                    {carrito.map((item) => (
                      <ItemCarrito
                        key={item.producto.codigo}
                        item={item}
                        alAumentar={aumentarCantidad}
                        alDisminuir={disminuirCantidad}
                        alEliminar={eliminarDelCarrito}
                      />
                    ))}
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl border border-[#00A8E8]/30 bg-[#00A8E8]/10 px-4 py-3 text-white">
                    <span className="text-sm font-semibold">
                      Total a Pagar:
                    </span>
                    <strong className="text-xl font-extrabold text-[#00A8E8]">
                      {formatearPesos(total)}
                    </strong>
                  </div>

                  <button
                    type="button"
                    onClick={() => navigate('/productos')}
                    className="mt-3 cursor-pointer self-start text-xs font-semibold text-[#00A8E8] transition hover:underline"
                  >
                    ← Seguir agregando más productos
                  </button>
                </>
              )}
            </div>

            {/* Sección: Datos de Entrega y Pago */}
            {carrito.length > 0 && (
              <div className="mt-8 border-t border-white/15 pt-6">
                <h2 className="mb-4 text-base font-bold text-[#00A8E8]">
                  Datos de Despacho y Contacto
                </h2>

                <form
                  onSubmit={confirmarCreacionPedido}
                  className="flex flex-col gap-4"
                >
                  <TarjetaDireccionCuenta
                    usuario={usuario}
                    usarDirCuenta={usarDirCuenta}
                    alCambiarUsarDirCuenta={setUsarDirCuenta}
                  />

                  {(!usarDirCuenta || !usuario?.direccion) && (
                    <FormularioDespacho
                      nombreCliente={nombreCliente}
                      alCambiarNombre={setNombreCliente}
                      telefonoCliente={telefonoCliente}
                      alCambiarTelefono={setTelefonoCliente}
                      direccion1={direccion1}
                      alCambiarDireccion1={setDireccion1}
                      direccion2={direccion2}
                      alCambiarDireccion2={setDireccion2}
                      comuna={comuna}
                      alCambiarComuna={setComuna}
                    />
                  )}

                  {/* Observación para el repartidor */}
                  <div className="mt-1 flex flex-col gap-1.5">
                    <label
                      htmlFor="observacion-pedido"
                      className="text-xs font-semibold text-white/90"
                    >
                      Indicaciones para el repartidor (Opcional)
                    </label>
                    <input
                      type="text"
                      id="observacion-pedido"
                      placeholder="Ej: Portón negro, tocar timbre blanco, dejar en conserjería"
                      value={observacion}
                      onChange={(e) => setObservacion(e.target.value)}
                      className="w-full rounded-lg border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder-white/45 focus:border-[#00A8E8] focus:outline-none"
                    />
                  </div>

                  <SelectorMetodoPago
                    metodoPago={metodoPago}
                    alCambiarMetodoPago={setMetodoPago}
                  />

                  {creandoPedido && (
                    <EsqueletoProceso
                      etiqueta="Registrando tu pedido de gas..."
                      variante="oscuro"
                    />
                  )}

                  <button
                    type="submit"
                    disabled={creandoPedido}
                    className="mt-2 w-full cursor-pointer rounded-xl bg-[#FF4500] py-3.5 text-base font-bold text-white shadow-lg transition hover:bg-[#e03d00] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creandoPedido
                      ? 'Registrando pedido...'
                      : `Confirmar y Crear Pedido (${formatearPesos(total)})`}
                  </button>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  )
}

export default CreacionPedido
