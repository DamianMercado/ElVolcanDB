export function TarjetaProducto({ producto, alAgregar }) {
  const sinStock = Number(producto.stock) <= 0

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl bg-gradient-to-b from-[#1C4773] via-[#133459] to-[#0B223C] p-4 shadow-[0_14px_30px_-8px_rgba(3,12,24,0.65)] transition-all duration-200 hover:-translate-y-1 hover:from-[#215283] hover:via-[#163C66] hover:to-[#0D2745] hover:shadow-[0_22px_40px_-10px_rgba(3,12,24,0.78)]">
      <div className="mb-3.5 flex h-44 w-full items-center justify-center overflow-hidden rounded-xl bg-[#F7F9FC] p-3">
        {producto.imagen ? (
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="max-h-full max-w-full object-contain brightness-[1.05] contrast-[1.04] mix-blend-multiply transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
            <span>Sin imagen</span>
          </div>
        )}
      </div>

      {producto.categoria && (
        <span className="mb-1.5 inline-block w-fit rounded-md bg-[#00A8E8]/15 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide text-[#67D4FA]">
          {producto.categoria}
        </span>
      )}

      <h3 className="text-base font-semibold text-white/95">
        {producto.nombre}
      </h3>

      <p className="mt-1.5 text-2xl font-extrabold tracking-tight text-white">
        {'$' + Number(producto.precio).toLocaleString('es-CL')}
      </p>

      <p className="mt-1 mb-4 text-xs font-medium text-white/65">
        {'Stock disponible: ' + producto.stock}
      </p>

      <button
        type="button"
        disabled={sinStock}
        onClick={() => alAgregar(producto)}
        className="mt-auto w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#168740] via-[#15803D] to-[#166534] px-4 py-2.5 text-sm font-bold text-white shadow-[0_6px_16px_rgba(21,128,61,0.35)] transition-all duration-200 hover:from-[#18A34A] hover:via-[#169644] hover:to-[#157A3A] hover:shadow-[0_8px_20px_rgba(22,163,74,0.42)] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sinStock ? 'Sin Stock' : 'Agregar al Carrito'}
      </button>
    </div>
  )
}

export default TarjetaProducto
