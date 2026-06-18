package com.karmen.api.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "providers", schema = "facturai")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Provider {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;
    @Column(nullable = false, length = 200)
    private String name;
    @Column(length = 30)
    private String nit;
    @Column(length = 150)
    private String email;
    @Column(length = 20)
    private String phone;
    @Column(length = 300)
    private String address;
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String type = "PROVEEDOR";
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
