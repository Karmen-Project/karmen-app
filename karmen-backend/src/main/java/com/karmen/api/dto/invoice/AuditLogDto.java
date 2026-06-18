package com.karmen.api.dto.invoice;

import java.time.LocalDateTime;

public record AuditLogDto(
    Long id,
    String action,
    String userName,
    String userEmail,
    LocalDateTime createdAt,
    java.util.Map<String, Object> details
) {}
