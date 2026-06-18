package com.karmen.api.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        SecurityScheme bearerScheme = new SecurityScheme()
            .type(SecurityScheme.Type.HTTP)
            .scheme("bearer")
            .bearerFormat("JWT")
            .description("JWT token obtenido desde POST /api/auth/login. " +
                "Todos los endpoints excepto auth/* requieren este token en el header: " +
                "Authorization: Bearer <token>");

        return new OpenAPI()
            .info(new Info()
                .title("Karmen API")
                .version("0.1.0")
                .description("Plataforma inteligente de gestión de facturas con OCR e IA. " +
                    "Automatiza la carga y extracción de datos de facturas, genera asientos " +
                    "contables automáticos y produce reportes financieros.")
                .contact(new Contact()
                    .name("Grupo 001 - Proyecto Integrador I")
                    .email("info@karmen.local")
                    .url("https://www.udea.edu.co"))
                .license(new License()
                    .name("Apache 2.0")
                    .url("https://www.apache.org/licenses/LICENSE-2.0.html")))
            .components(new Components()
                .addSecuritySchemes("bearer-jwt", bearerScheme));
    }
}
