package com.karmen.api.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "invoice_files", schema = "facturai")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InvoiceFile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "invoice_id", nullable = false)
    private Invoice invoice;
    @Column(name = "file_name", nullable = false, length = 300)
    private String fileName;
    @Column(name = "file_path", nullable = false, length = 500)
    private String filePath;
    @Column(name = "file_type", nullable = false, length = 10)
    private String fileType;
    @Column(name = "file_size_kb")
    private Integer fileSizeKb;
    @Column(name = "file_url", length = 1000)
    private String fileUrl;
    @Column(name = "uploaded_at", nullable = false)
    @Builder.Default
    private LocalDateTime uploadedAt = LocalDateTime.now();
}
