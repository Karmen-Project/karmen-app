package com.karmen.api.service;

import com.karmen.api.domain.entity.Provider;
import com.karmen.api.domain.repository.*;
import com.karmen.api.dto.provider.*;
import com.karmen.api.security.AuthorizationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProviderService {
    private final ProviderRepository providerRepository;
    private final AuthorizationService authorizationService;

    public List<ProviderDto> getAll(Long companyId, String type) {
        // Validar acceso a la empresa
        authorizationService.verifyCompanyAccess(companyId);
        
        List<Provider> list = (type != null)
                ? providerRepository.findByCompanyIdAndTypeAndIsActiveTrue(companyId, type)
                : providerRepository.findByCompanyIdAndIsActiveTrue(companyId);
        return list.stream().map(this::toDto).toList();
    }

    public ProviderDto getById(Long id) {
        // Validar acceso al proveedor
        Provider provider = authorizationService.verifyProviderAccess(id);
        return toDto(provider);
    }

    @Transactional
    public ProviderDto create(ProviderRequest req) {
        // Validar acceso a la empresa
        var company = authorizationService.getAuthorizedCompany(req.companyId());
        
        var p = Provider.builder()
                .company(company).name(req.name()).nit(req.nit())
                .email(req.email()).phone(req.phone()).address(req.address())
                .type(req.type() != null ? req.type() : "PROVEEDOR").isActive(true).build();
        return toDto(providerRepository.save(p));
    }

    @Transactional
    public ProviderDto update(Long id, ProviderRequest req) {
        // Validar acceso al proveedor
        var p = authorizationService.verifyProviderAccess(id);
        
        p.setName(req.name()); p.setNit(req.nit()); p.setEmail(req.email());
        p.setPhone(req.phone()); p.setAddress(req.address());
        if (req.type() != null) p.setType(req.type());
        return toDto(providerRepository.save(p));
    }

    @Transactional
    public void delete(Long id) {
        // Validar acceso al proveedor
        var p = authorizationService.verifyProviderAccess(id);
        
        p.setIsActive(false);
        providerRepository.save(p);
    }

    private ProviderDto toDto(Provider p) {
        return new ProviderDto(p.getId(), p.getName(), p.getNit(), p.getEmail(),
                p.getPhone(), p.getAddress(), p.getType(), p.getIsActive(),
                p.getCompany().getId());
    }
}
