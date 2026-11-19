package com.elvolcan.ms_auth.model;

import com.elvolcan.ms_auth.enums.EstadoSesion;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.core.mapping.Field;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Document(collection = "sesion_auth")
public class SesionAuth {

    @Id
    private Long id;

    @Field("id_usuario")
    private Long idUsuario;

    @Field("nombre_usuario")
    private String nombreUsuario;

    @Field("email")
    private String email;

    @Field("rol")
    private String rol;

    @Indexed(unique = true)
    @Field("token")
    private String token;

    @Field("fecha_inicio")
    private LocalDateTime fechaInicio;

    @Field("fecha_expiracion")
    private LocalDateTime fechaExpiracion;

    @Field("estado")
    private EstadoSesion estado;
}
