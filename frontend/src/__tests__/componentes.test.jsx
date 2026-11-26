import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { CarritoProvider } from "../context/Carrito.jsx";
import { SesionProvider } from "../context/Sesion.jsx";
import { Navbar } from "../components/layouts/Navbar.jsx";
import { Footer } from "../components/layouts/Footer.jsx";
import { Inicio } from "../pages/Inicio.jsx";
import { Productos } from "../pages/Productos.jsx";
import { IniciarSesion } from "../pages/IniciarSesion.jsx";
import { RecuperarContrasena } from "../pages/RecuperarContrasena.jsx";
import { AdminProductosLista } from "../pages/AdminProductosLista.jsx";
import { AdminProductoFormulario } from "../pages/AdminProductoFormulario.jsx";
import { SeguimientoPedido } from "../pages/SeguimientoPedido.jsx";
import { TestSeguimiento } from "../pages/TestSeguimiento.jsx";
import { MapaRepartidor } from "../components/mapa/MapaRepartidor.jsx";
import { crearEntregaTestInicial } from "../service/repartoService.js";
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
    expect(screen.queryByRole("button", { name: /^Seguimiento/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reparto/i })).not.toBeInTheDocument();
  });

  it("13. Navbar: Renderiza el nombre del cliente, botón 'Seguimiento' y 'Cerrar sesión' cuando es cliente, ocultando 'Reparto', y al cerrar sesión los oculta", () => {
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
    expect(screen.getByRole("button", { name: "Seguimiento" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reparto/i })).not.toBeInTheDocument();

    const btnCerrarSesion = screen.getByRole("button", { name: "Cerrar sesión" });
    expect(btnCerrarSesion).toBeInTheDocument();

    fireEvent.click(btnCerrarSesion);

    expect(screen.queryByText("Eduardo Pérez")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^Seguimiento/i })).not.toBeInTheDocument();
    expect(screen.getAllByText("Ingresar").length).toBeGreaterThan(0);
  });

  it("13b. Navbar: Muestra 'Reparto' solo para rol repartidor y oculta 'Seguimiento' para admin y repartidor", () => {
    guardarSesion({
      nombres: "Andrea",
      apellidos: "Muñoz",
      email: "admin@el-volcan.com",
      rol: "admin",
    });

    const { unmount } = render(
      <CarritoProvider>
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      </CarritoProvider>
    );

    expect(screen.queryByRole("button", { name: /^Seguimiento/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Reparto/i })).not.toBeInTheDocument();
    unmount();

    guardarSesion({
      nombres: "Carlos",
      apellidos: "Ruiz",
      email: "repartidor@el-volcan.com",
      rol: "repartidor",
    });

    render(
      <CarritoProvider>
        <MemoryRouter>
          <Navbar />
        </MemoryRouter>
      </CarritoProvider>
    );

    expect(screen.queryByRole("button", { name: /^Seguimiento/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Reparto" })).toBeInTheDocument();
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

    const btnTodos = screen.getByRole("button", { name: "Todos" });
    const btnReguladores = screen.getByRole("button", { name: "Reguladores" });
    expect(btnTodos).toHaveAttribute("aria-pressed", "true");
    expect(btnReguladores).toHaveAttribute("aria-pressed", "false");

    fireEvent.click(btnReguladores);
    expect(btnReguladores).toHaveAttribute("aria-pressed", "true");
    expect(screen.queryByText("Cilindro gas licuado 15 kg")).not.toBeInTheDocument();

    fireEvent.click(btnTodos);
    expect(screen.getByText("Cilindro gas licuado 15 kg")).toBeInTheDocument();
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

  it("20. SeguimientoPedido: Sin pedidos reales muestra estado vacío (sin demo) y enlace a '/seguimiento/test'", async () => {
    guardarSesion({
      id: 4,
      idUsuario: 4,
      nombres: "Eduardo",
      apellidos: "Pérez",
      email: "eduardo@correo.cl",
      rol: "cliente",
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(
      <MemoryRouter initialEntries={["/seguimiento"]}>
        <SeguimientoPedido />
      </MemoryRouter>
    );

    expect(
      await screen.findByText("Aún no tienes pedidos activos para seguir")
    ).toBeInTheDocument();
    expect(screen.queryByText("Modo Demostración")).not.toBeInTheDocument();
    expect(screen.queryByText(/Camila Soto Valenzuela/i)).not.toBeInTheDocument();

    const enlacesTest = screen.getAllByRole("link", { name: /Test de Seguimiento/i });
    expect(enlacesTest.length).toBeGreaterThan(0);
    expect(enlacesTest[0]).toHaveAttribute("href", "/seguimiento/test");
  });

  it("21. TestSeguimiento: Renderiza el simulador aislado de seguimiento, controles de estado y botón de retorno", () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    render(
      <MemoryRouter initialEntries={["/seguimiento/test"]}>
        <TestSeguimiento />
      </MemoryRouter>
    );

    expect(screen.getByText("Test de Seguimiento")).toBeInTheDocument();
    expect(screen.getByText("Pedido #TEST-1024")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /Iniciar Simulación GPS/i })
    ).toBeInTheDocument();

    const enlaceVolver = screen.getByRole("link", { name: /Volver a Seguimiento/i });
    expect(enlaceVolver).toHaveAttribute("href", "/seguimiento");

    const btnTemaMapa = screen.getByRole("button", { name: "Cambiar a modo claro" });
    expect(btnTemaMapa).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(btnTemaMapa);
    expect(
      screen.getByRole("button", { name: "Cambiar a modo nocturno" })
    ).toHaveAttribute("aria-pressed", "false");

    expect(screen.queryByText(/MongoDB/i)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Entregado" }));
    expect(screen.getByText("¡Pedido de prueba entregado!")).toBeInTheDocument();
  });

  it("22. Inicio: Renderiza el carrusel header con el banner principal, la barra de categorías y los productos en carrusel", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        ...PRODUCTOS_API_MOCK,
        {
          id: 12,
          codigo: "RG001",
          nombre: "Regulador doméstico estándar",
          descripcion: "Regulador certificado SEC",
          precio: 8990,
          stock: 45,
          minimo: 10,
          categoria: "Reguladores",
          imagen: "https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/RG001.webp",
        },
      ],
    });

    render(
      <CarritoProvider>
        <MemoryRouter initialEntries={["/"]}>
          <Inicio />
        </MemoryRouter>
      </CarritoProvider>
    );

    expect(
      screen.getByRole("heading", {
        name: /Llevamos tu pedido de gas directo a tu hogar/i,
      })
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Haz tu pedido online" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Siguiente banner" })).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Categorías de productos" })).toBeInTheDocument();
    expect(await screen.findByText("Cilindro gas licuado 15 kg")).toBeInTheDocument();
    expect(screen.getAllByText("Regulador doméstico estándar").length).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Reguladores" }));
    expect(screen.getByText("Categoría: Reguladores")).toBeInTheDocument();
  });

  it("23. SeguimientoPedido y MapaRepartidor: Oculta 'Sincronizado con MongoDB', usa ícono para el repartidor y activa modo nocturno por defecto con botón de cambio", async () => {
    guardarSesion({
      id: 4,
      idUsuario: 4,
      nombres: "Eduardo",
      apellidos: "Pérez",
      email: "eduardo@correo.cl",
      rol: "cliente",
    });

    vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: 109,
          codigoVenta: "EV-109",
          estado: "EN_CAMINO",
          repartidor: "Valentina Soto",
          direccion: "Av. México 340, Puente Alto",
          total: 127960,
          items: [
            {
              nombreProducto: "Cilindro gas licuado 15 kg",
              cantidad: 4,
              subtotal: 127960,
            },
          ],
        },
      ],
    });

    const { unmount } = render(
      <MemoryRouter initialEntries={["/seguimiento"]}>
        <SeguimientoPedido />
      </MemoryRouter>
    );

    expect(await screen.findByText("Valentina Soto")).toBeInTheDocument();
    expect(screen.queryByText(/Sincronizado con MongoDB/i)).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "Valentina Soto" }).tagName).toBe("DIV");

    const btnMapaCliente = screen.getByRole("button", { name: "Cambiar a modo claro" });
    expect(btnMapaCliente).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(btnMapaCliente);
    expect(
      screen.getByRole("button", { name: "Cambiar a modo nocturno" })
    ).toHaveAttribute("aria-pressed", "false");
    unmount();

    render(<MapaRepartidor entrega={crearEntregaTestInicial()} simulando={false} />);
    const btnMapaRepartidor = screen.getByRole("button", { name: "Cambiar a modo claro" });
    expect(btnMapaRepartidor).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(btnMapaRepartidor);
    expect(
      screen.getByRole("button", { name: "Cambiar a modo nocturno" })
    ).toHaveAttribute("aria-pressed", "false");

    expect(screen.queryByText(/waze 3d/i)).not.toBeInTheDocument();
    const btnVista3D = screen.getByRole("button", { name: "Cambiar a vista 2D" });
    expect(btnVista3D).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(btnVista3D);
    expect(
      screen.getByRole("button", { name: "Cambiar a vista 3D" })
    ).toHaveAttribute("aria-pressed", "false");

    expect(screen.getByRole("button", { name: "Activar guía por voz" })).toBeInTheDocument();
    const btnAlerta = screen.getByRole("button", { name: "Reportar alerta en ruta" });
    expect(btnAlerta).toBeInTheDocument();
    fireEvent.click(btnAlerta);
    expect(screen.getByRole("button", { name: "Tráfico fluido" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tráfico lento" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Congestión / Desvío" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tráfico detenido" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Zona de bonificación" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Calcular mejor ruta y ver pedidos pendientes" })
    ).toBeInTheDocument();
  });

  it("24. Repartidor: Abre con lista previa de pedidos optimizada, asigna al repartidor conectado al seleccionar ruta y lista el recorrido al entregar", async () => {
    const { Repartidor } = await import("../pages/Repartidor.jsx");
    guardarSesion({
      id: 3,
      nombre: "Carlos Ruiz",
      nombres: "Carlos",
      apellidos: "Ruiz",
      email: "repartidor@elvolcan.cl",
      rol: "repartidor",
      token: "token-repartidor-test",
    });

    const llamadasSeguimiento = [];
    vi.stubGlobal(
      "fetch",
      vi.fn().mockImplementation(async (url, opciones = {}) => {
        if (String(url).includes("router.project-osrm.org")) {
          return { ok: false, status: 503, json: async () => ({}) };
        }
        if (String(url).includes("/seguimiento") && opciones.method === "PUT") {
          const body = JSON.parse(opciones.body || "{}");
          llamadasSeguimiento.push(body);
          return {
            ok: true,
            json: async () => ({
              id: 202,
              codigoVenta: "EV-202",
              cliente: "Pedro Cercano",
              direccion: "Av. Concha y Toro 500",
              comuna: "Puente Alto",
              total: 25990,
              estadoVenta: "EN_RUTA",
              repartidor: body.repartidor || "Carlos Ruiz",
              entrega: {
                estado_despacho: body.estadoDespacho || "en_camino",
                repartidor_nombre: body.repartidor || "Carlos Ruiz",
                destino: { lat: -33.601, lng: -70.577 },
              },
              items: [],
            }),
          };
        }
        return {
          ok: true,
          json: async () => [
            {
              id: 201,
              codigo: "EV-201",
              cliente: "Ana Lejana",
              direccion: "Av. Sur 900",
              comuna: "Puente Alto",
              total: 31990,
              estadoVenta: "PENDIENTE",
              entrega: {
                estado_despacho: "pendiente",
                destino: { lat: -33.635, lng: -70.575 },
              },
              items: [
                {
                  producto: { codigo: "CL003", nombre: "Cilindro 15 kg", precio: 31990 },
                  cantidad: 1,
                  subtotal: 31990,
                },
              ],
            },
            {
              id: 202,
              codigo: "EV-202",
              cliente: "Pedro Cercano",
              direccion: "Av. Concha y Toro 500",
              comuna: "Puente Alto",
              total: 25990,
              estadoVenta: "PENDIENTE",
              entrega: {
                estado_despacho: "pendiente",
                destino: { lat: -33.601, lng: -70.577 },
              },
              items: [
                {
                  producto: { codigo: "CL002", nombre: "Cilindro 11 kg", precio: 25990 },
                  cantidad: 1,
                  subtotal: 25990,
                },
              ],
            },
          ],
        };
      })
    );

    render(
      <MemoryRouter>
        <SesionProvider>
          <CarritoProvider>
            <Repartidor />
          </CarritoProvider>
        </SesionProvider>
      </MemoryRouter>
    );

    // 1. Al abrir muestra la lista previa sin el selector flotante antiguo
    expect(
      await screen.findByText(/Planificador de Ruta y Pedidos/i)
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText("Seleccionar pedido a repartir")
    ).not.toBeInTheDocument();

    // 2. Recomienda el pedido más cercano (EV-202) antes de seleccionar
    expect(await screen.findByText(/Más cómodo ahora/i)).toBeInTheDocument();
    expect(screen.getByText(/#EV-202 \(Pedro Cercano\)/i)).toBeInTheDocument();

    // 3. Seleccionar el pedido más cómodo abre el mapa y sincroniza a Carlos Ruiz como repartidor
    fireEvent.click(
      screen.getByRole("button", { name: /Iniciar con el más cómodo/i })
    );
    expect(
      await screen.findByRole("button", {
        name: "Calcular mejor ruta y ver pedidos pendientes",
      })
    ).toBeInTheDocument();
    expect(
      llamadasSeguimiento.some(
        (payload) =>
          payload.repartidor === "Carlos Ruiz" &&
          payload.estadoDespacho === "en_camino"
      )
    ).toBe(true);

    // 4. Al entregar el pedido vuelve a listar el recorrido realizado
    fireEvent.click(screen.getByRole("button", { name: /Llegué/i }));
    fireEvent.click(screen.getByRole("button", { name: /Entregar/i }));
    fireEvent.click(
      screen.getByRole("button", { name: /Finalizar Entrega/i })
    );

    expect(
      await screen.findByText(/Trayecto de entregas completadas/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Entrega completada/i)).toBeInTheDocument();
  });

  it("25. MapaSeguimientoCliente y SeguimientoPedido: Muestra alertas del repartidor en modo solo lectura sin controles de edición", async () => {
    const { MapaSeguimientoCliente } = await import(
      "../components/mapa/MapaSeguimientoCliente.jsx"
    );
    const entregaConAlertas = {
      ...crearEntregaTestInicial(),
      codigoVenta: "EV-110",
      alertasRuta: [
        {
          id: "alerta-ro-1",
          tipo: "detenido",
          etiqueta: "Tráfico detenido",
          color: "#E11900",
          textoColor: "#FFFFFF",
          lat: -33.605,
          lng: -70.577,
          horaChile: "12:18",
        },
      ],
    };

    render(<MapaSeguimientoCliente entrega={entregaConAlertas} />);

    // Cliente ve el aviso del repartidor en su mapa
    expect(screen.getByText("Tráfico detenido")).toBeInTheDocument();
    expect(screen.getByText("12:18")).toBeInTheDocument();

    // Cliente NO tiene botones de crear, editar o limpiar alertas (solo lectura)
    expect(
      screen.queryByRole("button", { name: "Reportar alerta en ruta" })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/Limpiar alertas/i)).not.toBeInTheDocument();
  });
});
