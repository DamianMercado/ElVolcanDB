import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  crearNuevoPedido,
  obtenerPedidos,
  obtenerUltimoPedido,
  actualizarEstadoPago,
} from "../service/pedidoService.js";

describe("Pruebas Unitarias - Lógica de Negocio: Gestión de Pedidos con Backend", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("5. crearNuevoPedido envía la venta al backend ms-venta y normaliza la respuesta con estado inicial pendiente", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockImplementation(async (url, opts) => {
      if (opts?.method === "POST") {
        return {
          ok: true,
          json: async () => ({
            id: 110,
            codigoVenta: "EV-110",
            cliente: "Carlos Valenzuela",
            telefono: "+56 9 8888 7777",
            rut: "18.345.678-9",
            email: "carlos@correo.cl",
            direccion: "Av. Las Perdices 123, Puente Alto",
            total: 47980,
            metodoPago: "repartidor",
            estadoVenta: "PENDIENTE",
            estadoPago: "PENDIENTE",
            items: [
              {
                codigoProducto: "CL002",
                nombreProducto: "Cilindro 11 kg",
                precioUnitario: 23990,
                cantidad: 2,
                subtotal: 47980,
              },
            ],
          }),
        };
      }
      return {
        ok: true,
        json: async () => [
          {
            id: 110,
            codigoVenta: "EV-110",
            cliente: "Carlos Valenzuela",
            direccion: "Av. Las Perdices 123, Puente Alto",
            total: 47980,
            metodoPago: "repartidor",
            estadoVenta: "PENDIENTE",
            estadoPago: "PENDIENTE",
          },
        ],
      };
    });

    const datosPrueba = {
      cliente: "Carlos Valenzuela",
      telefono: "+56 9 8888 7777",
      rut: "18.345.678-9",
      email: "carlos@correo.cl",
      direccion: "Av. Las Perdices 123, Puente Alto",
      items: [
        {
          producto: { codigo: "CL002", nombre: "Cilindro 11 kg", precio: 23990 },
          cantidad: 2,
          subtotal: 47980,
        },
      ],
      total: 47980,
      metodoPago: "repartidor",
      subMetodoPago: "efectivo",
    };

    const pedido = await crearNuevoPedido(datosPrueba);

    expect(fetchMock).toHaveBeenCalled();
    expect(pedido).toBeDefined();
    expect(Number(pedido.id)).toBe(110);
    expect(pedido.codigo).toBe("EV-110");
    expect(pedido.cliente).toBe("Carlos Valenzuela");
    expect(pedido.total).toBe(47980);
    expect(pedido.estado).toBe("Pendiente");
    expect(pedido.estadoPago).toBe("pendiente");

    const listaServidor = await obtenerPedidos();
    expect(listaServidor.some((p) => String(p.id) === String(pedido.id))).toBe(true);
  });

  it("6. actualizarEstadoPago procesa el pago con ms-pago y retorna códigos de transacción y autorización", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 111,
          codigoVenta: "EV-111",
          cliente: "Mariana Soto",
          total: 31990,
          metodoPago: "pagar_ahora",
          estadoVenta: "PENDIENTE",
          estadoPago: "PENDIENTE",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 5,
          idVenta: 111,
          montoPago: 31990,
          metodoPago: "webpay_debito",
          estadoPago: "PAGADO",
          codigoTransaccion: "TRX-TEST-999",
          codigoAutorizacion: "AUT-TEST-888",
          tarjetaTerminacion: "0001",
        }),
      });

    const nuevo = await crearNuevoPedido({
      cliente: "Mariana Soto",
      total: 31990,
      metodoPago: "pagar_ahora",
      subMetodoPago: "webpay",
    });
    expect(nuevo.estadoPago).toBe("pendiente");

    const pedidoActualizado = await actualizarEstadoPago(nuevo.id, {
      montoPago: 31990,
      estadoPago: "pagado",
      subMetodoPago: "webpay_debito",
    });

    expect(pedidoActualizado.estadoPago).toBe("pagado");
    expect(pedidoActualizado.subMetodoPago).toBe("webpay_debito");
    expect(pedidoActualizado.codigoTransaccion).toBe("TRX-TEST-999");
    expect(pedidoActualizado.codigoAutorizacion).toBe("AUT-TEST-888");
  });

  it("7. obtenerUltimoPedido retorna el último pedido registrado tras respuesta del backend", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 112,
          codigoVenta: "EV-112",
          cliente: "Cliente 1",
          total: 10000,
          estadoVenta: "PENDIENTE",
          estadoPago: "PENDIENTE",
        }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 113,
          codigoVenta: "EV-113",
          cliente: "Cliente 2",
          total: 20000,
          estadoVenta: "PENDIENTE",
          estadoPago: "PENDIENTE",
        }),
      });

    await crearNuevoPedido({ cliente: "Cliente 1", total: 10000 });
    const pedidoB = await crearNuevoPedido({ cliente: "Cliente 2", total: 20000 });

    const ultimo = obtenerUltimoPedido();
    expect(ultimo).toBeDefined();
    expect(String(ultimo.id)).toBe(String(pedidoB.id));
    expect(ultimo.cliente).toBe("Cliente 2");
  });
});
