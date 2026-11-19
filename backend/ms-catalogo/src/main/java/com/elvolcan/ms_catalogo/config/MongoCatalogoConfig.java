package com.elvolcan.ms_catalogo.config;

import com.elvolcan.ms_catalogo.enums.EstadoProducto;
import com.elvolcan.ms_catalogo.model.ProductoCatalogo;
import com.elvolcan.ms_catalogo.repository.ProductoCatalogoRepository;
import org.bson.Document;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.mapping.event.BeforeConvertCallback;
import org.springframework.data.mongodb.core.query.Query;

import java.util.List;
import java.util.Map;

@Configuration
public class MongoCatalogoConfig {

    private static final Logger log = LoggerFactory.getLogger(MongoCatalogoConfig.class);

    @Bean
    public BeforeConvertCallback<ProductoCatalogo> asignarIdSecuencialCatalogo(MongoTemplate mongoTemplate) {
        return (entidad, coleccion) -> {
            if (entidad.getId() == null) {
                Query query = new Query().with(Sort.by(Sort.Direction.DESC, "_id")).limit(1);
                ProductoCatalogo ultimo = mongoTemplate.findOne(query, ProductoCatalogo.class, coleccion);
                long siguienteId = (ultimo != null && ultimo.getId() != null) ? ultimo.getId() + 1L : 1L;
                entidad.setId(siguienteId);
            }
            return entidad;
        };
    }

