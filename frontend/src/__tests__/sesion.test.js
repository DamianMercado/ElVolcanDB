import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  guardarSesion,
  obtenerSesion,
  cerrarSesion,
  rutaSegunRol,
  normalizarUsuarioSesion,
  esTokenExpirado,
  GuardarToken,
} from "../utils/token.js";
import { IniciarSesion } from "../service/sesionService.js";

describe("Pruebas Unitarias - Lógica de Negocio: Autenticación y Sesiones con Backend", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("8. guardarSesion almacena los datos públicos en localStorage omitiendo la contraseña", () => {
    const usuarioConClave = {
      id: "u-1",
      nombres: "Ana",
      apellidos: "Gómez",
      email: "ana@correo.cl",
      rol: "cliente",
      contraseña: "ClaveSuperSecreta123",
    };

    guardarSesion(usuarioConClave);

    const sesionRecuperada = obtenerSesion();
    expect(sesionRecuperada).toBeDefined();
    expect(sesionRecuperada.email).toBe("ana@correo.cl");
    expect(sesionRecuperada.nombres).toBe("Ana");
    expect(sesionRecuperada.contraseña).toBeUndefined();
  });

  it("9. cerrarSesion elimina la sesión activa y obtenerSesion retorna null", () => {
    guardarSesion({ nombres: "Pedro", email: "pedro@correo.cl" });
    expect(obtenerSesion()).not.toBeNull();

    cerrarSesion();
    expect(obtenerSesion()).toBeNull();
  });

  it("10. IniciarSesion autentica contra ms-auth preservando idUsuario real y rechaza credenciales erróneas", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 99,
          idUsuario: 1,
          nombre: "Andrea",
          apellido: "Muñoz",
          nombreUsuario: "Andrea Muñoz",
          email: "admin@el-volcan.com",
          rol: "ADMIN",
          token: "jwt-token-real-backend",
        }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({
          mensaje: "Correo o contraseña incorrectos",
        }),
      });

    const autenticado = await IniciarSesion({
      email: "admin@el-volcan.com",
      password: "admin123",
    });
    expect(autenticado.token).toBe("jwt-token-real-backend");
    expect(autenticado.usuario.id).toBe(1);
    expect(autenticado.usuario.idSesion).toBe(99);
    expect(autenticado.usuario.email).toBe("admin@el-volcan.com");

    await expect(
      IniciarSesion({
        email: "admin@el-volcan.com",
        password: "clave_incorrecta_999",
      })
    ).rejects.toThrow("Correo o contraseña incorrectos");
  });

  it("11. rutaSegunRol redirecciona al administrador a /administradora, repartidor a /repartidor y clientes al inicio", () => {
    expect(rutaSegunRol("admin")).toBe("/administradora");
    expect(rutaSegunRol("ADMIN")).toBe("/administradora");
    expect(rutaSegunRol("repartidor")).toBe("/repartidor");
    expect(rutaSegunRol("REPARTIDOR")).toBe("/repartidor");
    expect(rutaSegunRol("cliente")).toBe("/");
    expect(rutaSegunRol(null)).toBe("/");
  });

  it("11b. obtenerSesion invalida automáticamente sesiones locales si el JWT almacenado ya expiró", () => {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(
      JSON.stringify({
        idUsuario: 4,
        nombre: "Cliente Expirado",
        rol: "CLIENTE",
        email: "cliente@el-volcan.com",
        exp: Math.floor(Date.now() / 1000) - 60,
      })
    );
    const jwtExpirado = `${header}.${payload}.firma`;

    expect(esTokenExpirado(jwtExpirado)).toBe(true);
    GuardarToken(jwtExpirado);
    guardarSesion(
      normalizarUsuarioSesion({
        id: 4,
        nombre: "Cliente Expirado",
        email: "cliente@el-volcan.com",
        rol: "cliente",
      })
    );

    expect(obtenerSesion()).toBeNull();
  });
});
