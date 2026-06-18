package com.karmen.api.domain.entity;

import com.karmen.api.domain.constant.InvoiceStatus;
import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.*;

@Entity
@Table(name = "invoices", schema = "facturai")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Invoice {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "provider_id")
    private Provider provider;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by", nullable = false)
    private User uploadedBy;
    @Column(name = "invoice_number", length = 50)
    private String invoiceNumber;
    @Column(name = "invoice_date")
    private LocalDate invoiceDate;
    @Column(name = "due_date")
    private LocalDate dueDate;
    @Column(nullable = false, length = 10)
    private String type;
    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal subtotal = BigDecimal.ZERO;
    @Column(name = "tax_amount", nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal taxAmount = BigDecimal.ZERO;
    @Column(nullable = false, precision = 15, scale = 2)
    @Builder.Default
    private BigDecimal total = BigDecimal.ZERO;
    @Column(nullable = false, length = 3)
    @Builder.Default
    private String currency = "COP";
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = InvoiceStatus.PENDIENTE;
    @Column(columnDefinition = "TEXT")
    private String notes;
    @Column(name = "tax_id", length = 30)
    private String taxId;
    @Column(name = "payment_method", length = 50)
    private String paymentMethod;
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    @Column(name = "confirmed_at")
    private LocalDateTime confirmedAt;
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;
}
