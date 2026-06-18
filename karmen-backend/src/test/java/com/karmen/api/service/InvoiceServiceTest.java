package com.karmen.api.service;

import com.karmen.api.domain.entity.*;
import com.karmen.api.domain.repository.*;
import com.karmen.api.dto.invoice.*;
import com.karmen.api.security.AuthorizationService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class InvoiceServiceTest {

    @Mock private InvoiceRepository invoiceRepository;
    @Mock private InvoiceFileRepository invoiceFileRepository;
    @Mock private OcrExtractionRepository ocrExtractionRepository;
    @Mock private StorageService storageService;
    @Mock private OcrService ocrService;
    @Mock private AccountingService accountingService;
    @Mock private AuthorizationService authorizationService;
    @Mock private AuditLogService auditLogService;

    @InjectMocks
    private InvoiceService invoiceService;

    private User testUser;
    private Company testCompany;
    private Invoice pendingInvoice;
    private Invoice contabilizedInvoice;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@karmen.com");

        testCompany = new Company();
        testCompany.setId(1L);
        testCompany.setName("Test Company SAS");

        pendingInvoice = Invoice.builder()
                .id(10L).company(testCompany).uploadedBy(testUser)
                .type("EGRESO").status("PENDIENTE")
                .invoiceNumber("FAC-0010")
                .subtotal(new BigDecimal("100000"))
                .taxAmount(new BigDecimal("19000"))
                .total(new BigDecimal("119000"))
                .currency("COP").build();

        contabilizedInvoice = Invoice.builder()
                .id(11L).company(testCompany).uploadedBy(testUser)
                .type("INGRESO").status("CONTABILIZADA")
                .invoiceNumber("FAC-0011")
                .subtotal(new BigDecimal("50000"))
                .total(new BigDecimal("50000"))
                .currency("COP").build();
    }

    // ── contabilizar ────────────────────────────────────────────

    @Test
    @DisplayName("contabilizar: cambia estado a CONTABILIZADA, genera asientos y auditoría")
    void contabilizar_Success_ChangesStatusGeneratesEntriesAndAudits() {
        when(authorizationService.verifyInvoiceAccess(10L)).thenReturn(pendingInvoice);
        when(authorizationService.getCurrentUser()).thenReturn(testUser);
        when(invoiceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        InvoiceDto result = invoiceService.contabilizar(10L);

        assertEquals("CONTABILIZADA", result.status());
        assertNotNull(pendingInvoice.getConfirmedAt());

        // Verifica generación de asientos con los datos actuales (sin req)
        verify(accountingService).generateEntries(eq(pendingInvoice), eq(testUser));
        // Verifica registro de auditoría con userId (no la entidad User)
        verify(auditLogService).record(eq("INVOICE"), eq(10L),
                eq("CONTABILIZACION"), eq(1L), anyMap());
    }

    @Test
    @DisplayName("contabilizar: lanza IllegalStateException si la factura no está PENDIENTE")
    void contabilizar_FailsWhenStatusIsNotPendiente() {
        when(authorizationService.verifyInvoiceAccess(11L)).thenReturn(contabilizedInvoice);

        assertThrows(IllegalStateException.class, () -> invoiceService.contabilizar(11L));

        // Nunca debe persistir ni generar asientos
        verify(invoiceRepository, never()).save(any());
        verify(accountingService, never()).generateEntries(any(), any());
    }

    // ── update ──────────────────────────────────────────────────

    @Test
    @DisplayName("update: aplica cambios y regenera asientos si ya está CONTABILIZADA")
    void update_RegeneratesEntriesWhenStatusIsContabilizada() {
        InvoiceUploadRequest req = new InvoiceUploadRequest(
                null, null, null, null, "nota actualizada",
                null, null, null, null, null, null, null);

        when(authorizationService.verifyInvoiceAccess(11L)).thenReturn(contabilizedInvoice);
        when(authorizationService.getCurrentUser()).thenReturn(testUser);
        when(invoiceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        invoiceService.update(11L, req);

        verify(accountingService).regenerateEntries(eq(contabilizedInvoice), eq(testUser));
        assertEquals("nota actualizada", contabilizedInvoice.getNotes());
    }

    @Test
    @DisplayName("update: NO regenera asientos si la factura está PENDIENTE")
    void update_DoesNotRegenerateEntriesWhenStatusIsPendiente() {
        InvoiceUploadRequest req = new InvoiceUploadRequest(
                "FAC-NEW", null, null, LocalDate.now(), null,
                null, new BigDecimal("80000"), null, new BigDecimal("80000"), null, null, null);

        when(authorizationService.verifyInvoiceAccess(10L)).thenReturn(pendingInvoice);
        when(authorizationService.getCurrentUser()).thenReturn(testUser);
        when(invoiceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        invoiceService.update(10L, req);

        verify(accountingService, never()).regenerateEntries(any(), any());
        assertEquals("FAC-NEW", pendingInvoice.getInvoiceNumber());
        assertEquals(0, pendingInvoice.getSubtotal().compareTo(new BigDecimal("80000")));
    }

    // ── delete ──────────────────────────────────────────────────

    @Test
    @DisplayName("delete: aplica soft-delete y limpia asientos, OCR y archivos")
    void delete_SoftDeletesAndCleansAllDependencies() {
        when(authorizationService.getCurrentUser()).thenReturn(testUser);
        when(invoiceRepository.findById(10L)).thenReturn(Optional.of(pendingInvoice));
        when(invoiceRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        invoiceService.delete(10L);

        assertNotNull(pendingInvoice.getDeletedAt(), "deletedAt debe ser asignado (soft delete)");
        verify(accountingService).deleteEntriesByInvoiceId(10L);
        verify(ocrExtractionRepository).deleteByInvoiceId(10L);
        verify(invoiceFileRepository).deleteByInvoiceId(10L);
        verify(auditLogService).record(eq("INVOICE"), eq(10L),
                eq("ELIMINACION"), eq(1L), anyMap());
    }

    @Test
    @DisplayName("delete: lanza EntityNotFoundException si la factura no existe")
    void delete_ThrowsEntityNotFoundWhenInvoiceAbsent() {
        when(invoiceRepository.findById(99L)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () -> invoiceService.delete(99L));
        verify(invoiceRepository, never()).save(any());
    }

    // ── getHistory ──────────────────────────────────────────────

    @Test
    @DisplayName("getHistory: delega al AuditLogService y verifica acceso")
    void getHistory_DelegatesToAuditLogServiceAfterAccessCheck() {
        AuditLogDto dto = new AuditLogDto(1L, "CREACION", "Test User",
                "test@test.com", null, Map.of("fileName", "factura.pdf"));

        when(authorizationService.verifyInvoiceAccess(10L)).thenReturn(pendingInvoice);
        when(auditLogService.getInvoiceHistory(10L)).thenReturn(List.of(dto));

        List<AuditLogDto> result = invoiceService.getHistory(10L);

        assertEquals(1, result.size());
        assertEquals("CREACION", result.get(0).action());
        verify(authorizationService).verifyInvoiceAccess(10L);
        verify(auditLogService).getInvoiceHistory(10L);
    }

    // ── getAll ──────────────────────────────────────────────────

    @Test
    @DisplayName("getAll: retorna página de facturas y verifica acceso a la empresa")
    void getAll_ReturnsPagedResultsAndVerifiesCompanyAccess() {
        Page<Invoice> page = new PageImpl<>(List.of(pendingInvoice));
        when(invoiceRepository.findByCompanyIdAndDeletedAtIsNull(eq(1L), any(Pageable.class)))
                .thenReturn(page);

        Page<InvoiceDto> result = invoiceService.getAll(1L, null, 0, 20);

        assertEquals(1, result.getTotalElements());
        assertEquals("FAC-0010", result.getContent().get(0).invoiceNumber());
        verify(authorizationService).verifyCompanyAccess(1L);
    }

    // ── getById ─────────────────────────────────────────────────

    @Test
    @DisplayName("getById: retorna DTO de la factura verificando acceso")
    void getById_ReturnsDtoAfterAccessCheck() {
        when(authorizationService.verifyInvoiceAccess(10L)).thenReturn(pendingInvoice);

        InvoiceDto result = invoiceService.getById(10L);

        assertEquals("FAC-0010", result.invoiceNumber());
        assertEquals("PENDIENTE", result.status());
        verify(authorizationService).verifyInvoiceAccess(10L);
    }

    // ── getRecent ────────────────────────────────────────────────

    @Test
    @DisplayName("getRecent: retorna las 5 facturas más recientes de la empresa")
    void getRecent_ReturnsTop5InvoicesForCompany() {
        when(invoiceRepository.findTop5ByCompanyIdAndDeletedAtIsNullOrderByCreatedAtDesc(1L))
                .thenReturn(List.of(pendingInvoice, contabilizedInvoice));

        List<InvoiceDto> result = invoiceService.getRecent(1L);

        assertEquals(2, result.size());
        assertEquals("FAC-0010", result.get(0).invoiceNumber());
        verify(authorizationService).verifyCompanyAccess(1L);
    }
}
