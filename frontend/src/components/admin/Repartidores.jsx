import { TarjetaRepartidor } from './TarjetaRepartidor.jsx'

export function Repartidores({ repartidores, pedidos }) {
  return (
    <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
      {repartidores.map((repartidor) => (
        <TarjetaRepartidor
          key={repartidor.nombre}
          repartidor={repartidor}
          pedidos={pedidos}
        />
      ))}
    </div>
  )
}

export default Repartidores
