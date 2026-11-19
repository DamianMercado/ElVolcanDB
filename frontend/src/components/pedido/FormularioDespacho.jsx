import { Campo } from '../ui/Campo'

const estiloInputOscuro =
  'w-full rounded-lg border border-white/20 bg-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-white/45 outline-none focus:border-[#00A8E8] focus:ring-2 focus:ring-[#00A8E8]/25'

export function FormularioDespacho({
  nombreCliente,
  alCambiarNombre,
  telefonoCliente,
  alCambiarTelefono,
  direccion1,
  alCambiarDireccion1,
  direccion2,
  alCambiarDireccion2,
  comuna,
  alCambiarComuna,
}) {
  return (
    <div className="flex flex-col gap-3.5 pt-1">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Campo
          id="nombre-cliente"
          etiqueta="Nombre y Apellido"
          variante="oscuro"
        >
          <input
            type="text"
            id="nombre-cliente"
            placeholder="Ej: Juan Pérez"
            value={nombreCliente}
            onChange={(e) => alCambiarNombre(e.target.value)}
            className={estiloInputOscuro}
            required
          />
        </Campo>

        <Campo
          id="telefono-cliente"
          etiqueta="Teléfono de Contacto"
          variante="oscuro"
        >
          <input
            type="tel"
            id="telefono-cliente"
            placeholder="+56 9 1234 5678"
            value={telefonoCliente}
            onChange={(e) => alCambiarTelefono(e.target.value)}
            className={estiloInputOscuro}
            required
          />
        </Campo>
      </div>

      <Campo
        id="direccion-1"
        etiqueta="Calle y Número de Entrega"
        variante="oscuro"
      >
        <input
          type="text"
          id="direccion-1"
          placeholder="Ej: Av. Concha y Toro 1420"
          value={direccion1}
          onChange={(e) => alCambiarDireccion1(e.target.value)}
          className={estiloInputOscuro}
          required
        />
      </Campo>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Campo
          id="direccion-2"
          etiqueta="Depto / Block (Opcional)"
          variante="oscuro"
        >
          <input
            type="text"
            id="direccion-2"
            placeholder="Ej: Depto 302, Torre B"
            value={direccion2}
            onChange={(e) => alCambiarDireccion2(e.target.value)}
            className={estiloInputOscuro}
          />
        </Campo>

        <Campo
          id="comuna-despacho"
          etiqueta="Comuna / Ciudad"
          variante="oscuro"
        >
          <input
            type="text"
            id="comuna-despacho"
            placeholder="Ej: Puente Alto, La Florida"
            value={comuna}
            onChange={(e) => alCambiarComuna(e.target.value)}
            className={estiloInputOscuro}
            required
          />
        </Campo>
      </div>
    </div>
  )
}

export default FormularioDespacho
