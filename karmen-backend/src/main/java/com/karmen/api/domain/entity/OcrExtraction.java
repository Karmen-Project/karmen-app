package com.karmen.api.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

@Entity
@Table(name = "ocr_extractions", schema = "facturai")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OcrExtraction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;
    @Column(name = "raw_text", columnDefinition = "TEXT")
    private String rawText;
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "extracted_data", columnDefinition = "jsonb")
    private Map<String, Object> extractedData;
    @Column(name = "confidence_score", precision = 5, scale = 2)
    private BigDecimal confidenceScore;
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String status = "PROCESANDO";
    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;
    @Column(name = "processed_at")
    private LocalDateTime processedAt;
}
