import { describe, it, expect, beforeEach, vi } from 'vitest'
import { validateStyleMin } from '@maplibre/maplibre-gl-style-spec'
import { crearEstiloVectorialUber } from '../utils/estiloMapaWaze.js'
import {
  obtenerEntregaActiva,
  reiniciarEntregaDemo,
  actualizarPosicionRepartidor,
  cambiarEstadoEntrega,
  calcularRumbo,
  obtenerRutaOSRM,
  ventaAEntrega,
  cargarEntregaRealDesdeBackend,
  crearEntregaTestInicial,
  calcularDistanciaKm,
  calcularMejorRutaEntregas,
  guardarAlertasRutaPedido,
  obtenerAlertasRutaPedido,
} from '../service/repartoService.js'

describe('Servicio de Reparto y Trazado GPS (repartoService)', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.restoreAllMocks()
  })

  it('debe obtener la entrega activa por defecto si no hay nada guardado', () => {
    const entrega = obtenerEntregaActiva()
    expect(entrega).toBeDefined()
    expect(entrega.id).toBe('EV-1024')
    expect(entrega.cliente.nombre).toBe('Camila Soto Valenzuela')
    expect(entrega.repartidor.nombre).toBe('Carlos Silva Morales')
    expect(entrega.total).toBe(36490)
    expect(entrega.items.length).toBeGreaterThan(0)
  })

  it('debe convertir una venta real del backend (ms-venta) en entrega sincronizable', () => {
    const ventaBackend = {
      id: '10',
      codigo: 'EV-110',
      codigoVenta: 'EV-110',
      cliente: 'Camila Rojas',
      telefono: '+56 9 7777 8888',
      direccion: 'Av. Concha y Toro 2100',
      comuna: 'Puente Alto',
      total: 31990,
      metodoPago: 'pagar_ahora',
      estadoVenta: 'EN_RUTA',
      estadoPago: 'pagado',
      repartidor: 'Carlos Ruiz',
      fechaVentaChile: '2026-11-20T00:15:00-03:00',
      entrega: {
        estado_despacho: 'en_camino',
        eta_minutos: 6,
        distancia_km: 1.4,
        velocidad_kmh: 40,
        destino: { lat: -33.6145, lng: -70.5765 },
        posicion_actual: { lat: -33.605, lng: -70.577, rumbo: 180, indice_punto: 4 },
      },
      items: [
        {
          producto: { codigo: 'CL003', nombre: 'Cilindro gas licuado 15 kg', precio: 31990 },
          cantidad: 1,
          subtotal: 31990,
        },
      ],
    }

    const entrega = ventaAEntrega(ventaBackend)
    expect(entrega.esDemo).toBe(false)
    expect(entrega.ventaId).toBe(10)
    expect(entrega.codigoVenta).toBe('EV-110')
    expect(entrega.estado).toBe('en_camino')
    expect(entrega.cliente.nombre).toBe('Camila Rojas')
    expect(entrega.repartidor.nombre).toBe('Carlos Ruiz')
    expect(entrega.posicionActual.lat).toBe(-33.605)
    expect(entrega.etaMinutos).toBe(6)
    expect(entrega.fechaVentaChile).toBe('2026-11-20T00:15:00-03:00')
  })

  it('debe actualizar la posición del repartidor y persistirla', () => {
    const nuevaPos = {
      lat: -33.605,
      lng: -70.577,
      indicePunto: 4,
      rumbo: 180,
      distanciaRestanteKm: 1.5,
      etaMinutos: 5,
      velocidadKmH: 45,
    }

    const resultado = actualizarPosicionRepartidor(nuevaPos)
    expect(resultado.posicionActual.lat).toBe(-33.605)
    expect(resultado.posicionActual.lng).toBe(-70.577)
    expect(resultado.posicionActual.indicePunto).toBe(4)
    expect(resultado.distanciaKm).toBe(1.5)
    expect(resultado.etaMinutos).toBe(5)

    const lectura = obtenerEntregaActiva()
    expect(lectura.posicionActual.lat).toBe(-33.605)
  })

  it('debe cambiar el estado de la entrega a llegando y entregado', () => {
    const llegando = cambiarEstadoEntrega('llegando')
    expect(llegando.estado).toBe('llegando')

    const entregado = cambiarEstadoEntrega('entregado')
    expect(entregado.estado).toBe('entregado')
    expect(entregado.etaMinutos).toBe(0)
    expect(entregado.distanciaKm).toBe(0)
  })

  it('debe reiniciar la entrega al estado de demostración inicial', () => {
    cambiarEstadoEntrega('entregado')
    expect(obtenerEntregaActiva().estado).toBe('entregado')

    const reiniciado = reiniciarEntregaDemo()
    expect(reiniciado.estado).toBe('en_camino')
    expect(reiniciado.etaMinutos).toBe(9)
    expect(reiniciado.distanciaKm).toBe(2.4)
  })

  it('debe calcular el rumbo angular entre dos coordenadas correctamente', () => {
    const rumboSur = calcularRumbo(-33.5, -70.5, -33.6, -70.5)
    expect(Math.round(rumboSur)).toBe(180)

    const rumboNorte = calcularRumbo(-33.6, -70.5, -33.5, -70.5)
    expect(Math.round(rumboNorte)).toBe(0)
  })

  it('debe entregar ruta de fallback si el servicio OSRM no responde o falla', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockRejectedValue(new Error('Fallo simulado de red'))
    )

    const ruta = await obtenerRutaOSRM()
    expect(ruta).toBeDefined()
    expect(ruta.exito).toBe(false)
    expect(ruta.puntos.length).toBeGreaterThan(5)
    expect(ruta.pasos.length).toBeGreaterThan(0)
    expect(ruta.distanciaKm).toBe(2.4)
  })

  it('cargarEntregaRealDesdeBackend devuelve null si el cliente no tiene pedidos reales (sin fallback a demo)', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      })
    )

    const resultado = await cargarEntregaRealDesdeBackend(null, {
      id: 4,
      idUsuario: 4,
      rol: 'cliente',
    })
    expect(resultado).toBeNull()
  })

  it('crearEntregaTestInicial entrega una simulación aislada con código TEST-1024', () => {
    const testData = crearEntregaTestInicial()
    expect(testData.esDemo).toBe(true)
    expect(testData.codigoVenta).toBe('TEST-1024')
    expect(testData.estado).toBe('en_camino')
    expect(localStorage.getItem('el_volcan_entrega_activa')).toBeNull()
  })

  it('crearEstiloVectorialUber produce estilos MapLibre válidos en Modo Noche y Modo Día (CARTO, OpenFreeMap y Raster)', () => {
    const tramoRecorrido = [
      [-70.5758, -33.5975],
      [-70.5762, -33.6012],
    ]
    const tramoActivo = [
      [-70.5762, -33.6012],
      [-70.5766, -33.6119],
    ]

    for (const proveedor of ['carto', 'openfreemap', 'raster']) {
      const estiloNoche = crearEstiloVectorialUber(
        true,
        tramoRecorrido,
        tramoActivo,
        proveedor
      )
      const estiloDia = crearEstiloVectorialUber(
        false,
        tramoRecorrido,
        tramoActivo,
        proveedor
      )

      expect(validateStyleMin(estiloNoche)).toEqual([])
      expect(validateStyleMin(estiloDia)).toEqual([])
      expect(estiloNoche.layers.find((l) => l.id === 'fondo').paint['background-color']).toBe('#121212')
      expect(estiloDia.layers.find((l) => l.id === 'fondo').paint['background-color']).toBe('#F6F6F6')
    }

    const estiloCarto = crearEstiloVectorialUber(true, tramoRecorrido, tramoActivo, 'carto')
    const capaCallesEtiquetas = estiloCarto.layers.find((l) => l.id === 'etiquetas-calles')
    expect(capaCallesEtiquetas.layout['text-keep-upright']).toBe(true)
  })

  it('calcularMejorRutaEntregas ordena los pedidos pendientes para ahorrar distancia y excluye los entregados', () => {
    const origen = { lat: -33.5985, lng: -70.578, nombre: 'Planta' }
    const entregas = [
      // Pedido lejano listado primero a propósito (orden ineficiente)
      {
        codigoVenta: 'EV-301',
        estado: 'pendiente',
        total: 31990,
        cliente: { nombre: 'Cliente Lejano', direccion: 'Sur', coordenadas: { lat: -33.635, lng: -70.575 } },
      },
      // Pedido más cercano al punto actual
      {
        codigoVenta: 'EV-302',
        estado: 'en_camino',
        total: 25990,
        cliente: { nombre: 'Cliente Cercano', direccion: 'Centro', coordenadas: { lat: -33.602, lng: -70.577 } },
      },
      // Pedido intermedio
      {
        codigoVenta: 'EV-303',
        estado: 'pendiente',
        total: 42990,
        cliente: { nombre: 'Cliente Medio', direccion: 'Medio', coordenadas: { lat: -33.615, lng: -70.576 } },
      },
      // Pedido ya entregado (debe excluirse de pendientes)
      {
        codigoVenta: 'EV-304',
        estado: 'entregado',
        total: 18990,
        cliente: { nombre: 'Ya Entregado', direccion: 'Norte', coordenadas: { lat: -33.599, lng: -70.578 } },
      },
    ]

    expect(calcularDistanciaKm(-33.5985, -70.578, -33.602, -70.577)).toBeGreaterThan(0)

    const plan = calcularMejorRutaEntregas(entregas, origen)
    expect(plan.paradas).toHaveLength(3)
    expect(plan.paradas.map((p) => p.entrega.codigoVenta)).toEqual([
      'EV-302',
      'EV-303',
      'EV-301',
    ])
    expect(plan.pedidoRecomendado.codigoVenta).toBe('EV-302')
    expect(plan.paradas[0].esRecomendado).toBe(true)
    expect(plan.distanciaTotalKm).toBeLessThan(plan.distanciaOriginalKm)
    expect(plan.ahorroKm).toBeGreaterThan(0)
  })

  it('persiste y mapea alertasRuta desde MongoDB (entrega.alertas_ruta) y localStorage para el cliente', () => {
    const alerta = {
      id: 'alerta-1',
      tipo: 'trafico',
      etiqueta: 'Tráfico lento',
      color: '#FFC043',
      textoColor: '#121212',
      lat: -33.605,
      lng: -70.577,
      horaChile: '12:15',
    }

    guardarAlertasRutaPedido('EV-110', [alerta])
    expect(obtenerAlertasRutaPedido('EV-110')).toHaveLength(1)
    expect(obtenerAlertasRutaPedido('EV-110')[0].etiqueta).toBe('Tráfico lento')

    const entregaDesdeMongo = ventaAEntrega({
      id: 110,
      codigoVenta: 'EV-110',
      cliente: 'Cliente Prueba',
      total: 31990,
      entrega: {
        estado_despacho: 'en_camino',
        alertas_ruta: [alerta],
      },
      items: [],
    })
    expect(entregaDesdeMongo.alertasRuta).toHaveLength(1)
    expect(entregaDesdeMongo.alertasRuta[0].etiqueta).toBe('Tráfico lento')
  })
})
