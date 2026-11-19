package com.elvolcan.ms_pago.repository;

import com.elvolcan.ms_pago.model.Pago;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PagoRepository extends MongoRepository<Pago, Long> {

    List<Pago> findByIdVenta(Long idVenta);
}
