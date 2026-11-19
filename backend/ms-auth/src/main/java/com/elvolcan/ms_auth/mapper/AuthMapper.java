package com.elvolcan.ms_auth.mapper;

import com.elvolcan.ms_auth.dto.response.AuthResponse;
import com.elvolcan.ms_auth.model.SesionAuth;
import org.mapstruct.Mapper;

import java.util.List;

@Mapper(componentModel = "spring")
public interface AuthMapper {

    AuthResponse toResponse(SesionAuth sesionAuth);

    List<AuthResponse> toResponseList(List<SesionAuth> sesiones);
}
