package com.karmen.api.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "accounts", schema = "facturai",
    uniqueConstraints = @UniqueConstraint(columnNames = {"company_id", "code"}))
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Account {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id", nullable = false)
    private Company company;

    @Column(nullable = false, length = 10)
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = true;

    @Column(name = "is_custom", nullable = false)
    @Builder.Default
    private boolean custom = false;

    @Column(length = 20)
    private String purpose;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
}
