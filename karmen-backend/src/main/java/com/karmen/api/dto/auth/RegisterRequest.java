package com.karmen.api.dto.auth;
import jakarta.validation.constraints.*;
public record RegisterRequest(
    @NotBlank String name,
    @NotBlank String nameCompany,
    @NotBlank String username,
    @Email @NotBlank String email,
    @NotBlank @Size(min=6) String password
) {}
