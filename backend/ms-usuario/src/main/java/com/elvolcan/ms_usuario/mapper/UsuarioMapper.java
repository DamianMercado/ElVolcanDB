package com.elvolcan.ms_usuario.mapper;

import com.elvolcan.ms_usuario.dto.request.UsuarioRequest;
import com.elvolcan.ms_usuario.dto.response.UsuarioResponse;
import com.elvolcan.ms_usuario.model.Usuario;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.List;

@Mapper(componentModel = "spring")
public interface UsuarioMapper {

    @Mapping(target = "id", ignore = true)
    Usuario toEntity(UsuarioRequest usuarioRequest);

    UsuarioResponse toResponse(Usuario usuario);

    List<UsuarioResponse> toResponseList(List<Usuario> usuarioList);
}
