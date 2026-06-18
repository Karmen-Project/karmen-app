package com.karmen.api.dto.account;

import java.time.LocalDateTime;

public record AccountDto(
    Long id, String code, String name, String type,
    boolean active, boolean custom, String purpose, LocalDateTime createdAt
) {}
