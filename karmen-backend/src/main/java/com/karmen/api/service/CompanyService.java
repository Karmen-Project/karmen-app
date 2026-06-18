package com.karmen.api.service;

import com.karmen.api.domain.repository.CompanyRepository;
import com.karmen.api.dto.company.*;
import com.karmen.api.security.AuthorizationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
@RequiredArgsConstructor
@Slf4j
public class CompanyService {

    private final AuthorizationService authorizationService;
    private final CompanyRepository companyRepository;
    private final StorageService storageService;
    private final SupabaseStorageService supabaseStorageService;
    private final EmailService emailService;

    public CompanyProfileDto getCompany(Long companyId) {
        authorizationService.verifyCompanyAccess(companyId);
        var company = companyRepository.findById(companyId)
            .orElseThrow(() -> new EntityNotFoundException("Empresa no encontrada: " + companyId));
        return toDto(company);
    }

    @Transactional
    public CompanyProfileDto updateCompany(Long companyId, CompanyProfileUpdateRequest req) {
        var company = authorizationService.getAuthorizedCompany(companyId);
        company.setName(req.name());
        company.setNit(req.nit());
        company.setAddress(req.address());
        company.setPhone(req.phone());
        company.setEmail(req.email());
        companyRepository.save(company);

        var owner = company.getOwner();
        emailService.sendCompanyUpdateNotification(owner.getEmail(), company.getName());
        log.info("Empresa id={} actualizada", companyId);
        return toDto(company);
    }

    @Transactional
    public CompanyProfileDto uploadLogo(Long companyId, MultipartFile file) {
        var company = authorizationService.getAuthorizedCompany(companyId);

        // Validate file locally (extension, size, magic bytes) then discard local copy
        String localPath = storageService.store(file);
        String filename = java.nio.file.Paths.get(localPath).getFileName().toString();
        storageService.delete(localPath);

        // Upload to Supabase Storage (persistent across Render restarts)
        String publicUrl;
        try {
            publicUrl = supabaseStorageService.upload(file, filename);
        } catch (java.io.IOException e) {
            throw new RuntimeException("Error al subir logo: " + e.getMessage(), e);
        }

        company.setLogoUrl(publicUrl);
        companyRepository.save(company);
        log.info("Logo actualizado para empresa id={}: {}", companyId, publicUrl);
        return toDto(company);
    }

    private CompanyProfileDto toDto(com.karmen.api.domain.entity.Company c) {
        return new CompanyProfileDto(c.getId(), c.getName(), c.getNit(), c.getAddress(), c.getPhone(), c.getEmail(), c.getLogoUrl());
    }
}