    @Bean
    public CommandLineRunner inicializarMongoCatalogo(
            ProductoCatalogoRepository repository,
            MongoTemplate mongoTemplate
    ) {
        return args -> {
            try {
                if (repository.count() == 0) {
                    log.info("Inicializando catálogo de productos en MongoDB Atlas (el_volcan_db)...");
                    List<ProductoCatalogo> iniciales = List.of(
                            crearProducto(1L, "AC001", "Carro porta cilindro 11/15kg",
                                    "Carro metálico reforzado para transporte seguro de cilindros de 11 y 15 kg",
                                    10990.0, Map.of("RESIDENCIAL", 12990, "COMERCIAL", 11000), false, null, "Unidad",
                                    "Accesorios", "https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/AC001.webp", 20),
                            crearProducto(2L, "AC002", "Tapa protectora para válvula",
                                    "Tapa de seguridad para proteger la válvula del cilindro contra polvo y golpes",
                                    1490.0, Map.of("RESIDENCIAL", 1490, "COMERCIAL", 1200), false, null, "Unidad",
                                    "Accesorios", "https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/AC002.webp", 60),
                            crearProducto(3L, "AC003", "Detector de gas a batería",
                                    "Sensor electrónico de fugas de gas GLP con alarma sonora de alta potencia",
                                    19990.0, Map.of("RESIDENCIAL", 19990, "COMERCIAL", 17000), false, null, "Unidad",
                                    "Accesorios", "https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/AC003.webp", 8),
                            crearProducto(4L, "CL001", "Cilindro gas licuado 5 kg",
                                    "Recarga de cilindro de gas licuado de 5 kg ideal para camping y estufas portátiles",
                                    12990.0, Map.of("RESIDENCIAL", 6500, "COMERCIAL", 6000), true, 5, "Unidad",
                                    "Cilindros", "https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/CL001.webp", 80),
                            crearProducto(5L, "CL002", "Cilindro gas licuado 11 kg",
                                    "Recarga de cilindro de gas licuado de 11 kg de uso residencial",
                                    23990.0, Map.of("RESIDENCIAL", 12000, "COMERCIAL", 11000), true, 11, "Unidad",
                                    "Cilindros", "https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/CL002.webp", 200),
                            crearProducto(6L, "CL003", "Cilindro gas licuado 15 kg",
                                    "Recarga de cilindro de gas licuado de 15 kg de alto rendimiento para el hogar",
                                    31990.0, Map.of("RESIDENCIAL", 16000, "COMERCIAL", 14500), true, 15, "Unidad",
                                    "Cilindros", "https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/CL003.webp", 90),
                            crearProducto(7L, "CL004", "Cilindro gas licuado 45 kg",
                                    "Recarga de cilindro de gas licuado de 45 kg para calefacción central y comercios",
                                    45000.0, Map.of("RESIDENCIAL", 45000, "COMERCIAL", 40000), true, 45, "Unidad",
                                    "Cilindros", "https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/CL004.webp", 30),
                            crearProducto(8L, "KC004", "Kit conexión completo",
                                    "Kit certificado que incluye regulador, manguera de 1.5m y dos abrazaderas",
                                    12990.0, Map.of("RESIDENCIAL", 12990, "COMERCIAL", 11500), false, null, "Kit",
                                    "Kits", "https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/KC004.webp", 25),
                            crearProducto(9L, "MG001", "Manguera gas 1.5 m",
                                    "Manguera flexible certificada SEC de 1.5 metros para gas licuado",
                                    3990.0, Map.of("RESIDENCIAL", 3990, "COMERCIAL", 3500), false, null, "Unidad",
                                    "Mangueras", "https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/MG001.webp", 80),
                            crearProducto(10L, "MG002", "Manguera gas 3 m",
                                    "Manguera flexible certificada SEC de 3 metros para gas licuado",
                                    6990.0, Map.of("RESIDENCIAL", 6990, "COMERCIAL", 6200), false, null, "Unidad",
                                    "Mangueras", "https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/MG002.webp", 50),
                            crearProducto(11L, "MG003", "Abrazadera metálica",
                                    "Abrazadera de acero inoxidable para fijación segura de manguera de gas",
                                    990.0, Map.of("RESIDENCIAL", 990, "COMERCIAL", 800), false, null, "Unidad",
                                    "Accesorios", "https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/MG003.webp", 200),
                            crearProducto(12L, "RG001", "Regulador doméstico estándar",
                                    "Regulador de presión estándar certificado para cilindros de 5, 11 y 15 kg",
                                    8990.0, Map.of("RESIDENCIAL", 8990, "COMERCIAL", 8200), false, null, "Unidad",
                                    "Reguladores", "https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/RG001.webp", 45),
                            crearProducto(13L, "RG002", "Regulador de alta presión",
                                    "Regulador industrial de alta presión para hornos y cocinas gastronómicas",
                                    18990.0, Map.of("RESIDENCIAL", 18990, "COMERCIAL", 17000), false, null, "Unidad",
                                    "Reguladores", "https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/RG002.webp", 12),
                            crearProducto(14L, "RG003", "Regulador dual (2 salidas)",
                                    "Regulador de doble salida para conectar dos artefactos simultáneamente",
                                    14990.0, Map.of("RESIDENCIAL", 14990, "COMERCIAL", 13500), false, null, "Unidad",
                                    "Reguladores", "https://res.cloudinary.com/hsr9lgyw/image/upload/v1793984850/RG003.webp", 18)
                    );
                    repository.saveAll(iniciales);

                    if (!mongoTemplate.collectionExists("productos") || mongoTemplate.getCollection("productos").countDocuments() == 0) {
                        for (ProductoCatalogo p : iniciales) {
                            String codNoSql = "KC004".equals(p.getCodigo()) ? "MG004" : p.getCodigo();
                            Document doc = new Document("_id", codNoSql)
                                    .append("categoria", p.getCategoria())
                                    .append("es_cilindro", Boolean.TRUE.equals(p.getEsCilindro()))
                                    .append("nombre", p.getNombre())
                                    .append("descripcion", p.getDescripcion())
                                    .append("unidad", p.getUnidad() != null ? p.getUnidad() : "Unidad")
                                    .append("precios", new Document(p.getPrecios()))
                                    .append("imagen", p.getImagen())
                                    .append("stock_actual", "AC003".equals(codNoSql) ? 8 : 30)
                                    .append("stock_critico", 10);
                            if (p.getFormatoKg() != null) {
                                doc.append("formato_kg", p.getFormatoKg());
                            }
                            mongoTemplate.getCollection("productos").replaceOne(
                                    new Document("_id", codNoSql),
                                    doc,
                                    new com.mongodb.client.model.ReplaceOptions().upsert(true)
                            );
                        }
                    }
                    log.info("Catálogo inicializado en MongoDB Atlas ({} productos).", iniciales.size());
                }
            } catch (Exception e) {
                log.warn("No se pudo ejecutar la semilla inicial de ms-catalogo en MongoDB: {}", e.getMessage());
            }
        };
    }

    private ProductoCatalogo crearProducto(
            Long id, String codigo, String nombre, String descripcion,
            Double precio, Map<String, Integer> precios, Boolean esCilindro,
            Integer formatoKg, String unidad, String categoria, String imagen, int stockRef
    ) {
        return ProductoCatalogo.builder()
                .id(id)
                .codigo(codigo)
                .nombre(nombre)
                .descripcion(descripcion)
                .precio(precio)
                .precios(precios)
                .esCilindro(esCilindro)
                .formatoKg(formatoKg)
                .unidad(unidad)
                .categoria(categoria)
                .imagen(imagen)
                .estado(EstadoProducto.ACTIVO)
                .build();
    }
}
