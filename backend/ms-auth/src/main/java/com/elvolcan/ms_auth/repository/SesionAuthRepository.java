package com.elvolcan.ms_auth.repository;

import com.elvolcan.ms_auth.enums.EstadoSesion;
import com.elvolcan.ms_auth.model.SesionAuth;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SesionAuthRepository extends MongoRepository<SesionAuth, Long> {

    Optional<SesionAuth> findByToken(String token);

    List<SesionAuth> findByIdUsuarioAndEstado(Long idUsuario, EstadoSesion estado);

    List<SesionAuth> findByEstado(EstadoSesion estado);
}
