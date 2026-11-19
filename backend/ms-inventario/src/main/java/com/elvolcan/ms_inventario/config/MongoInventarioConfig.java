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
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertCallback;
import org.springframework.data.mongodb.core.query.Query;

import java.time.LocalDateTime;
import java.util.List;

@Configuration
public class MongoInventarioConfig {

    private static final Logger log = LoggerFactory.getLogger(MongoInventarioConfig.class);

    @Bean
    public BeforeConvertCallback<Inventario> asignarIdSecuencialInventario(MongoTemplate mongoTemplate) {
        return (entidad, coleccion) -> {
            if (entidad.getId() == null) {
                Query query = new Query().with(Sort.by(Sort.Direction.DESC, "_id")).limit(1);
                Inventario ultimo = mongoTemplate.findOne(query, Inventario.class, coleccion);
                long siguienteId = (ultimo != null && ultimo.getId() != null) ? ultimo.getId() + 1L : 1L;
                entidad.setId(siguienteId);
            }
            return entidad;
        };
    }

    @Bean
    public BeforeConvertCallback<MovimientoInventario> asignarIdSecuencialMovimiento(MongoTemplate mongoTemplate) {
        return (entidad, coleccion) -> {
            if (entidad.getId() == null) {
                Query query = new Query().with(Sort.by(Sort.Direction.DESC, "_id")).limit(1);
                MovimientoInventario ultimo = mongoTemplate.findOne(query, MovimientoInventario.class, coleccion);
                long siguienteId = (ultimo != null && ultimo.getId() != null) ? ultimo.getId() + 1L : 1L;
                entidad.setId(siguienteId);
            }
            return entidad;
        };
    }

    @Bean
    public CommandLineRunner inicializarMongoInventario(
            InventarioRepository inventarioRepository,
            MovimientoInventarioRepository movimientoRepository
    ) {
        return args -> {
            try {
                if (inventarioRepository.count() == 0) {
                    log.info("Inicializando inventario en MongoDB Atlas (el_volcan_db)...");
                    LocalDateTime fechaBase = LocalDateTime.of(2026, 10, 15, 10, 0);
                    List<Inventario> items = List.of(
                            crearInv(1L, "AC001", "Carro porta cilindro 11/15kg", 57, 15, "Bodega Central - Sector Accesorios", EstadoStock.OK, fechaBase),
                            crearInv(2L, "AC002", "Tapa protectora para válvula", 59, 25, "Bodega Central - Sector Accesorios", EstadoStock.OK, fechaBase),
                            crearInv(3L, "AC003", "Detector de gas a batería", 8, 20, "Bodega Central - Sector Accesorios", EstadoStock.CRITICO, fechaBase),
                            crearInv(4L, "CL001", "Cilindro gas licuado 5 kg", 39, 40, "Patio Cilindros - Zona 5kg", EstadoStock.BAJO, fechaBase),
                            crearInv(5L, "CL002", "Cilindro gas licuado 11 kg", 60, 50, "Patio Cilindros - Zona 11kg", EstadoStock.OK, fechaBase),
                            crearInv(6L, "CL003", "Cilindro gas licuado 15 kg", 25, 30, "Patio Cilindros - Zona 15kg", EstadoStock.BAJO, fechaBase),
                            crearInv(7L, "CL004", "Cilindro gas licuado 45 kg", 30, 20, "Patio Cilindros - Zona 45kg", EstadoStock.OK, fechaBase),
                            crearInv(8L, "KC004", "Kit conexión completo", 25, 15, "Bodega Central - Sector Kits", EstadoStock.OK, fechaBase),
                            crearInv(9L, "MG001", "Manguera gas 1.5 m", 77, 30, "Bodega Central - Sector Mangueras", EstadoStock.OK, fechaBase),
                            crearInv(10L, "MG002", "Manguera gas 3 m", 50, 20, "Bodega Central - Sector Mangueras", EstadoStock.OK, fechaBase),
                            crearInv(11L, "MG003", "Abrazadera metálica", 200, 80, "Bodega Central - Sector Accesorios", EstadoStock.OK, fechaBase),
                            crearInv(12L, "RG001", "Regulador doméstico estándar", 45, 20, "Bodega Central - Sector Reguladores", EstadoStock.OK, fechaBase),
                            crearInv(13L, "RG002", "Regulador de alta presión", 12, 15, "Bodega Central - Sector Reguladores", EstadoStock.BAJO, fechaBase),
                            crearInv(14L, "RG003", "Regulador dual (2 salidas)", 18, 15, "Bodega Central - Sector Reguladores", EstadoStock.OK, fechaBase)
                    );
                    inventarioRepository.saveAll(items);
                }

                if (movimientoRepository.count() == 0) {
                    List<MovimientoInventario> movimientos = List.of(
                            MovimientoInventario.builder()
                                    .id(1L)
                                    .idInventario(3L)
                                    .codigoProducto("AC003")
                                    .tipoMovimiento(TipoMovimiento.SOLICITUD_REPOSICION)
                                    .cantidad(30)
                                    .stockAnterior(8)
                                    .stockNuevo(8)
                                    .observacion("Proveedor habitual")
                                    .estadoMovimiento(EstadoMovimiento.PENDIENTE)
                                    .fechaMovimiento(LocalDateTime.of(2026, 10, 15, 12, 0))
                                    .build(),
                            MovimientoInventario.builder()
                                    .id(2L)
                                    .idInventario(7L)
                                    .codigoProducto("CL004")
                                    .tipoMovimiento(TipoMovimiento.ENTRADA)
                                    .cantidad(20)
                                    .stockAnterior(10)
                                    .stockNuevo(30)
                                    .observacion("Reposición recibida de planta GLP")
                                    .estadoMovimiento(EstadoMovimiento.COMPLETADO)
                                    .fechaMovimiento(LocalDateTime.of(2026, 10, 10, 9, 30))
                                    .build()
                    );
                    movimientoRepository.saveAll(movimientos);
                }
            } catch (Exception e) {
                log.warn("No se pudo ejecutar la semilla inicial de ms-inventario en MongoDB: {}", e.getMessage());
            }
        };
    }

    private Inventario crearInv(
            Long id, String codigo, String nombre, int stockActual,
            int stockMinimo, String ubicacion, EstadoStock estado, LocalDateTime fecha
    ) {
        return Inventario.builder()
                .id(id)
                .codigoProducto(codigo)
                .nombreProducto(nombre)
                .stockActual(stockActual)
                .stockMinimo(stockMinimo)
                .ubicacionBodega(ubicacion)
                .estadoStock(estado)
                .fechaActualizacion(fecha)
                .build();
    }
}
