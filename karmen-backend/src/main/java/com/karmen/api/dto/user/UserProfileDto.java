package com.karmen.api.dto.user;

public record UserProfileDto(Long id, String email, String fullName, String role, Long companyId, String companyName) {}
