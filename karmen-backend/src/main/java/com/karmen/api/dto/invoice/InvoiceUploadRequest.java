package com.karmen.api.dto.invoice;
import java.math.BigDecimal;
import java.time.LocalDate;
public record InvoiceUploadRequest(
    String invoiceNumber, String providerName, String rfc,
    LocalDate invoiceDate, String notes, String type,
    BigDecimal subtotal, BigDecimal taxAmount, BigDecimal total,
    String accountCode,  // cuenta contable principal (opcional — usa default PUC si null)
    Long providerId,     // proveedor/cliente (opcional)
    String paymentMethod // medio de pago (opcional)
) {}
