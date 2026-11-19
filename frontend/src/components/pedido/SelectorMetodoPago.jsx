const METODOS_PAGO = [
  {
    valor: 'efectivo',
    titulo: 'Pago al Repartidor',
    descripcion: 'Pagas en efectivo o tarjeta al recibir tus cilindros',
  },
  {
    valor: 'pagar_ahora',
    titulo: 'Pagar Ahora (En Línea)',
    descripcion: 'Pagas con Webpay, Débito o Crédito sin contacto',
  },
]

export function SelectorMetodoPago({ metodoPago, alCambiarMetodoPago }) {
  return (
    <div className="mt-4">
      <span className="mb-2 block text-sm font-semibold text-white/95">
        Elige cómo deseas pagar:
      </span>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {METODOS_PAGO.map((opcion) => {
          const seleccionado = metodoPago === opcion.valor
          return (
            <label
              key={opcion.valor}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 transition ${
                seleccionado
                  ? 'border-[#00A8E8] bg-[#00A8E8]/20 shadow-sm'
                  : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
              }`}
            >
              <input
                type="radio"
                name="metodoPago"
                value={opcion.valor}
                checked={seleccionado}
                onChange={() => alCambiarMetodoPago(opcion.valor)}
                className="mt-1 accent-[#FF4500]"
              />
              <div>
                <strong className="block text-sm font-bold text-white">
                  {opcion.titulo}
                </strong>
                <span className="mt-0.5 block text-xs text-white/70">
                  {opcion.descripcion}
                </span>
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}

export default SelectorMetodoPago
