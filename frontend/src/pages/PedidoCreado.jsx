import { useState } from 'react'
import { useLocation, useNavigate, Link } from 'react-router-dom'
import { obtenerUltimoPedido } from '../service/pedidoService.js'
import { obtenerSesion } from '../utils/token.js'
import { EstadoVacio } from '../components/ui/EstadoVacio.jsx'
import {
  EsqueletoRecibo,
  useEsperaEsqueleto,
} from '../components/ui/Esqueleto.jsx'
import { ReciboCabecera } from '../components/recibo/ReciboCabecera.jsx'
import { ReciboTablaItems } from '../components/recibo/ReciboTablaItems.jsx'
import { ReciboTotales } from '../components/recibo/ReciboTotales.jsx'
import { ReciboTalonCorte } from '../components/recibo/ReciboTalonCorte.jsx'

export function PedidoCreado() {
  const location = useLocation()
  const navigate = useNavigate()
  const usuario = obtenerSesion()

  const [pedido] = useState(() => {
    return location.state?.pedido || obtenerUltimoPedido()
  })
  const cargandoVista = useEsperaEsqueleto()

  const numeroRecibo =
    String(pedido?.id || '').replace(/\D/g, '') || String(pedido?.id || '1')

  const descargarComprobante = () => {
    if (!pedido) return
    const tituloAnterior = document.title
    document.title = `Comprobante-${numeroRecibo}`
    window.print()
    document.title = tituloAnterior
  }

  if (!pedido) {
    return (
      <main className="flex min-h-[calc(100vh-140px)] items-center justify-center bg-slate-100 p-6">
        <div className="w-full max-w-md">
          <EstadoVacio
            titulo="No se encontró ningún pedido reciente"
            descripcion="Aún no has generado un pedido en esta sesión."
            textoBoton="Ir al Catálogo de Productos"
            alAccionar={() => navigate('/productos')}
          />
        </div>
      </main>
    )
  }

  const esPagado = pedido.estadoPago === 'pagado'
  const esEfectivo =
    pedido.metodoPago === 'repartidor' && pedido.subMetodoPago === 'efectivo'
  const esTarjetaRepartidor =
    pedido.metodoPago === 'repartidor' && pedido.subMetodoPago === 'tarjeta'

  if (cargandoVista) {
    return (
      <main className="min-h-[calc(100vh-140px)] bg-slate-100 px-4 py-8">
        <EsqueletoRecibo />
      </main>
    )
  }

  return (
    <main className="min-h-[calc(100vh-140px)] bg-slate-100 px-4 py-8 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl">
        <article
          className="rounded-xl border border-slate-300 bg-white p-6 shadow-md md:p-10 print:border-0 print:shadow-none"
          id="documento-imprimible"
        >
          <ReciboCabecera
            pedido={pedido}
            numeroRecibo={numeroRecibo}
            esPagado={esPagado}
            esEfectivo={esEfectivo}
          />

          <ReciboTablaItems pedido={pedido} />

          <ReciboTotales
            pedido={pedido}
            esPagado={esPagado}
            esEfectivo={esEfectivo}
            esTarjetaRepartidor={esTarjetaRepartidor}
          />

          <ReciboTalonCorte
            pedido={pedido}
            numeroRecibo={numeroRecibo}
            esPagado={esPagado}
          />
        </article>

        {/* Acciones de Navegación al final del comprobante */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-3 print:hidden">
          <button
            type="button"
            className="flex items-center gap-2 cursor-pointer rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-700 active:scale-95"
            onClick={() => navigate('/seguimiento')}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>Rastrear Pedido en Vivo</span>
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-lg bg-[#2358b9] px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#1b4592]"
            onClick={descargarComprobante}
          >
            Descargar Comprobante
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={() => navigate('/productos')}
          >
            Realizar Otro Pedido
          </button>
          <button
            type="button"
            className="cursor-pointer rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            onClick={() => navigate('/')}
          >
            Volver al Inicio
          </button>
          {usuario?.rol === 'admin' && (
            <Link
              to="/administradora"
              className="rounded-lg bg-[#FF4500] px-5 py-2.5 text-sm font-bold text-white no-underline shadow transition hover:bg-[#e03d00]"
            >
              Ver Pedidos en Panel de Administración
            </Link>
          )}
        </div>
      </div>
    </main>
  )
}

export default PedidoCreado
