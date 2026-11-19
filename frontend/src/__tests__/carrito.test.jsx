import { describe, it, expect, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CarritoProvider, useCarrito } from "../context/Carrito.jsx";

// Componente auxiliar para probar la interacción y manipulación del DOM con el carrito
function ComponentePruebaCarrito() {
  const {
    carrito,
    agregarAlCarrito,
    aumentarCantidad,
    disminuirCantidad,
    eliminarDelCarrito,
    limpiarCarrito,
    total,
  } = useCarrito();

  const productoPrueba = {
    codigo: "CL001",
    nombre: "Cilindro 15 kg",
    precio: 20000,
    stock: 10,
  };

  const productoPrueba2 = {
    codigo: "CL002",
    nombre: "Cilindro 45 kg",
    precio: 45000,
    stock: 5,
  };

  return (
    <div>
      <div data-testid="cart-total">{total}</div>
      <div data-testid="cart-count">{carrito.length}</div>

      <button
        data-testid="btn-add-1"
        onClick={() => agregarAlCarrito(productoPrueba)}
      >
        Agregar 15kg
      </button>

      <button
        data-testid="btn-add-2"
        onClick={() => agregarAlCarrito(productoPrueba2)}
      >
        Agregar 45kg
      </button>

      <button
        data-testid="btn-inc-1"
        onClick={() => aumentarCantidad(productoPrueba.codigo)}
      >
        Aumentar 15kg
      </button>

      <button
        data-testid="btn-dec-1"
        onClick={() => disminuirCantidad(productoPrueba.codigo)}
      >
        Disminuir 15kg
      </button>

      <button
        data-testid="btn-remove-1"
        onClick={() => eliminarDelCarrito(productoPrueba.codigo)}
      >
        Eliminar 15kg
      </button>

      <button data-testid="btn-clear" onClick={() => limpiarCarrito()}>
        Limpiar Carrito
      </button>

      <ul data-testid="cart-items">
        {carrito.map((item) => (
          <li key={item.producto.codigo} data-testid={`item-${item.producto.codigo}`}>
            {item.producto.nombre} - Cantidad: {item.cantidad} - Subtotal: {item.producto.precio * item.cantidad}
          </li>
        ))}
      </ul>
    </div>
  );
}

describe("Pruebas Unitarias - Lógica de Negocio y DOM: Carrito de Compras", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("1. El carrito inicia vacío con total $0", () => {
    render(
      <CarritoProvider>
        <ComponentePruebaCarrito />
      </CarritoProvider>
    );

    expect(screen.getByTestId("cart-total").textContent).toBe("0");
    expect(screen.getByTestId("cart-count").textContent).toBe("0");
  });

  it("2. Agregar productos calcula correctamente la cantidad y el total acumulado", () => {
    render(
      <CarritoProvider>
        <ComponentePruebaCarrito />
      </CarritoProvider>
    );

    const btnAdd1 = screen.getByTestId("btn-add-1");
    fireEvent.click(btnAdd1);

    expect(screen.getByTestId("cart-count").textContent).toBe("1");
    expect(screen.getByTestId("cart-total").textContent).toBe("20000");

    // Agregar segundo producto diferente
    const btnAdd2 = screen.getByTestId("btn-add-2");
    fireEvent.click(btnAdd2);

    expect(screen.getByTestId("cart-count").textContent).toBe("2");
    expect(screen.getByTestId("cart-total").textContent).toBe("65000");
  });

  it("3. Aumentar y disminuir cantidades actualiza el total en el DOM y elimina al llegar a 0", () => {
    render(
      <CarritoProvider>
        <ComponentePruebaCarrito />
      </CarritoProvider>
    );

    const btnAdd1 = screen.getByTestId("btn-add-1");
    fireEvent.click(btnAdd1); // 1 unidad de 15kg ($20.000)

    const btnInc1 = screen.getByTestId("btn-inc-1");
    fireEvent.click(btnInc1); // 2 unidades ($40.000)

    expect(screen.getByTestId("cart-total").textContent).toBe("40000");
    expect(screen.getByTestId("item-CL001").textContent).toContain("Cantidad: 2");

    const btnDec1 = screen.getByTestId("btn-dec-1");
    fireEvent.click(btnDec1); // 1 unidad ($20.000)
    expect(screen.getByTestId("cart-total").textContent).toBe("20000");

    fireEvent.click(btnDec1); // 0 unidades -> se elimina automáticamente
    expect(screen.getByTestId("cart-total").textContent).toBe("0");
    expect(screen.getByTestId("cart-count").textContent).toBe("0");
  });

  it("4. Eliminar producto específico y limpiar carrito restablece el estado", () => {
    render(
      <CarritoProvider>
        <ComponentePruebaCarrito />
      </CarritoProvider>
    );

    fireEvent.click(screen.getByTestId("btn-add-1"));
    fireEvent.click(screen.getByTestId("btn-add-2"));
    expect(screen.getByTestId("cart-count").textContent).toBe("2");

    // Eliminar solo el producto 1
    fireEvent.click(screen.getByTestId("btn-remove-1"));
    expect(screen.getByTestId("cart-count").textContent).toBe("1");
    expect(screen.getByTestId("cart-total").textContent).toBe("45000");

    // Limpiar todo el carrito
    fireEvent.click(screen.getByTestId("btn-clear"));
    expect(screen.getByTestId("cart-count").textContent).toBe("0");
    expect(screen.getByTestId("cart-total").textContent).toBe("0");
  });
});

