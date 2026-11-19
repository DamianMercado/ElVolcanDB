export function ControlCantidad({ cantidad, alDisminuir, alAumentar }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-white/20 bg-white/10 px-1.5 py-1">
      <button
        type="button"
        onClick={alDisminuir}
        title="Disminuir"
        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded bg-white/15 text-sm font-bold text-white transition hover:bg-[#FF4500]"
      >
        -
      </button>
      <span className="min-w-[24px] text-center text-sm font-bold text-white tabular-nums">
        {cantidad}
      </span>
      <button
        type="button"
        onClick={alAumentar}
        title="Aumentar"
        className="flex h-6 w-6 cursor-pointer items-center justify-center rounded bg-white/15 text-sm font-bold text-white transition hover:bg-[#FF4500]"
      >
        +
      </button>
    </div>
  )
}

export default ControlCantidad
