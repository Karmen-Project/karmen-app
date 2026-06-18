package com.karmen.api.dto.invoice;
import java.math.BigDecimal;
public record InvoiceSummaryDto(long totalCount, BigDecimal totalIncome, BigDecimal totalExpense) {}
