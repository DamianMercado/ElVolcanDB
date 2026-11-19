import { Link } from 'react-router-dom'

export function TarjetaDireccionCuenta({
  usuario,
  usarDirCuenta,
  alCambiarUsarDirCuenta,
}) {
  if (!usuario || !usuario.direccion) {
    return (
      <div className="mb-4 rounded-lg border border-[#00A8E8]/35 bg-[#00A8E8]/10 px-4 py-3 text-xs text-white/90">
        ¿Tienes cuenta?{' '}
        <Link
          to="/login"
          className="font-bold text-[#00A8E8] underline hover:text-white"
        >
          Inicia sesión aquí
        </Link>{' '}
        para autocompletar tu dirección. O ingresa tus datos a continuación:
      </div>
    )
  }

  return (
    <div className="mb-4 rounded-xl border border-[#00A8E8]/40 bg-white/5 p-4">
      <div className="flex items-center gap-2.5">
        <input
          type="checkbox"
          id="usar-dir"
          checked={usarDirCuenta}
          onChange={(e) => alCambiarUsarDirCuenta(e.target.checked)}
          className="h-4 w-4 accent-[#FF4500]"
        />
        <label
          htmlFor="usar-dir"
          className="cursor-pointer text-sm font-bold text-white"
        >
          Usar mi dirección registrada de cuenta
        </label>
      </div>

      {usarDirCuenta && (
        <div className="mt-3 rounded-lg border border-white/10 bg-[#0A2540]/60 p-3">
          <div className="grid grid-cols-1 gap-2.5 text-xs sm:grid-cols-2">
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#00A8E8]">
                Cliente
              </span>
              <span className="font-semibold text-white">
                {usuario.nombres || usuario.nombre} {usuario.apellidos || ''}
              </span>
            </div>
            <div>
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#00A8E8]">
                Teléfono
              </span>
              <span className="font-semibold text-white">
                {usuario.telefono || 'No especificado'}
              </span>
            </div>
            {usuario.rut && (
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#00A8E8]">
                  RUT
                </span>
                <span className="font-semibold text-white">{usuario.rut}</span>
              </div>
            )}
            {usuario.email && (
              <div>
                <span className="block text-[10px] font-bold uppercase tracking-wider text-[#00A8E8]">
                  Correo Electrónico
                </span>
                <span className="font-semibold text-white">
                  {usuario.email}
                </span>
              </div>
            )}
            <div className="sm:col-span-2">
              <span className="block text-[10px] font-bold uppercase tracking-wider text-[#00A8E8]">
                Dirección de Entrega
              </span>
              <span className="font-bold text-white">
                {usuario.direccion}
                {usuario.depto ? `, Depto/Block ${usuario.depto}` : ''},{' '}
                {usuario.comuna || 'Santiago'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default TarjetaDireccionCuenta
