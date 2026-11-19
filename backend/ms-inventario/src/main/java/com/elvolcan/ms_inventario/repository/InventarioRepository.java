package com.elvolcan.ms_inventario.repository;

import com.elvolcan.ms_inventario.model.Inventario;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventarioRepository extends MongoRepository<Inventario, Long> {

    Optional<Inventario> findByCodigoProductoIgnoreCase(String codigoProducto);

    boolean existsByCodigoProductoIgnoreCase(String codigoProducto);
}
