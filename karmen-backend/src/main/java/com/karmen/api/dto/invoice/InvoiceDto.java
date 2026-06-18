package com.karmen.api.dto.invoice;
import java.math.BigDecimal;
import java.time.*;
public record InvoiceDto(
    Long id, String invoiceNumber, LocalDate invoiceDate, String type,
    String status, BigDecimal subtotal, BigDecimal taxAmount, BigDecimal total,
    String currency, String providerName, String companyName,
    Long companyId, Long providerId, LocalDateTime createdAt, String notes,
    String taxId, String paymentMethod
) {}
