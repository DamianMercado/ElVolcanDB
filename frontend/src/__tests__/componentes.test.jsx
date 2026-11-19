import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CarritoProvider } from "../context/Carrito.jsx";
import { Navbar } from "../components/layouts/Navbar.jsx";
import { Footer } from "../components/layouts/Footer.jsx";
import { Productos } from "../pages/Productos.jsx";
import { IniciarSesion } from "../pages/IniciarSesion.jsx";
import { RecuperarContrasena } from "../pages/RecuperarContrasena.jsx";
import { AdminProductosLista } from "../pages/AdminProductosLista.jsx";
import { AdminProductoFormulario } from "../pages/AdminProductoFormulario.jsx";
import { guardarSesion } from "../utils/token.js";

const PRODUCTOS_API_MOCK = [
  {
    id: 6,
    codigo: "CL003",
    nombre: "Cilindro gas licuado 15 kg",
    descripcion: "Recarga de cilindro de gas licuado de 15 kg de alto rendimiento para el hogar",
    precio: 31990,
    stock: 25,
    minimo: 30,
    categoria: "Cilindros",
    imagen: "https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/CL003.webp",
  },
];

describe("Pruebas Unitarias - Comportamiento de Componentes y Manipulación del DOM", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("12. Navbar: Renderiza botones de invitado ('Ingresar' y 'Registrarse') cuando no hay sesión activa", () => {
    render(
      <CarritoProvider>
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      </CarritoProvider>
    );

    expect(screen.getAllByText("Ingresar").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Registrarse").length).toBeGreaterThan(0);
  });

  it("13. Navbar: Renderiza el nombre del cliente y botón 'Cerrar sesión' cuando hay sesión, y al hacer clic cierra la sesión en el DOM", () => {
    guardarSesion({
      nombres: "Eduardo",
      apellidos: "Pérez",
      email: "eduardo@correo.cl",
      rol: "cliente",
    });

    render(
      <CarritoProvider>
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      </CarritoProvider>
    );

    expect(screen.getByText("Eduardo Pérez")).toBeInTheDocument();

    const btnCerrarSesion = screen.getByRole("button", { name: "Cerrar sesión" });
    expect(btnCerrarSesion).toBeInTheDocument();

    fireEvent.click(btnCerrarSesion);

    expect(screen.queryByText("Eduardo Pérez")).not.toBeInTheDocument();
    expect(screen.getAllByText("Ingresar").length).toBeGreaterThan(0);
  });

  it("14. Productos: Renderiza el catálogo de productos obtenido del backend con sus nombres, precios y botones para agregar al carrito", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => PRODUCTOS_API_MOCK,
    });

    render(
      <CarritoProvider>
        <MemoryRouter>
          <Productos />
        </MemoryRouter>
      </CarritoProvider>
    );

    expect(screen.getByText("Nuestros Productos")).toBeInTheDocument();
    expect(await screen.findByText("Cilindro gas licuado 15 kg")).toBeInTheDocument();

    const botonesAgregar = screen.getAllByRole("button", { name: /Agregar/i });
    expect(botonesAgregar.length).toBeGreaterThan(0);
  });

  it("15. IniciarSesion: Valida los campos y manipula el DOM mostrando alerta ante credenciales incorrectas del backend", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ mensaje: "Correo o contraseña incorrectos" }),
    });

    render(
      <MemoryRouter>
        <IniciarSesion />
      </MemoryRouter>
    );

    const emailInput = screen.getByPlaceholderText("tu@correo.com");
    const passInput = screen.getByPlaceholderText("Contraseña");
    const submitBtn = screen.getByRole("button", { name: "Iniciar Sesión" });

    fireEvent.change(emailInput, { target: { value: "usuario_falso@correo.cl" } });
    fireEvent.change(passInput, { target: { value: "clave_erronea_123" } });
    fireEvent.click(submitBtn);

    const alertaError = await screen.findByText("Correo o contraseña incorrectos");
    expect(alertaError).toBeInTheDocument();
  });

  it("16. Footer: Muestra los textos informativos sin etiquetas de redirección href", () => {
    const { container } = render(<Footer />);
    expect(screen.getByText("Pedidos de Gas")).toBeInTheDocument();
    expect(screen.getByText("Términos y Condiciones")).toBeInTheDocument();
    expect(container.querySelectorAll("a[href]").length).toBe(0);
  });

  it("17. RecuperarContrasena: Renderiza la vista de recuperación de contraseña y enlace de retorno a Login", () => {
    render(
      <MemoryRouter>
        <RecuperarContrasena />
      </MemoryRouter>
    );

    expect(screen.getByText("Recuperar Contraseña")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Restablecer Contraseña/i })).toBeInTheDocument();
    expect(screen.getByText(/Volver a Iniciar Sesión/i)).toBeInTheDocument();
  });

  it("18. AdminProductosLista (Vista 1 Admin CRUD): Lista los productos del backend y permite confirmar eliminación en línea", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => PRODUCTOS_API_MOCK,
    });

    render(
      <MemoryRouter>
        <AdminProductosLista />
      </MemoryRouter>
    );

    expect(screen.getByText("Gestión de Productos del Catálogo")).toBeInTheDocument();
    expect(await screen.findByText("Cilindro gas licuado 15 kg")).toBeInTheDocument();

    const botonesEliminar = screen.getAllByRole("button", { name: "Eliminar" });
    expect(botonesEliminar.length).toBeGreaterThan(0);

    fireEvent.click(botonesEliminar[0]);
    expect(screen.getByText("¿Eliminar?")).toBeInTheDocument();
  });

  it("19. AdminProductoFormulario (Vista 2 Admin CRUD): Renderiza el formulario de creación de producto con vista previa", () => {
    render(
      <MemoryRouter>
        <AdminProductoFormulario />
      </MemoryRouter>
    );

    expect(screen.getByText("Crear Nuevo Producto")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Crear producto/i })).toBeInTheDocument();
    expect(screen.getByText("Vista Previa de Tarjeta")).toBeInTheDocument();
  });
});
