package com.elvolcan.ms_usuario.model;

import com.elvolcan.ms_usuario.enums.RolUsuario;
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
@Document(collection = "usuario")
public class Usuario {

    @Id
    private Long id;

    @Field("nombre")
    private String nombre;

    @Field("apellido")
    private String apellido;

    @Field("password")
    private String password;

    @Indexed(unique = true)
    @Field("email")
    private String email;

    @Indexed(unique = true)
    @Field("rut")
    private String rut;

    @Field("telefono")
    private String telefono;

    @Field("direccion")
    private String direccion;

    @Field("comuna")
    private String comuna;

    @Field("rol")
    private RolUsuario rol;

    @Field("tipo_cliente")
    private String tipoCliente;

    @Field("id_zona")
    private Integer idZona;

    @Field("patente_camion")
    private String patenteCamion;

    @Field("ubicacion_actual")
    private Map<String, Object> ubicacionActual;

    @Field("activo")
    private Boolean activo;
}
