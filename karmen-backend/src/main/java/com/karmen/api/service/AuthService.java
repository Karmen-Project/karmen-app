package com.karmen.api.service;

import com.karmen.api.domain.entity.*;
import com.karmen.api.domain.repository.*;
import com.karmen.api.dto.auth.*;
import com.karmen.api.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;

    public LoginResponse login(LoginRequest req) {
        var user = userRepository.findByEmail(req.email())
                .orElseThrow(() -> new BadCredentialsException("Credenciales inválidas"));
        if (!passwordEncoder.matches(req.password(), user.getPasswordHash()))
            throw new BadCredentialsException("Credenciales inválidas");
        user.setLastLogin(java.time.LocalDateTime.now());
        userRepository.save(user);
        
        // Obtener la empresa del usuario
        var company = companyRepository.findByOwnerId(user.getId()).stream()
                .findFirst()
                .orElse(null);

        System.out.print("Este es el token: "+ jwtUtils.generateToken(user.getEmail()));
        
        return new LoginResponse(
            jwtUtils.generateToken(user.getEmail()),
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getRole(),
            company != null ? company.getId() : null,
            company != null ? company.getName() : null
        );
    }

    @Transactional
    public RegisterResponse register(RegisterRequest req) {
        if (userRepository.existsByEmail(req.email()))
            throw new IllegalArgumentException("El email ya está registrado");
        var user = User.builder()
                .email(req.email())
                .passwordHash(passwordEncoder.encode(req.password()))
                .fullName(req.name())
                .role("CONTADOR")
                .isActive(true)
                .build();
        user = userRepository.save(user);
        var company = Company.builder()
                .owner(user)
                .name(req.nameCompany())
                .build();
        companyRepository.save(company);
        return new RegisterResponse(user.getId(), user.getFullName(), req.nameCompany(), req.username(), user.getEmail(), user.getRole());
    }
}
