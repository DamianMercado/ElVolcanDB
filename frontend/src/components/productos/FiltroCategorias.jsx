const CATEGORIAS_POR_DEFECTO = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'Cilindros', etiqueta: 'Cilindros' },
  { valor: 'Reguladores', etiqueta: 'Reguladores' },
  { valor: 'Mangueras', etiqueta: 'Mangueras' },
  { valor: 'Accesorios', etiqueta: 'Accesorios' },
  { valor: 'Kits', etiqueta: 'Kits' },
]

function IconoCategoria({ tipo, activa }) {
  const clave = String(tipo || '').toLowerCase()
  const acento = activa ? '#FFFFFF' : '#00A8E8'
  const acentoSuave = activa
    ? 'rgba(255, 255, 255, 0.22)'
    : 'rgba(0, 168, 232, 0.18)'

  const propsSvg = {
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: '1.8',
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    className: 'h-8 w-8 sm:h-9 sm:w-9',
    'aria-hidden': 'true',
  }

  switch (clave) {
    case 'todos':
      return (
        <svg {...propsSvg}>
          <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" />
          <rect
            x="13.5"
            y="3.5"
            width="7"
            height="7"
            rx="1.8"
            stroke={acento}
            fill={acentoSuave}
          />
          <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" />
          <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" />
        </svg>
      )

    case 'cilindros':
      return (
        <svg {...propsSvg}>
          <path d="M8.5 7V5a1.5 1.5 0 0 1 1.5-1.5h4A1.5 1.5 0 0 1 15.5 5v2" />
          <path d="M12 3.5V7" />
          <path d="M10.5 5.2h3" />
          <rect x="6.5" y="7" width="11" height="12.5" rx="3" />
          <path d="M8.5 19.5V21h7v-1.5" />
          <path
            d="M12 10.2c1.4 1.5 2.2 2.7 2.2 3.8a2.2 2.2 0 1 1-4.4 0c0-1.1.8-2.3 2.2-3.8Z"
            stroke={acento}
            fill={acentoSuave}
          />
        </svg>
      )

    case 'reguladores':
      return (
        <svg {...propsSvg}>
          <circle cx="12" cy="11.5" r="6" />
          <path d="M3 11.5h3" />
          <path d="M18 11.5h3" />
          <path d="M12 17.5v3" />
          <path d="M9.5 20.5h5" />
          <path d="M12 11.5l2.8-2.8" stroke={acento} />
          <circle cx="12" cy="11.5" r="1.4" fill={acento} stroke="none" />
        </svg>
      )

    case 'mangueras':
      return (
        <svg {...propsSvg}>
          <rect
            x="3.5"
            y="4.5"
            width="3.5"
            height="4"
            rx="0.8"
            stroke={acento}
            fill={acentoSuave}
          />
          <path d="M7 6.5h8.5a3 3 0 0 1 0 6h-7a3 3 0 0 0 0 6H17" />
          <rect
            x="17"
            y="16.5"
            width="3.5"
            height="4"
            rx="0.8"
            stroke={acento}
            fill={acentoSuave}
          />
        </svg>
      )

    case 'accesorios':
      return (
        <svg {...propsSvg}>
          <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.1-3.1a5.5 5.5 0 0 1-7.3 7.3l-6.4 6.4a2.2 2.2 0 0 1-3-3l6.4-6.4a5.5 5.5 0 0 1 7.3-7.3l-3.1 3.1Z" />
          <circle cx="5.6" cy="18.4" r="1.1" fill={acento} stroke="none" />
        </svg>
      )

    case 'kits':
      return (
        <svg {...propsSvg}>
          <path d="M9 7.5V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8v1.7" />
          <rect x="3.5" y="7.5" width="17" height="12.5" rx="2.2" />
          <path d="M3.5 12.5H10" />
          <path d="M14 12.5h6.5" />
          <rect
            x="10"
            y="10.8"
            width="4"
            height="3.4"
            rx="0.9"
            stroke={acento}
            fill={acentoSuave}
          />
        </svg>
      )

    default:
      return (
        <svg {...propsSvg}>
          <circle cx="12" cy="12" r="7.5" />
          <circle cx="12" cy="12" r="2.5" stroke={acento} fill={acentoSuave} />
        </svg>
      )
  }
}

export function FiltroCategorias({
  categorias = CATEGORIAS_POR_DEFECTO,
  categoriaActiva = 'todos',
  alCambiarCategoria,
}) {
  return (
    <div
      role="group"
      aria-label="Categorías de productos"
      className="w-full bg-gradient-to-b from-[#FFFFFF] via-[#F5F6F8] to-[#E2E6EC] px-4 py-5 shadow-[0_12px_28px_-12px_rgba(4,16,32,0.55)] sm:px-8 sm:py-6"
    >
      <div className="mx-auto grid max-w-6xl grid-cols-3 gap-x-3 gap-y-5 sm:grid-cols-6 sm:gap-x-6">
        {categorias.map((item) => {
          const valor = typeof item === 'string' ? item : item.valor
          const etiqueta = typeof item === 'string' ? item : item.etiqueta
          const activa =
            String(categoriaActiva).toLowerCase() ===
            String(valor).toLowerCase()
          return (
            <button
              key={valor}
              type="button"
              aria-pressed={activa}
              onClick={() => alCambiarCategoria && alCambiarCategoria(valor)}
              className="group flex cursor-pointer flex-col items-center gap-2.5 focus:outline-none"
            >
              <span
                className={`flex h-16 w-16 items-center justify-center rounded-full transition-all duration-200 sm:h-[76px] sm:w-[76px] ${
                  activa
                    ? 'bg-gradient-to-br from-[#FF6B35] via-[#FF4500] to-[#C93600] text-white shadow-[0_8px_18px_rgba(255,69,0,0.38)] ring-4 ring-[#FF4500]/20 group-focus-visible:ring-[#FF4500]/40'
                    : 'bg-gradient-to-br from-[#16426E] via-[#0A2540] to-[#06182B] text-white shadow-[0_6px_14px_rgba(10,37,64,0.28)] group-hover:-translate-y-0.5 group-hover:from-[#1D5388] group-hover:via-[#0F3358] group-hover:to-[#0A2540] group-hover:shadow-[0_10px_20px_rgba(10,37,64,0.35)] group-focus-visible:ring-4 group-focus-visible:ring-[#00A8E8]/40'
                }`}
              >
                <IconoCategoria tipo={valor} activa={activa} />
              </span>
              <span
                className={`text-center text-[11px] font-extrabold uppercase tracking-wider leading-tight transition-colors sm:text-xs ${
                  activa
                    ? 'text-[#FF4500]'
                    : 'text-[#0A2540] group-hover:text-[#FF4500]'
                }`}
              >
                {etiqueta}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default FiltroCategorias
