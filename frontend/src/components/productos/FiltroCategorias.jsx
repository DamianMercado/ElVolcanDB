const CATEGORIAS_POR_DEFECTO = [
  { valor: 'todos', etiqueta: 'Todos' },
  { valor: 'Cilindros', etiqueta: 'Cilindros' },
  { valor: 'Reguladores', etiqueta: 'Reguladores' },
  { valor: 'Mangueras', etiqueta: 'Mangueras' },
  { valor: 'Accesorios', etiqueta: 'Accesorios' },
  { valor: 'Kits', etiqueta: 'Kits' },
]

export function FiltroCategorias({
  categorias = CATEGORIAS_POR_DEFECTO,
  categoriaActiva = 'todos',
  alCambiarCategoria,
}) {
  return (
    <div className="mb-6 flex flex-wrap items-center justify-center gap-2">
      {categorias.map((item) => {
        const valor = typeof item === 'string' ? item : item.valor
        const etiqueta = typeof item === 'string' ? item : item.etiqueta
        const activa =
          String(categoriaActiva).toLowerCase() === String(valor).toLowerCase()
        return (
          <button
            key={valor}
            type="button"
            onClick={() => alCambiarCategoria && alCambiarCategoria(valor)}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-xs font-bold transition ${
              activa
                ? 'bg-[#FF4500] text-white shadow-sm'
                : 'border border-white/25 bg-white/10 text-white/85 hover:bg-white/20 hover:text-white'
            }`}
          >
            {etiqueta}
          </button>
        )
      })}
    </div>
  )
}

export default FiltroCategorias
