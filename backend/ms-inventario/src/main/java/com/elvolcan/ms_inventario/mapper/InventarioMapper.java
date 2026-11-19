package com.elvolcan.ms_inventario.mapper;

import com.elvolcan.ms_inventario.dto.request.InventarioRequest;
import com.elvolcan.ms_inventario.dto.response.InventarioResponse;
import com.elvolcan.ms_inventario.dto.response.MovimientoInventarioResponse;
import com.elvolcan.ms_inventario.model.Inventario;
import com.elvolcan.ms_inventario.model.MovimientoInventario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface InventarioMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "estadoStock", ignore = true)
    @Mapping(target = "fechaActualizacion", ignore = true)
    Inventario toEntity(InventarioRequest request);

    InventarioResponse toResponse(Inventario inventario);

    List<InventarioResponse> toResponseList(List<Inventario> inventarios);

    MovimientoInventarioResponse toMovimientoResponse(MovimientoInventario movimiento);

    List<MovimientoInventarioResponse> toMovimientoResponseList(List<MovimientoInventario> movimientos);
}
