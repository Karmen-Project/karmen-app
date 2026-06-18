package com.karmen.api.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "accounting_entries", schema = "facturai")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AccountingEntry {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;
    @Column(name = "account_code", nullable = false, length = 20)
    private String accountCode;
    @Column(name = "account_name", nullable = false, length = 200)
    private String accountName;
    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal debit = BigDecimal.ZERO;
    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal credit = BigDecimal.ZERO;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(name = "entry_date", nullable = false)
    private LocalDate entryDate;
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
