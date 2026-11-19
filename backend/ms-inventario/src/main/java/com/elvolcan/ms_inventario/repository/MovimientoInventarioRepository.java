package com.elvolcan.ms_inventario.repository;

import com.elvolcan.ms_inventario.model.MovimientoInventario;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovimientoInventarioRepository extends MongoRepository<MovimientoInventario, Long> {

    List<MovimientoInventario> findByCodigoProductoIgnoreCaseOrderByFechaMovimientoDesc(String codigoProducto);
}
