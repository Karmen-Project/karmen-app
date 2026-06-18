package com.karmen.api.dto.provider;
public record ProviderDto(Long id, String name, String nit, String email, String phone, String address, String type, Boolean isActive, Long companyId) {}
