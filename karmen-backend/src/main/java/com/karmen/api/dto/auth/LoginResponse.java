package com.karmen.api.dto.auth;
public record LoginResponse(
    String token,
    Long userId,
    String email,
    String fullName,
    String role,
    Long companyId,
    String companyName
) {}
