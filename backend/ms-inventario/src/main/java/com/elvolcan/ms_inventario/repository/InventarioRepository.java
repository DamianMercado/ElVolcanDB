package com.elvolcan.ms_inventario.repository;

import com.elvolcan.ms_inventario.model.Inventario;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface InventarioRepository extends JpaRepository<Inventario, Long> {

    Optional<Inventario> findByCodigoProductoIgnoreCase(String codigoProducto);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventario i WHERE UPPER(i.codigoProducto) = UPPER(:codigo)")
    Optional<Inventario> findForUpdateByCodigoProducto(@Param("codigo") String codigo);

    boolean existsByCodigoProductoIgnoreCase(String codigoProducto);
}
