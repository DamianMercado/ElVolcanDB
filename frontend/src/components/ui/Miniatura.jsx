import { useEffect, useState } from 'react'

export const Miniatura = ({
  src,
  nombre = '',
  alt = '',
  className = 'h-12 w-12',
}) => {
  const [falla, setFalla] = useState(false)

  useEffect(() => {
    setFalla(false)
  }, [src])

  const clases = `shrink-0 rounded-md bg-white border border-stone-200 object-contain p-1 ${className}`

  if (!src || falla) {
    return (
      <div
        className={`${clases} grid place-items-center bg-stone-100 text-[10px] font-semibold uppercase tracking-wide text-stone-500`}
        aria-hidden
      >
        img
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt || nombre}
      title={nombre || src}
      className={clases}
      onError={() => setFalla(true)}
    />
  )
}

export default Miniatura
