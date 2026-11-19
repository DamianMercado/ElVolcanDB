export const Campo = ({
  id,
  name,
  type = 'text',
  as = 'input',
  etiqueta,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  min,
  max,
  step,
  rows = 3,
  variante = 'claro',
  error = '',
  className = '',
  children,
  ...rest
}) => {
  const esOscuro = variante === 'oscuro' || variante === 'dark'

  const claseEtiqueta = esOscuro
    ? 'mb-1.5 block text-xs font-semibold tracking-wide text-white/90'
    : 'mb-1.5 block text-sm font-medium text-[#2d3e50]'

  const claseInput = esOscuro
    ? 'w-full rounded-lg border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder-white/45 transition focus:border-[#00A8E8] focus:ring-2 focus:ring-[#00A8E8]/25 focus:outline-none disabled:opacity-60'
    : 'w-full rounded-lg border border-[#c5d1e0] bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 transition focus:border-[#2358b9] focus:ring-2 focus:ring-[#2358b9]/20 focus:outline-none disabled:bg-slate-100'

  const renderControl = () => {
    if (as === 'select') {
      return (
        <select
          id={id}
          name={name || id}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={claseInput}
          {...rest}
        >
          {children}
        </select>
      )
    }

    if (as === 'textarea') {
      return (
        <textarea
          id={id}
          name={name || id}
          rows={rows}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          className={claseInput}
          {...rest}
        />
      )
    }

    if (children) {
      return children
    }

    return (
      <input
        id={id}
        name={name || id}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        min={min}
        max={max}
        step={step}
        className={claseInput}
        {...rest}
      />
    )
  }

  return (
    <div className={className}>
      {etiqueta && (
        <label htmlFor={id} className={claseEtiqueta}>
          {etiqueta}
        </label>
      )}
      {renderControl()}
      {error ? (
        <p className="mt-1 text-xs font-medium text-red-600" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}

export default Campo
