package com.karmen.api.security;

import com.karmen.api.domain.entity.*;
import com.karmen.api.domain.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

/**
 * Servicio centralizado de autorización multi-tenant.
 * Valida que el usuario autenticado tenga acceso a los recursos solicitados.
 */
@Service
@RequiredArgsConstructor
public class AuthorizationService {
    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final InvoiceRepository invoiceRepository;
    private final ProviderRepository providerRepository;

    /**
     * Obtiene el usuario autenticado actual.
     */
    public User getCurrentUser() {
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("Usuario no encontrado"));
    }

    /**
     * Obtiene la empresa del usuario autenticado.
     */
    public Company getCurrentUserCompany() {
        User user = getCurrentUser();
        return companyRepository.findByOwnerId(user.getId()).stream()
                .findFirst()
                .orElseThrow(() -> new EntityNotFoundException("Empresa no encontrada para el usuario"));
    }

    /**
     * Valida que el usuario autenticado sea dueño de la empresa indicada.
     * @throws AccessDeniedException si el usuario no tiene acceso
     */
    public void verifyCompanyAccess(Long companyId) {
        User user = getCurrentUser();
        Company company = companyRepository.findById(companyId)
                .orElseThrow(() -> new EntityNotFoundException("Empresa no encontrada: " + companyId));
        
        if (!company.getOwner().getId().equals(user.getId())) {
            throw new AccessDeniedException("No tienes acceso a esta empresa");
        }
    }

    /**
     * Valida acceso y retorna la empresa si es válida.
     */
    public Company getAuthorizedCompany(Long companyId) {
        verifyCompanyAccess(companyId);
        return companyRepository.findById(companyId).orElseThrow();
    }

    /**
     * Valida que el usuario tenga acceso a la factura indicada.
     */
    public Invoice verifyInvoiceAccess(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Factura no encontrada: " + invoiceId));
        
        verifyCompanyAccess(invoice.getCompany().getId());
        return invoice;
    }

    /**
     * Valida que el usuario tenga acceso al proveedor indicado.
     */
    public Provider verifyProviderAccess(Long providerId) {
        Provider provider = providerRepository.findById(providerId)
                .orElseThrow(() -> new EntityNotFoundException("Proveedor no encontrado: " + providerId));
        
        verifyCompanyAccess(provider.getCompany().getId());
        return provider;
    }

    /**
     * Verifica si el usuario actual tiene rol ADMIN.
     */
    public boolean isAdmin() {
        return getCurrentUser().getRole().equals("ADMIN");
    }

    /**
     * Valida acceso para operaciones de borrado (requiere ownership + opcionalmente ADMIN).
     */
    public void verifyDeleteAccess(Long invoiceId) {
        Invoice invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new EntityNotFoundException("Factura no encontrada: " + invoiceId));
        
        // Debe ser dueño de la empresa O ser admin global
        User currentUser = getCurrentUser();
        boolean isOwner = invoice.getCompany().getOwner().getId().equals(currentUser.getId());
        
        if (!isOwner) {
            throw new AccessDeniedException("No tienes permiso para eliminar esta factura");
        }
    }
}
