package com.elvolcan.ms_pago.mapper;

import com.elvolcan.ms_pago.dto.request.PagoRequest;
import com.elvolcan.ms_pago.dto.response.PagoResponse;
import com.elvolcan.ms_pago.model.Pago;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface PagoMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "estadoPago", ignore = true)
    @Mapping(target = "codigoTransaccion", ignore = true)
    @Mapping(target = "codigoAutorizacion", ignore = true)
    @Mapping(target = "fechaPago", ignore = true)
    Pago toEntity(PagoRequest request);

    PagoResponse toResponse(Pago pago);

    List<PagoResponse> toResponseList(List<Pago> pagos);
}
