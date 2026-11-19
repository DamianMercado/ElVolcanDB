export function TarjetaProducto({ producto, alAgregar }) {
  const sinStock = Number(producto.stock) <= 0

  return (
    <div className="flex flex-col rounded-xl border border-stone-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="mb-3 flex h-44 w-full items-center justify-center overflow-hidden rounded-lg bg-stone-50 p-3">
        {producto.imagen ? (
          <img
            src={producto.imagen}
            alt={producto.nombre}
            className="max-h-full max-w-full object-contain"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-stone-400">
            <span>Sin imagen</span>
          </div>
        )}
      </div>

      {producto.categoria && (
        <span className="mb-1 inline-block w-fit rounded bg-[#0A2540]/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-[#0A2540]">
          {producto.categoria}
        </span>
      )}

      <h3 className="text-base font-bold text-[#0A2540]">{producto.nombre}</h3>

      <p className="mt-1.5 text-xl font-extrabold text-[#FF4500]">
        {'$' + Number(producto.precio).toLocaleString('es-CL')}
      </p>

      <p className="mt-1 mb-4 text-xs text-stone-500">
        {'Stock disponible: ' + producto.stock}
      </p>

      <button
        type="button"
        disabled={sinStock}
        onClick={() => alAgregar(producto)}
        className="mt-auto w-full cursor-pointer rounded-lg bg-[#0A2540] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#FF4500] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {sinStock ? 'Sin Stock' : 'Agregar al Carrito'}
      </button>
    </div>
  )
}

export default TarjetaProducto
