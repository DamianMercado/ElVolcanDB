import { estadoStock, formatearPesos } from '../../utils/formato.js'

export function TarjetasResumen({ productos, pedidos, solicitudes }) {
  const valorInventario = productos.reduce(
    (total, p) => total + p.stock * p.precio,
    0
  )
  const unidades = productos.reduce((total, p) => total + p.stock, 0)
  const stockBajo = productos.filter((p) => estadoStock(p) !== 'OK').length
  const porEntregar = pedidos.filter((p) => p.estado !== 'Entregado').length
  const sinAsignar = pedidos.filter((p) => p.estado === 'Pendiente').length
  const entregados = pedidos.filter((p) => p.estado === 'Entregado').length
  const enCurso = solicitudes.filter((s) => s.estado === 'Pendiente').length

  return (
    <div className="mb-5 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex flex-col gap-1 rounded-[10px] border-l-[5px] border-[#2358b9] bg-white p-4 shadow-sm">
        <span className="text-[13px] text-[#5b6776]">Valor del inventario</span>
        <strong className="text-2xl font-bold text-[#1d3963]">
          {formatearPesos(valorInventario)}
        </strong>
        <small className="text-xs text-[#6e7a89]">
          {unidades} unidades en bodega
        </small>
      </div>

      <div
        className={`flex flex-col gap-1 rounded-[10px] border-l-[5px] bg-white p-4 shadow-sm ${
          stockBajo > 0 ? 'border-[#d9534f]' : 'border-[#2358b9]'
        }`}
      >
        <span className="text-[13px] text-[#5b6776]">
          Productos con stock bajo
        </span>
        <strong
          className={`text-2xl font-bold ${
            stockBajo > 0 ? 'text-[#d9534f]' : 'text-[#1d3963]'
          }`}
        >
          {stockBajo}
        </strong>
        <small className="text-xs text-[#6e7a89]">
          de {productos.length} productos
        </small>
      </div>

      <div className="flex flex-col gap-1 rounded-[10px] border-l-[5px] border-[#2358b9] bg-white p-4 shadow-sm">
        <span className="text-[13px] text-[#5b6776]">Pedidos por entregar</span>
        <strong className="text-2xl font-bold text-[#1d3963]">
          {porEntregar}
        </strong>
        <small className="text-xs text-[#6e7a89]">
          {sinAsignar} sin repartidor asignado
        </small>
      </div>

      <div className="flex flex-col gap-1 rounded-[10px] border-l-[5px] border-[#2358b9] bg-white p-4 shadow-sm">
        <span className="text-[13px] text-[#5b6776]">Pedidos entregados</span>
        <strong className="text-2xl font-bold text-[#1d3963]">
          {entregados}
        </strong>
        <small className="text-xs text-[#6e7a89]">
          {enCurso} solicitudes de stock en curso
        </small>
      </div>
    </div>
  )
}

export default TarjetasResumen
