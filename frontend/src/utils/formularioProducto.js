export const VALORES_INICIALES_PRODUCTO = {
  codigo: '',
  nombre: '',
  descripcion: '',
  precio: '',
  stock: '0',
  minimo: '15',
  categoria: 'Cilindros',
  imagen: '',
}

export const CATEGORIAS_PRODUCTO = [
  { valor: 'Cilindros', etiqueta: 'Cilindros de Gas' },
  { valor: 'Reguladores', etiqueta: 'Reguladores' },
  { valor: 'Mangueras', etiqueta: 'Mangueras' },
  { valor: 'Accesorios', etiqueta: 'Accesorios' },
  { valor: 'Kits', etiqueta: 'Kits de Conexión' },
]

export const textoNumero = (valor) => {
  if (valor === null || valor === undefined) return ''
  const numero = Number(valor)
  return Number.isNaN(numero) ? String(valor) : String(numero)
}

export const aValoresFormularioProducto = (producto = {}) => ({
  codigo: producto.codigo || '',
  nombre: producto.nombre || '',
  descripcion: producto.descripcion || '',
  precio: textoNumero(producto.precio ?? ''),
  stock: textoNumero(producto.stock ?? '0'),
  minimo: textoNumero(producto.minimo ?? '15'),
  categoria: producto.categoria || 'Cilindros',
  imagen: producto.imagen || '',
})

export const payloadProducto = (form = {}) => {
  const stockNum = Number(String(form.stock ?? '0').trim())
  const minimoNum = Number(String(form.minimo ?? '15').trim())
  const precioNum = Number(
    String(form.precio ?? '0')
      .trim()
      .replace(',', '.')
  )

  return {
    codigo: (form.codigo || '').trim().toUpperCase(),
    imagen: (form.imagen || '').trim(),
    nombre: (form.nombre || '').trim(),
    categoria: (form.categoria || 'Cilindros').trim(),
    descripcion: (form.descripcion || '').trim(),
    stock: Number.isNaN(stockNum) ? 0 : stockNum,
    minimo: Number.isNaN(minimoNum) ? 15 : minimoNum,
    precio: Number.isNaN(precioNum) ? 0 : Number(precioNum.toFixed(2)),
  }
}

export const aPayloadProducto = payloadProducto
