package com.elvolcan.ms_inventario.config;

import com.elvolcan.ms_inventario.enums.EstadoMovimiento;
import com.elvolcan.ms_inventario.enums.EstadoStock;
import com.elvolcan.ms_inventario.enums.TipoMovimiento;
import com.elvolcan.ms_inventario.model.Inventario;
import com.elvolcan.ms_inventario.model.MovimientoInventario;
import com.elvolcan.ms_inventario.repository.InventarioRepository;
import com.elvolcan.ms_inventario.repository.MovimientoInventarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Configuration
public class OracleInventarioInitializer {

    private static final Logger log = LoggerFactory.getLogger(OracleInventarioInitializer.class);
    private static final ZoneId ZONA_CHILE = ZoneId.of("America/Santiago");

    @Bean
    public CommandLineRunner inicializarOracleInventario(
            InventarioRepository inventarioRepository,
            MovimientoInventarioRepository movimientoRepository
    ) {
        return args -> {
            try {
                if (inventarioRepository.count() == 0) {
                    log.info("Inicializando inventario base en Oracle SQL (ELVOLCAN_INVENTARIO, TZ America/Santiago)...");
                    LocalDateTime fechaBase = LocalDateTime.of(2026, 10, 15, 10, 0);
                    List<Inventario> items = List.of(
                            crearInv("AC001", "Carro porta cilindro 11/15kg", 57, 15, "Bodega Central - Sector Accesorios", EstadoStock.OK, fechaBase),
                            crearInv("AC002", "Tapa protectora para válvula", 59, 25, "Bodega Central - Sector Accesorios", EstadoStock.OK, fechaBase),
                            crearInv("AC003", "Detector de gas a batería", 8, 20, "Bodega Central - Sector Accesorios", EstadoStock.CRITICO, fechaBase),
                            crearInv("CL001", "Cilindro gas licuado 5 kg", 39, 40, "Patio Cilindros - Zona 5kg", EstadoStock.BAJO, fechaBase),
                            crearInv("CL002", "Cilindro gas licuado 11 kg", 60, 50, "Patio Cilindros - Zona 11kg", EstadoStock.OK, fechaBase),
                            crearInv("CL003", "Cilindro gas licuado 15 kg", 25, 30, "Patio Cilindros - Zona 15kg", EstadoStock.BAJO, fechaBase),
                            crearInv("CL004", "Cilindro gas licuado 45 kg", 30, 20, "Patio Cilindros - Zona 45kg", EstadoStock.OK, fechaBase),
                            crearInv("KC004", "Kit conexión completo", 25, 15, "Bodega Central - Sector Kits", EstadoStock.OK, fechaBase),
                            crearInv("MG001", "Manguera gas 1.5 m", 77, 30, "Bodega Central - Sector Mangueras", EstadoStock.OK, fechaBase),
                            crearInv("MG002", "Manguera gas 3 m", 50, 20, "Bodega Central - Sector Mangueras", EstadoStock.OK, fechaBase),
                            crearInv("MG003", "Abrazadera metálica", 200, 80, "Bodega Central - Sector Accesorios", EstadoStock.OK, fechaBase),
                            crearInv("RG001", "Regulador doméstico estándar", 45, 20, "Bodega Central - Sector Reguladores", EstadoStock.OK, fechaBase),
                            crearInv("RG002", "Regulador de alta presión", 12, 15, "Bodega Central - Sector Reguladores", EstadoStock.BAJO, fechaBase),
                            crearInv("RG003", "Regulador dual (2 salidas)", 18, 15, "Bodega Central - Sector Reguladores", EstadoStock.OK, fechaBase)
                    );
                    inventarioRepository.saveAll(items);
                }

                if (movimientoRepository.count() == 0) {
                    LocalDateTime fecha1 = LocalDateTime.of(2026, 10, 15, 12, 0);
                    LocalDateTime fecha2 = LocalDateTime.of(2026, 10, 10, 9, 30);
                    List<MovimientoInventario> movimientos = new ArrayList<>();

                    inventarioRepository.findByCodigoProductoIgnoreCase("AC003").ifPresent(inv ->
                            movimientos.add(MovimientoInventario.builder()
                                    .idInventario(inv.getId())
                                    .codigoProducto(inv.getCodigoProducto())
                                    .tipoMovimiento(TipoMovimiento.SOLICITUD_REPOSICION)
                                    .cantidad(30)
                                    .stockAnterior(8)
                                    .stockNuevo(8)
                                    .observacion("Proveedor habitual")
                                    .estadoMovimiento(EstadoMovimiento.PENDIENTE)
                                    .fechaMovimiento(fecha1)
                                    .fechaMovimientoChile(fecha1.atZone(ZONA_CHILE).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
                                    .zonaHoraria(ZONA_CHILE.getId())
                                    .build())
                    );

                    inventarioRepository.findByCodigoProductoIgnoreCase("CL004").ifPresent(inv ->
                            movimientos.add(MovimientoInventario.builder()
                                    .idInventario(inv.getId())
                                    .codigoProducto(inv.getCodigoProducto())
                                    .tipoMovimiento(TipoMovimiento.ENTRADA)
                                    .cantidad(20)
                                    .stockAnterior(10)
                                    .stockNuevo(30)
                                    .observacion("Reposición recibida de planta GLP")
                                    .estadoMovimiento(EstadoMovimiento.COMPLETADO)
                                    .fechaMovimiento(fecha2)
                                    .fechaMovimientoChile(fecha2.atZone(ZONA_CHILE).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
                                    .zonaHoraria(ZONA_CHILE.getId())
                                    .build())
                    );

                    if (!movimientos.isEmpty()) {
                        movimientoRepository.saveAll(movimientos);
                    }
                }
            } catch (Exception e) {
                log.warn("No se pudo ejecutar la semilla inicial de ms-inventario en Oracle SQL: {}", e.getMessage());
            }
        };
    }

    private Inventario crearInv(
            String codigo, String nombre, int stockActual,
            int stockMinimo, String ubicacion, EstadoStock estado, LocalDateTime fecha
    ) {
        return Inventario.builder()
                .codigoProducto(codigo)
                .nombreProducto(nombre)
                .stockActual(stockActual)
                .stockMinimo(stockMinimo)
                .ubicacionBodega(ubicacion)
                .estadoStock(estado)
                .fechaActualizacion(fecha)
                .fechaActualizacionChile(fecha.atZone(ZONA_CHILE).format(DateTimeFormatter.ISO_OFFSET_DATE_TIME))
                .zonaHoraria(ZONA_CHILE.getId())
                .build();
    }
}
