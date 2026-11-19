export function AccionesUsuarioNav({
  usuario,
  alIrA,
  alCerrarSesion,
  esMovil = false,
}) {
  const nombreVisible = usuario
    ? `${usuario.nombres || usuario.nombre || ''} ${usuario.apellidos || ''}`.trim()
    : ''

  if (esMovil) {
    return (
      <div className="flex flex-col gap-2 border-t border-white/15 pt-3">
        {usuario ? (
          <div className="flex flex-col gap-2">
            <span className="px-3.5 py-1.5 text-sm font-semibold text-white">
              {nombreVisible}
            </span>
            <button
              type="button"
              onClick={alCerrarSesion}
              className="w-full cursor-pointer rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-red-300"
            >
              Cerrar sesión
            </button>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => alIrA('/login')}
              className="w-full cursor-pointer rounded-lg px-3.5 py-2.5 text-left text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
            >
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => alIrA('/register')}
              className="w-full cursor-pointer rounded-lg bg-[#FF4500] py-2.5 text-center text-sm font-semibold text-white shadow transition hover:bg-[#e03d00]"
            >
              Registrarse
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 border-l border-white/15 pl-3">
      {usuario ? (
        <div className="flex items-center gap-2">
          <span
            className="px-2 py-1.5 text-sm font-semibold whitespace-nowrap text-white select-none"
            title={usuario.email || usuario.correo || 'Cliente'}
          >
            {nombreVisible}
          </span>
          <button
            type="button"
            onClick={alCerrarSesion}
            className="cursor-pointer rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap text-white/85 transition hover:bg-white/10 hover:text-red-300"
            title="Cerrar sesión"
          >
            Cerrar sesión
          </button>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => alIrA('/login')}
            className="cursor-pointer rounded-lg px-3.5 py-2 text-sm font-medium text-white/85 transition hover:bg-white/10 hover:text-white"
          >
            Ingresar
          </button>
          <button
            type="button"
            onClick={() => alIrA('/register')}
            className="cursor-pointer rounded-lg bg-[#FF4500] px-4 py-2 text-sm font-semibold text-white shadow transition hover:bg-[#e03d00]"
          >
            Registrarse
          </button>
        </>
      )}
    </div>
  )
}

export default AccionesUsuarioNav
