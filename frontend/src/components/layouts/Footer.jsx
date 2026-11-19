export const Footer = () => {
  return (
    <footer className="mt-auto bg-[#0A2540] pt-12 text-white/80 print:hidden">
      <div className="mx-auto grid max-w-[1200px] grid-cols-1 gap-8 px-6 pb-9 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <div className="mb-3 flex items-center gap-2 text-xl font-bold text-white">
            <span>El Volcán</span>
          </div>
          <p className="text-sm leading-relaxed text-white/60">
            Distribuidora de gas comprometida con la seguridad y calidad de servicio.
          </p>
        </div>

        <div>
          <h4 className="mb-3.5 text-sm font-bold uppercase tracking-wider text-[#00A8E8]">
            Contacto
          </h4>
          <p className="text-sm leading-loose text-white/70">+56 9 1234 5678</p>
          <p className="text-sm leading-loose text-white/70">contacto@elvolcan.cl</p>
          <p className="text-sm leading-loose text-white/70">Chile</p>
        </div>

        <div>
          <h4 className="mb-3.5 text-sm font-bold uppercase tracking-wider text-[#00A8E8]">
            Servicios
          </h4>
          <ul className="list-none space-y-2 text-sm text-white/70">
            <li>Pedidos de Gas</li>
            <li>Seguimiento</li>
            <li>Atención al Cliente</li>
          </ul>
        </div>

        <div>
          <h4 className="mb-3.5 text-sm font-bold uppercase tracking-wider text-[#00A8E8]">
            Legal
          </h4>
          <ul className="list-none space-y-2 text-sm text-white/70">
            <li>Términos y Condiciones</li>
            <li>Política de Privacidad</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 px-6 py-4 text-center text-xs text-white/45">
        <p>© 2026 El Volcán. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}

export default Footer
