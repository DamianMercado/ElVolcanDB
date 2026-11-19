package com.elvolcan.ms_catalogo.mapper;

import com.elvolcan.ms_catalogo.dto.request.ProductoCatalogoRequest;
import com.elvolcan.ms_catalogo.dto.response.ProductoCatalogoResponse;
import com.elvolcan.ms_catalogo.model.ProductoCatalogo;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface CatalogoMapper {

    @Mapping(target = "id", ignore = true)
    ProductoCatalogo toEntity(ProductoCatalogoRequest request);

    @Mapping(target = "stock", ignore = true)
    @Mapping(target = "minimo", ignore = true)
    @Mapping(target = "estadoStock", ignore = true)
    @Mapping(target = "imagenEndpoint", ignore = true)
    ProductoCatalogoResponse toResponse(ProductoCatalogo producto);

    List<ProductoCatalogoResponse> toResponseList(List<ProductoCatalogo> productos);
}
