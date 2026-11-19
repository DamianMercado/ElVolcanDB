package com.elvolcan.ms_usuario.repository;

import com.elvolcan.ms_usuario.enums.RolUsuario;
import com.elvolcan.ms_usuario.model.Usuario;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends MongoRepository<Usuario, Long> {

    Optional<Usuario> findByEmail(String email);

    Optional<Usuario> findByRut(String rut);

    boolean existsByEmail(String email);

    boolean existsByRut(String rut);

    List<Usuario> findByRol(RolUsuario rol);
}
