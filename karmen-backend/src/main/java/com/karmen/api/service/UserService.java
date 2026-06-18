package com.karmen.api.service;

import com.karmen.api.domain.repository.CompanyRepository;
import com.karmen.api.dto.user.*;
import com.karmen.api.security.AuthorizationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final AuthorizationService authorizationService;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    public UserProfileDto getProfile() {
        var user = authorizationService.getCurrentUser();
        var company = companyRepository.findByOwnerId(user.getId()).stream().findFirst().orElse(null);
        return new UserProfileDto(
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getRole(),
            company != null ? company.getId() : null,
            company != null ? company.getName() : null
        );
    }

    @Transactional
    public UserProfileDto updateProfile(UserProfileUpdateRequest req) {
        var user = authorizationService.getCurrentUser();
        user.setFullName(req.fullName());
        var company = companyRepository.findByOwnerId(user.getId()).stream().findFirst().orElse(null);

        emailService.sendProfileUpdateNotification(user.getEmail(), user.getFullName());
        log.info("Perfil actualizado para usuario id={}", user.getId());

        return new UserProfileDto(
            user.getId(),
            user.getEmail(),
            user.getFullName(),
            user.getRole(),
            company != null ? company.getId() : null,
            company != null ? company.getName() : null
        );
    }

    @Transactional
    public void changePassword(ChangePasswordRequest req) {
        var user = authorizationService.getCurrentUser();
        if (!passwordEncoder.matches(req.currentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("La contraseña actual es incorrecta");
        }
        user.setPasswordHash(passwordEncoder.encode(req.newPassword()));
        emailService.sendPasswordChangeNotification(user.getEmail(), user.getFullName());
        log.info("Contraseña cambiada para usuario id={}", user.getId());
    }
}
