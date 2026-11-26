package com.elvolcan.ms_usuario.repository;

import com.elvolcan.ms_usuario.enums.RolUsuario;
import com.elvolcan.ms_usuario.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByRut(String rut);

    boolean existsByEmail(String email);

    boolean existsByRut(String rut);

    List<Usuario> findByRol(RolUsuario rol);
}
