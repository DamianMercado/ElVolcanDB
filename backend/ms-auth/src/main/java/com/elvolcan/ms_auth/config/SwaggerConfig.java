package com.elvolcan.ms_auth.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class SwaggerConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("API El Volcán - Autenticación (ms-auth)")
                        .version("1.0")
                        .description("Microservicio central de autenticación encargado de autenticar todos los microservicios de El Volcán")
                );
    }
}
