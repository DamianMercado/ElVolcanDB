export function InsigniaEstado({
  estado,
  variante,
  children,
  className = '',
}) {
  const textoMostrar = children || estado || ''
  const clave = String(variante || estado || '').toLowerCase()

  let colorClase = 'bg-[#2358b9] text-white'
  if (
    clave === 'ok' ||
    clave === 'stock-ok' ||
    clave === 'entregado' ||
    clave === 'pedido-entregado' ||
    clave === 'recibida' ||
    clave === 'pagado'
  ) {
    colorClase = 'bg-[#e6f6ec] text-[#1e7e45]'
  } else if (
    clave === 'bajo' ||
    clave === 'stock-bajo' ||
    clave === 'en ruta' ||
    clave === 'en-ruta' ||
    clave === 'pedido-en-ruta'
  ) {
    colorClase = 'bg-[#fff4e0] text-[#a36200]'
  } else if (
    clave === 'crítico' ||
    clave === 'critico' ||
    clave === 'stock-critico' ||
    clave === 'pendiente' ||
    clave === 'pedido-pendiente'
  ) {
    colorClase = 'bg-[#fdecea] text-[#a12a22]'
  } else if (clave === 'solicitado') {
    colorClase = 'bg-[#eef4fc] text-[#2358b9]'
  }

  return (
    <span
      className={`mr-1 inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${colorClase} ${className}`}
    >
      {textoMostrar}
    </span>
  )
}

export default InsigniaEstado
