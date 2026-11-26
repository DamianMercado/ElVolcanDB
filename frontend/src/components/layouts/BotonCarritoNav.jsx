export function BotonCarritoNav({
  cantidadTotal,
  total,
  onClick,
  esMovil = false,
}) {
  const claseBase = esMovil
    ? 'flex items-center gap-1.5 rounded-lg bg-white/12 px-2.5 py-1.5 text-xs font-semibold text-white cursor-pointer'
    : 'flex items-center gap-2 rounded-lg bg-white/12 px-3.5 py-2 text-sm font-semibold text-white transition hover:bg-[#00A8E8]/25 cursor-pointer'

  return (
    <button
      type="button"
      className={claseBase}
      onClick={onClick}
      title="Ver resumen y pagar pedido"
    >
      <span>🛒</span>
      {!esMovil && <span>Carrito</span>}
      {cantidadTotal > 0 && (
        <>
          <span className="rounded-full bg-[#FF4500] px-1.5 py-0.5 text-xs font-bold text-white">
            {cantidadTotal}
          </span>
          <span className="border-l border-white/20 pl-1.5 text-xs font-bold text-[#00A8E8]">
            {'$' + total.toLocaleString('es-CL')}
          </span>
        </>
      )}
    </button>
  )
}

export default BotonCarritoNav
