package com.elvolcan.ms_catalogo.model;

import com.elvolcan.ms_catalogo.enums.EstadoProducto;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "producto_catalogo")
public class ProductoCatalogo {

    @Id
    private Long id;

    @Indexed(unique = true)
    @Field("codigo")
    private String codigo;

    @Field("nombre")
    private String nombre;

    @Field("descripcion")
    private String descripcion;

    @Field("precio")
    private Double precio;

    @Field("precios")
    private Map<String, Integer> precios;

    @Field("es_cilindro")
    private Boolean esCilindro;

    @Field("formato_kg")
    private Integer formatoKg;

    @Field("unidad")
    private String unidad;

    @Field("categoria")
    private String categoria;

    @Field("imagen")
    private String imagen;

    @Field("estado")
    private EstadoProducto estado;
}
