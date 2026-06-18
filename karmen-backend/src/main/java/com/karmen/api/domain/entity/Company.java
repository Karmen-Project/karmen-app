package com.karmen.api.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "companies", schema = "facturai")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Company {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_id", nullable = false)
    private User owner;
    @Column(nullable = false, length = 200)
    private String name;
    @Column(length = 30)
    private String nit;
    @Column(length = 300)
    private String address;
    @Column(length = 20)
    private String phone;
    @Column(length = 150)
    private String email;
    @Column(name = "logo_url", length = 500)
    private String logoUrl;
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
