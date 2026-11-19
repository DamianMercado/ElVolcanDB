import { useNavigate } from 'react-router-dom'

export function EstadoVacio({
  titulo,
  descripcion,
  textoBoton = 'Ir al Catálogo de Productos',
  destino = '/productos',
  alAccionar,
  variante = 'claro',
}) {
  const navigate = useNavigate()
  const esOscuro = variante === 'oscuro' || variante === 'dark'

  const contenedorClase = esOscuro
    ? 'rounded-xl border border-white/15 bg-white/5 px-6 py-10 text-center text-white'
    : 'rounded-xl border border-stone-200 bg-white px-6 py-12 text-center text-stone-800 shadow-sm'

  const ejecutarAccion = () => {
    if (alAccionar) {
      alAccionar()
    } else {
      navigate(destino)
    }
  }

  return (
    <div className={contenedorClase}>
      {titulo && <h2 className="text-lg font-bold">{titulo}</h2>}
      {descripcion && (
        <p
          className={`mt-1.5 text-sm ${
            esOscuro ? 'text-white/75' : 'text-stone-600'
          }`}
        >
          {descripcion}
        </p>
      )}
      <button
        type="button"
        onClick={ejecutarAccion}
        className="mt-5 inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#FF4500] px-5 py-2.5 text-sm font-bold text-white shadow transition hover:bg-[#e03d00]"
      >
        {textoBoton}
      </button>
    </div>
  )
}

export default EstadoVacio
