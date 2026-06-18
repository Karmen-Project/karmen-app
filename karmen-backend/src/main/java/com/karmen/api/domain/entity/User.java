package com.karmen.api.domain.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users", schema = "facturai")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class User {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(nullable = false, unique = true, length = 150)
    private String email;
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;
    @Column(name = "full_name", nullable = false, length = 200)
    private String fullName;
    @Column(nullable = false, length = 20)
    @Builder.Default
    private String role = "CONTADOR";
    @Column(name = "is_active", nullable = false)
    @Builder.Default
    private Boolean isActive = true;
    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private LocalDateTime createdAt = LocalDateTime.now();
    @Column(name = "last_login")
    private LocalDateTime lastLogin;
}
