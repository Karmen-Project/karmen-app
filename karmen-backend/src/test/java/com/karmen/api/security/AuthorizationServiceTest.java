package com.karmen.api.security;

import com.karmen.api.domain.entity.*;
import com.karmen.api.domain.repository.*;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthorizationServiceTest {

    @Mock private UserRepository userRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private InvoiceRepository invoiceRepository;
    @Mock private ProviderRepository providerRepository;
    @Mock private SecurityContext securityContext;
    @Mock private Authentication authentication;

    @InjectMocks
    private AuthorizationService authorizationService;

    private User testUser;
    private Company testCompany;
    private Invoice testInvoice;
    private Provider testProvider;

    @BeforeEach
    void setUp() {
        // Setup security context
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("test@karmen.com");
        SecurityContextHolder.setContext(securityContext);

        // Setup test entities
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@karmen.com");
        testUser.setRole("CONTADOR");

        testCompany = new Company();
        testCompany.setId(1L);
        testCompany.setName("Test Company");
        testCompany.setOwner(testUser);

        testInvoice = new Invoice();
        testInvoice.setId(1L);
        testInvoice.setCompany(testCompany);

        testProvider = new Provider();
        testProvider.setId(1L);
        testProvider.setCompany(testCompany);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("getCurrentUser devuelve usuario autenticado")
    void getCurrentUser_ReturnsAuthenticatedUser() {
        when(userRepository.findByEmail("test@karmen.com")).thenReturn(Optional.of(testUser));

        User result = authorizationService.getCurrentUser();

        assertEquals(testUser.getId(), result.getId());
        assertEquals(testUser.getEmail(), result.getEmail());
    }

    @Test
    @DisplayName("getCurrentUser lanza excepción si usuario no existe")
    void getCurrentUser_ThrowsIfUserNotFound() {
        when(userRepository.findByEmail("test@karmen.com")).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> authorizationService.getCurrentUser());
    }

    @Test
    @DisplayName("verifyCompanyAccess permite acceso al dueño")
    void verifyCompanyAccess_AllowsOwner() {
        when(userRepository.findByEmail("test@karmen.com")).thenReturn(Optional.of(testUser));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));

        assertDoesNotThrow(() -> authorizationService.verifyCompanyAccess(1L));
    }

    @Test
    @DisplayName("verifyCompanyAccess deniega acceso a no-dueño")
    void verifyCompanyAccess_DeniesNonOwner() {
        User otherUser = new User();
        otherUser.setId(999L);
        otherUser.setEmail("other@karmen.com");

        when(userRepository.findByEmail("test@karmen.com")).thenReturn(Optional.of(otherUser));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));

        assertThrows(AccessDeniedException.class, () -> authorizationService.verifyCompanyAccess(1L));
    }

    @Test
    @DisplayName("verifyCompanyAccess lanza excepción si empresa no existe")
    void verifyCompanyAccess_ThrowsIfCompanyNotFound() {
        when(userRepository.findByEmail("test@karmen.com")).thenReturn(Optional.of(testUser));
        when(companyRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> authorizationService.verifyCompanyAccess(999L));
    }

    @Test
    @DisplayName("verifyInvoiceAccess permite acceso al dueño de la empresa")
    void verifyInvoiceAccess_AllowsCompanyOwner() {
        when(userRepository.findByEmail("test@karmen.com")).thenReturn(Optional.of(testUser));
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(testInvoice));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));

        Invoice result = authorizationService.verifyInvoiceAccess(1L);

        assertEquals(testInvoice.getId(), result.getId());
    }

    @Test
    @DisplayName("verifyInvoiceAccess deniega acceso a factura de otra empresa")
    void verifyInvoiceAccess_DeniesAccessToOtherCompanyInvoice() {
        User otherUser = new User();
        otherUser.setId(999L);

        when(userRepository.findByEmail("test@karmen.com")).thenReturn(Optional.of(otherUser));
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(testInvoice));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));

        assertThrows(AccessDeniedException.class, () -> authorizationService.verifyInvoiceAccess(1L));
    }

    @Test
    @DisplayName("verifyDeleteAccess permite borrado al dueño")
    void verifyDeleteAccess_AllowsOwner() {
        when(userRepository.findByEmail("test@karmen.com")).thenReturn(Optional.of(testUser));
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(testInvoice));

        assertDoesNotThrow(() -> authorizationService.verifyDeleteAccess(1L));
    }

    @Test
    @DisplayName("verifyDeleteAccess deniega borrado a no-dueño")
    void verifyDeleteAccess_DeniesNonOwner() {
        User otherUser = new User();
        otherUser.setId(999L);

        when(userRepository.findByEmail("test@karmen.com")).thenReturn(Optional.of(otherUser));
        when(invoiceRepository.findById(1L)).thenReturn(Optional.of(testInvoice));

        assertThrows(AccessDeniedException.class, () -> authorizationService.verifyDeleteAccess(1L));
    }

    @Test
    @DisplayName("verifyProviderAccess permite acceso al dueño de la empresa")
    void verifyProviderAccess_AllowsCompanyOwner() {
        when(userRepository.findByEmail("test@karmen.com")).thenReturn(Optional.of(testUser));
        when(providerRepository.findById(1L)).thenReturn(Optional.of(testProvider));
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));

        Provider result = authorizationService.verifyProviderAccess(1L);

        assertEquals(testProvider.getId(), result.getId());
    }

    @Test
    @DisplayName("getCurrentUserCompany retorna la empresa del usuario")
    void getCurrentUserCompany_ReturnsUserCompany() {
        when(userRepository.findByEmail("test@karmen.com")).thenReturn(Optional.of(testUser));
        when(companyRepository.findByOwnerId(1L)).thenReturn(List.of(testCompany));

        Company result = authorizationService.getCurrentUserCompany();

        assertEquals(testCompany.getId(), result.getId());
        assertEquals(testCompany.getName(), result.getName());
    }

    @Test
    @DisplayName("isAdmin retorna true para usuario ADMIN")
    void isAdmin_ReturnsTrueForAdmin() {
        testUser.setRole("ADMIN");
        when(userRepository.findByEmail("test@karmen.com")).thenReturn(Optional.of(testUser));

        assertTrue(authorizationService.isAdmin());
    }

    @Test
    @DisplayName("isAdmin retorna false para usuario CONTADOR")
    void isAdmin_ReturnsFalseForContador() {
        when(userRepository.findByEmail("test@karmen.com")).thenReturn(Optional.of(testUser));

        assertFalse(authorizationService.isAdmin());
    }
}
