package com.elvolcan.ms_usuario.model;

import com.elvolcan.ms_usuario.enums.RolUsuario;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.type.NumericBooleanConverter;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(
        name = "usuario",
        uniqueConstraints = {
                @UniqueConstraint(name = "uk_usuario_email", columnNames = "email"),
                @UniqueConstraint(name = "uk_usuario_rut", columnNames = "rut")
        },
        indexes = @Index(name = "idx_usuario_rol", columnList = "rol")
)
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nombre", nullable = false, length = 100)
    private String nombre;

    @Column(name = "apellido", nullable = false, length = 100)
    private String apellido;

    @Column(name = "password", nullable = false, length = 255)
    private String password;

    @Column(name = "email", nullable = false, length = 150, unique = true)
    private String email;

    @Column(name = "rut", length = 20, unique = true)
    private String rut;

    @Column(name = "telefono", length = 40)
    private String telefono;

    @Column(name = "direccion", length = 250)
    private String direccion;

    @Column(name = "comuna", length = 100)
    private String comuna;

    @Enumerated(EnumType.STRING)
    @Column(name = "rol", nullable = false, length = 30)
    private RolUsuario rol;

    @Column(name = "tipo_cliente", length = 40)
    private String tipoCliente;

    @Column(name = "id_zona")
    private Integer idZona;

    @Column(name = "patente_camion", length = 30)
    private String patenteCamion;

    @Column(name = "lat_actual", precision = 10, scale = 6)
    private BigDecimal latActual;

    @Column(name = "lng_actual", precision = 10, scale = 6)
    private BigDecimal lngActual;

    @Convert(converter = NumericBooleanConverter.class)
    @Column(name = "activo", nullable = false)
    @Builder.Default
    private Boolean activo = true;
}
