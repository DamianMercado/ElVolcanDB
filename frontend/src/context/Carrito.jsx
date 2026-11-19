/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react'

export const CarritoContext = createContext()

export function CarritoProvider({ children }) {
  const [carrito, setCarrito] = useState(() => {
    const carritoGuardado =
      localStorage.getItem('carrito_compras') ||
      localStorage.getItem('shopping_cart')
    return carritoGuardado ? JSON.parse(carritoGuardado) : []
  })

  const [avisoStock, setAvisoStock] = useState('')

  useEffect(() => {
    localStorage.setItem('carrito_compras', JSON.stringify(carrito))
  }, [carrito])

  const limpiarAvisoStock = () => setAvisoStock('')

  const agregarAlCarrito = (producto) => {
    setAvisoStock('')
    setCarrito((carritoPrevio) => {
      const existe = carritoPrevio.find(
        (item) => item.producto.codigo === producto.codigo,
      )
      if (existe) {
        if (existe.cantidad >= producto.stock) {
          setAvisoStock(
            `Stock máximo disponible alcanzado para ${producto.nombre} (${producto.stock} unidades)`,
          )
          return carritoPrevio
        }
        return carritoPrevio.map((item) =>
          item.producto.codigo === producto.codigo
            ? { ...item, cantidad: item.cantidad + 1 }
            : item,
        )
      } else {
        return [...carritoPrevio, { producto, cantidad: 1 }]
      }
    })
  }

  const aumentarCantidad = (codigo) => {
    setAvisoStock('')
    setCarrito((carritoPrevio) =>
      carritoPrevio.map((item) => {
        if (item.producto.codigo === codigo) {
          if (item.cantidad >= item.producto.stock) {
            setAvisoStock(
              `Stock máximo disponible alcanzado (${item.producto.stock} unidades)`,
            )
            return item
          }
          return { ...item, cantidad: item.cantidad + 1 }
        }
        return item
      }),
    )
  }

  const disminuirCantidad = (codigo) => {
    setAvisoStock('')
    setCarrito((carritoPrevio) =>
      carritoPrevio
        .map((item) =>
          item.producto.codigo === codigo
            ? { ...item, cantidad: item.cantidad - 1 }
            : item,
        )
        .filter((item) => item.cantidad > 0),
    )
  }

  const eliminarDelCarrito = (codigo) => {
    setAvisoStock('')
    setCarrito((carritoPrevio) =>
      carritoPrevio.filter((item) => item.producto.codigo !== codigo),
    )
  }

  const limpiarCarrito = () => {
    setAvisoStock('')
    setCarrito([])
  }

  const total = carrito.reduce(
    (acumulado, item) => acumulado + item.producto.precio * item.cantidad,
    0,
  )

  const cantidadTotal = carrito.reduce(
    (acumulado, item) => acumulado + item.cantidad,
    0,
  )

  return (
    <CarritoContext.Provider
      value={{
        carrito,
        agregarAlCarrito,
        aumentarCantidad,
        disminuirCantidad,
        eliminarDelCarrito,
        limpiarCarrito,
        total,
        cantidadTotal,
        avisoStock,
        limpiarAvisoStock,
      }}
    >
      {children}
    </CarritoContext.Provider>
  )
}

export function useCarrito() {
  return useContext(CarritoContext)
}

export default CarritoProvider
