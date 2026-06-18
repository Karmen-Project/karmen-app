package com.karmen.api.dto.provider;
import jakarta.validation.constraints.NotBlank;
public record ProviderRequest(@NotBlank String name, String nit, String email, String phone, String address, String type, Long companyId) {}
