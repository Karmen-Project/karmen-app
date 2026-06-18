package com.karmen.api.service;

import com.karmen.api.domain.entity.*;
import com.karmen.api.domain.repository.*;
import com.karmen.api.dto.invoice.AuditLogDto;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuditLogServiceTest {

    @Mock private AuditLogRepository auditLogRepository;
    @Mock private UserRepository userRepository;

    @InjectMocks
    private AuditLogService auditLogService;

    private User testUser;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@karmen.com");
        testUser.setFullName("Test User");
    }

    // ── record ──────────────────────────────────────────────────

    @Test
    @DisplayName("record: persiste AuditLog con referencia de usuario y detalles correctos")
    void record_PersistsEntryWithUserRefAndDetails() {
        when(userRepository.getReferenceById(1L)).thenReturn(testUser);

        auditLogService.record("INVOICE", 10L, "CREACION", 1L,
                Map.of("fileName", "factura.pdf", "type", "EGRESO"));

        verify(auditLogRepository).save(argThat(log ->
                log.getEntityType().equals("INVOICE") &&
                log.getEntityId().equals(10L) &&
                log.getAction().equals("CREACION") &&
                log.getUser() == testUser &&
                log.getDetails().containsKey("fileName")));
    }

    @Test
    @DisplayName("record: persiste con user=null cuando userId es null (acción de sistema)")
    void record_PersistsWithNullUserWhenUserIdIsNull() {
        auditLogService.record("INVOICE", 10L, "ELIMINACION", null, Map.of());

        verify(auditLogRepository).save(argThat(log ->
                log.getUser() == null &&
                log.getAction().equals("ELIMINACION")));
        // No debe intentar cargar usuario
        verify(userRepository, never()).getReferenceById(anyLong());
    }

    @Test
    @DisplayName("record: absorbe excepciones sin propagarlas (transacción padre no se contamina)")
    void record_SwallowsExceptionToProtectCallerTransaction() {
        when(userRepository.getReferenceById(1L)).thenReturn(testUser);
        when(auditLogRepository.save(any())).thenThrow(new RuntimeException("DB error simulado"));

        // El llamador no debe ver esta excepción
        assertDoesNotThrow(() ->
                auditLogService.record("INVOICE", 10L, "EDICION", 1L, Map.of()));
    }

    // ── getInvoiceHistory ────────────────────────────────────────

    @Test
    @DisplayName("getInvoiceHistory: mapea entidades a DTO con usuario, acción y detalles")
    void getInvoiceHistory_MapsToDtoWithAllFields() {
        AuditLog log = new AuditLog();
        log.setId(1L);
        log.setAction("CONTABILIZACION");
        log.setUser(testUser);
        log.setCreatedAt(LocalDateTime.of(2026, 5, 1, 10, 30));
        log.setDetails(Map.of("total", "119000", "invoiceNumber", "FAC-001"));
        log.setEntityType("INVOICE");
        log.setEntityId(10L);

        when(auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("INVOICE", 10L))
                .thenReturn(List.of(log));

        List<AuditLogDto> result = auditLogService.getInvoiceHistory(10L);

        assertEquals(1, result.size());
        AuditLogDto dto = result.get(0);
        assertEquals("CONTABILIZACION", dto.action());
        assertEquals("Test User", dto.userName());
        assertEquals("test@karmen.com", dto.userEmail());
        assertEquals("119000", dto.details().get("total"));
    }

    @Test
    @DisplayName("getInvoiceHistory: mapea usuario null como 'Sistema' con email vacío")
    void getInvoiceHistory_MapsNullUserAsSistema() {
        AuditLog log = new AuditLog();
        log.setId(2L);
        log.setAction("CREACION");
        log.setUser(null);   // proceso automático / sistema
        log.setCreatedAt(LocalDateTime.now());
        log.setDetails(Map.of());
        log.setEntityType("INVOICE");
        log.setEntityId(10L);

        when(auditLogRepository.findByEntityTypeAndEntityIdOrderByCreatedAtDesc("INVOICE", 10L))
                .thenReturn(List.of(log));

        List<AuditLogDto> result = auditLogService.getInvoiceHistory(10L);

        assertEquals("Sistema", result.get(0).userName());
        assertEquals("", result.get(0).userEmail());
    }
}
