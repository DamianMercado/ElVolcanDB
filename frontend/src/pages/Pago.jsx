import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useCarrito } from '../context/Carrito.jsx'
import {
  actualizarEstadoPago,
  obtenerUltimoPedido,
} from '../service/pedidoService.js'
import { EstadoVacio } from '../components/ui/EstadoVacio.jsx'
import {
  EsqueletoPago,
  EsqueletoProceso,
  useEsperaEsqueleto,
} from '../components/ui/Esqueleto.jsx'
import { FormularioTarjetaWebpay } from '../components/pago/FormularioTarjetaWebpay.jsx'
import { ControlesPruebaPago } from '../components/pago/ControlesPruebaPago.jsx'
import { ResumenPagoLateral } from '../components/pago/ResumenPagoLateral.jsx'

const TARJETAS_PRUEBA = {
  debito: {
    tipo: 'debito',
    etiqueta: 'Débito / Redcompra',
    numero: '6600 0000 0000 0001',
    expiracion: '12/28',
    cvv: '123',
  },
  credito: {
    tipo: 'credito',
    etiqueta: 'Tarjeta de Crédito',
    numero: '5970 2000 0000 0001',
    expiracion: '12/28',
    cvv: '123',
  },
}

export function Pago() {
  const location = useLocation()
  const navigate = useNavigate()
  const { limpiarCarrito } = useCarrito()

  const [pedido] = useState(() => {
    return location.state?.pedido || obtenerUltimoPedido()
  })

  const [email, setEmail] = useState(
    () => pedido?.email || 'cliente@el-volcan.cl'
  )
  const [nombreTitular, setNombreTitular] = useState(
    () => pedido?.cliente || 'Cliente Particular'
  )
  const [numeroTarjeta, setNumeroTarjeta] = useState(
    TARJETAS_PRUEBA.debito.numero
  )
  const [expiracion, setExpiracion] = useState(
    TARJETAS_PRUEBA.debito.expiracion
  )
  const [cvv, setCvv] = useState(TARJETAS_PRUEBA.debito.cvv)
  const [tipoMedio, setTipoMedio] = useState('debito')

  const [procesando, setProcesando] = useState(false)
  const [errorRechazo, setErrorRechazo] = useState(null)
  const cargandoVista = useEsperaEsqueleto()

  const cambiarNumeroTarjeta = (valor) => {
    const soloNumeros = valor.replace(/\D/g, '').slice(0, 16)
    const agrupado = soloNumeros.replace(/(\d{4})/g, '$1 ').trim()
    setNumeroTarjeta(agrupado || valor)
  }

  const cargarTarjetaPrueba = (clave) => {
    const tarjetaPrueba = TARJETAS_PRUEBA[clave]
    if (!tarjetaPrueba) return
    setTipoMedio(tarjetaPrueba.tipo)
    setNumeroTarjeta(tarjetaPrueba.numero)
    setExpiracion(tarjetaPrueba.expiracion)
    setCvv(tarjetaPrueba.cvv)
    setErrorRechazo(null)
  }

  const procesarPago = async (e) => {
    e.preventDefault()
    if (!pedido) return

    setErrorRechazo(null)
    setProcesando(true)

    try {
      const ultimos4 = numeroTarjeta.replace(/\s/g, '').slice(-4) || '0001'

      const pedidoActualizado = await actualizarEstadoPago(pedido.id, {
        montoPago: pedido.total,
        email: email.trim(),
        cliente: nombreTitular.trim() || pedido.cliente,
        estadoPago: 'pagado',
        subMetodoPago: `webpay_${tipoMedio}`,
        tarjetaTerminacion: ultimos4,
      })

      limpiarCarrito()

      navigate('/pedido-creado', {
        state: {
          pedido: {
            ...pedido,
            ...pedidoActualizado,
          },
        },
      })
    } catch (err) {
      setProcesando(false)
      setErrorRechazo({
        codigo: '-1',
        mensaje:
          err?.message ||
          'No pudimos completar tu pago en este momento. No se realizó ningún cobro a tu tarjeta; por favor inténtalo nuevamente.',
      })
    }
  }

  const simularRechazo = () => {
    setProcesando(true)
    setErrorRechazo(null)

    setTimeout(() => {
      setProcesando(false)
      setErrorRechazo({
        codigo: '-1',
        mensaje:
          'Transacción rechazada por el banco emisor. No se realizó ningún cobro a su tarjeta.',
      })
    }, 1000)
  }

  if (!pedido) {
    return (
      <div className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md">
          <EstadoVacio
            titulo="No se encontró un pedido pendiente de pago"
            descripcion="Por favor regresa a la tienda para seleccionar tus productos."
            textoBoton="Ir al Catálogo de Productos"
            alAccionar={() => navigate('/productos')}
          />
        </div>
      </div>
    )
  }

  const tituloProducto =
    pedido.items && pedido.items.length > 0
      ? pedido.items[0].producto?.nombre || 'Cilindro de Gas Licuado'
      : pedido.detalle || 'Cilindro de Gas Licuado'

  const descripcionPedido = pedido.direccion
    ? `Distribuidora de Gas El Volcán Ltda. Entrega en ${pedido.direccion}.`
    : 'Distribuidora de Gas El Volcán Ltda. Entrega a domicilio.'

  return (
    <div className="min-h-[calc(100vh-140px)] bg-slate-100 px-4 py-8">
      <div className="mx-auto mb-5 flex max-w-5xl items-center justify-between">
        <button
          type="button"
          className="cursor-pointer text-sm font-semibold text-slate-600 transition hover:text-slate-900"
          onClick={() => navigate('/creacion-pedido')}
        >
          ← Volver y modificar pedido
        </button>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
          Distribuidora de Gas El Volcán
        </span>
      </div>

      {cargandoVista ? (
        <EsqueletoPago />
      ) : (
        <div className="mx-auto flex max-w-5xl flex-col gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-lg md:p-10 lg:flex-row">
          <section className="flex-1">
            <h1 className="mb-6 text-2xl font-extrabold text-slate-900">
              Información de Pago
            </h1>

            {errorRechazo && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
                <strong className="block font-bold">
                  Transacción Rechazada (Código {errorRechazo.codigo})
                </strong>
                <p className="mt-1 text-xs">{errorRechazo.mensaje}</p>
                <button
                  type="button"
                  className="mt-2.5 cursor-pointer rounded-md bg-red-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-800"
                  onClick={() => setErrorRechazo(null)}
                >
                  Reintentar pago
                </button>
              </div>
            )}

            {procesando && (
              <div className="mb-5">
                <EsqueletoProceso
                  etiqueta="Procesando transacción con Webpay..."
                  variante="claro"
                  lineas={3}
                />
              </div>
            )}

            <FormularioTarjetaWebpay
              email={email}
              alCambiarEmail={setEmail}
              nombreTitular={nombreTitular}
              alCambiarTitular={setNombreTitular}
              numeroTarjeta={numeroTarjeta}
              alCambiarNumeroTarjeta={cambiarNumeroTarjeta}
              expiracion={expiracion}
              alCambiarExpiracion={setExpiracion}
              cvv={cvv}
              alCambiarCvv={setCvv}
              total={pedido.total}
              procesando={procesando}
              alEnviar={procesarPago}
            >
              <ControlesPruebaPago
                alCargarTarjetaPrueba={cargarTarjetaPrueba}
                alSimularRechazo={simularRechazo}
                procesando={procesando}
              />
            </FormularioTarjetaWebpay>
          </section>

          <ResumenPagoLateral
            tituloProducto={tituloProducto}
            descripcionPedido={descripcionPedido}
            total={pedido.total}
          />
        </div>
      )}
    </div>
  )
}

export default Pago
