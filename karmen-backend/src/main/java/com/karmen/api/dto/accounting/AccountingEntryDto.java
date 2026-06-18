package com.karmen.api.dto.accounting;
import java.math.BigDecimal;
import java.time.*;
public record AccountingEntryDto(
    Long id, Long invoiceId, String invoiceNumber, String accountCode,
    String accountName, BigDecimal debit, BigDecimal credit,
    String description, LocalDate entryDate, LocalDateTime createdAt
) {}
