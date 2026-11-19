package com.elvolcan.ms_venta.mapper;

import com.elvolcan.ms_venta.dto.response.DetalleVentaResponse;
import com.elvolcan.ms_venta.dto.response.VentaResponse;
import com.elvolcan.ms_venta.model.DetalleVenta;
import com.elvolcan.ms_venta.model.Venta;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface VentaMapper {

    VentaResponse toResponse(Venta venta);

    List<VentaResponse> toResponseList(List<Venta> ventas);

    DetalleVentaResponse toDetalleResponse(DetalleVenta detalle);
}
