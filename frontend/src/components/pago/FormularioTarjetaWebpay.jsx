import { formatearPesos } from '../../utils/formato.js'

export function FormularioTarjetaWebpay({
  email,
  alCambiarEmail,
  nombreTitular,
  alCambiarTitular,
  numeroTarjeta,
  alCambiarNumeroTarjeta,
  expiracion,
  alCambiarExpiracion,
  cvv,
  alCambiarCvv,
  total,
  procesando,
  alEnviar,
  children,
}) {
  return (
    <form onSubmit={alEnviar} className="flex flex-col gap-5">
      {/* Campo 1: Correo Electrónico */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="checkout-email"
          className="text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
          Correo Electrónico
        </label>
        <div className="relative flex items-center">
          <svg
            className="pointer-events-none absolute left-3.5 h-4 w-4 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
          <input
            id="checkout-email"
            type="email"
            className="w-full rounded-lg border border-slate-300 bg-white py-3 pr-4 pl-10 text-sm text-slate-900 transition focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/20 focus:outline-none"
            value={email}
            onChange={(e) => alCambiarEmail(e.target.value)}
            placeholder="cliente@correo.cl"
            required
          />
        </div>
      </div>

      {/* Campo 2: Nombre del Titular */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="checkout-titular"
          className="text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
          Nombre del Titular
        </label>
        <input
          id="checkout-titular"
          type="text"
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/20 focus:outline-none"
          value={nombreTitular}
          onChange={(e) => alCambiarTitular(e.target.value.toUpperCase())}
          placeholder="Nombre y Apellido del Titular"
          required
        />
      </div>

      {/* Campo 3: Número de tarjeta con sellos */}
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="checkout-card-number"
          className="text-xs font-semibold uppercase tracking-wider text-slate-500"
        >
          Número de Tarjeta
        </label>
        <div className="relative flex items-center">
          <input
            id="checkout-card-number"
            type="text"
            className="w-full rounded-lg border border-slate-300 bg-white py-3 pr-36 pl-4 font-mono text-sm tracking-wider text-slate-900 transition focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/20 focus:outline-none"
            value={numeroTarjeta}
            onChange={(e) => alCambiarNumeroTarjeta(e.target.value)}
            placeholder="1234 1234 1234 1234"
            maxLength={19}
            required
          />
          <div className="pointer-events-none absolute right-2.5 flex items-center gap-1">
            <span className="rounded bg-blue-900 px-1.5 py-0.5 text-[9px] font-bold text-white">
              VISA
            </span>
            <span className="rounded bg-orange-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
              MC
            </span>
            <span className="rounded bg-sky-600 px-1.5 py-0.5 text-[9px] font-bold text-white">
              AMEX
            </span>
            <span className="rounded bg-red-700 px-1.5 py-0.5 text-[9px] font-bold text-white">
              REDCOMPRA
            </span>
          </div>
        </div>
      </div>

      {/* Campo 4: Vencimiento & CVC */}
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="checkout-exp"
            className="text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            Vencimiento
          </label>
          <input
            id="checkout-exp"
            type="text"
            className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-900 transition focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/20 focus:outline-none"
            value={expiracion}
            onChange={(e) => alCambiarExpiracion(e.target.value)}
            placeholder="MM / AA"
            maxLength={5}
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="checkout-cvc"
            className="text-xs font-semibold uppercase tracking-wider text-slate-500"
          >
            CVC
          </label>
          <div className="relative flex items-center">
            <input
              id="checkout-cvc"
              type="password"
              className="w-full rounded-lg border border-slate-300 bg-white py-3 pr-12 pl-4 text-sm text-slate-900 transition focus:border-[#009688] focus:ring-2 focus:ring-[#009688]/20 focus:outline-none"
              value={cvv}
              onChange={(e) => alCambiarCvv(e.target.value)}
              placeholder="CVC"
              maxLength={4}
              required
            />
            <span className="pointer-events-none absolute right-3 rounded border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500">
              123
            </span>
          </div>
        </div>
      </div>

      {/* Botón Principal */}
      <button
        type="submit"
        className="mt-1 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-[#009688] py-3.5 text-base font-bold text-white shadow-md transition hover:bg-[#00796B] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={procesando}
      >
        {procesando ? (
          <span className="flex items-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            Procesando pago seguro...
          </span>
        ) : (
          `Pagar ${formatearPesos(total)}`
        )}
      </button>

      {/* Nota de Seguridad */}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
        <svg
          className="h-3.5 w-3.5 text-emerald-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
        <span>Pago seguro respaldado por Webpay Plus</span>
      </div>

      {children}
    </form>
  )
}

export default FormularioTarjetaWebpay
