package com.elvolcan.ms_inventario.repository;

import com.elvolcan.ms_inventario.model.MovimientoInventario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MovimientoInventarioRepository extends JpaRepository<MovimientoInventario, Long> {

    List<MovimientoInventario> findByCodigoProductoIgnoreCaseOrderByFechaMovimientoDesc(String codigoProducto);
}
