package com.karmen.api.service;

import com.karmen.api.domain.entity.*;
import com.karmen.api.domain.repository.*;
import com.karmen.api.dto.accounting.AccountingEntryDto;
import com.karmen.api.dto.invoice.InvoiceUploadRequest;
import com.karmen.api.security.AuthorizationService;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountingServiceTest {

    @Mock private AccountingEntryRepository accountingEntryRepository;
    @Mock private AccountRepository accountRepository;
    @Mock private AuthorizationService authorizationService;   // requerido por @InjectMocks

    @InjectMocks
    private AccountingService accountingService;

    private User testUser;
    private Company testCompany;
    private Invoice ingresoInvoice;
    private Invoice egresoInvoice;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);

        testCompany = new Company();
        testCompany.setId(1L);

        ingresoInvoice = Invoice.builder()
                .id(1L).company(testCompany).type("INGRESO")
                .invoiceNumber("FAC-001")
                .subtotal(new BigDecimal("100000"))
                .taxAmount(new BigDecimal("19000"))
                .total(new BigDecimal("119000")).build();

        egresoInvoice = Invoice.builder()
                .id(2L).company(testCompany).type("EGRESO")
                .invoiceNumber("FAC-002")
                .subtotal(new BigDecimal("50000"))
                .taxAmount(new BigDecimal("9500"))
                .total(new BigDecimal("59500")).build();
    }

    // Crea una cuenta con propósito dado para usar en los stubs
    private Account accountWithPurpose(String code, String name, String purpose) {
        return Account.builder()
                .id(100L).company(testCompany)
                .code(code).name(name).type("ACTIVO")
                .purpose(purpose).active(true).custom(false).build();
    }

    // Configura todos los stubs necesarios para que se usen los defaults PUC
    private void stubNoPurposeAccounts() {
        when(accountRepository.findFirstByCompanyIdAndPurposeAndActiveTrueOrderByCode(anyLong(), anyString()))
                .thenReturn(Optional.empty());
        // accountName también llama a findByCompanyIdAndCode (fallback: devuelve el código como nombre)
        when(accountRepository.findByCompanyIdAndCode(anyLong(), anyString()))
                .thenReturn(Optional.empty());
        when(accountingEntryRepository.saveAll(anyList()))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    // ── INGRESO con propósitos configurados ─────────────────────

    @Test
    @DisplayName("generateEntries INGRESO: usa cuentas por propósito cuando están configuradas")
    void generateEntries_Ingreso_UsesPurposeAccountsWhenConfigured() {
        when(accountRepository.findFirstByCompanyIdAndPurposeAndActiveTrueOrderByCode(1L, "COBRAR"))
                .thenReturn(Optional.of(accountWithPurpose("1305", "Clientes nacionales", "COBRAR")));
        when(accountRepository.findFirstByCompanyIdAndPurposeAndActiveTrueOrderByCode(1L, "INGRESOS"))
                .thenReturn(Optional.of(accountWithPurpose("4135", "Ingresos por servicios", "INGRESOS")));
        when(accountRepository.findFirstByCompanyIdAndPurposeAndActiveTrueOrderByCode(1L, "IVA_VENTAS"))
                .thenReturn(Optional.of(accountWithPurpose("2408", "IVA generado", "IVA_VENTAS")));
        when(accountRepository.findByCompanyIdAndCode(anyLong(), anyString()))
                .thenReturn(Optional.empty());
        when(accountingEntryRepository.saveAll(anyList()))
                .thenAnswer(inv -> inv.getArgument(0));

        accountingService.generateEntries(ingresoInvoice, testUser, null);

        ArgumentCaptor<List<AccountingEntry>> captor = ArgumentCaptor.forClass(List.class);
        verify(accountingEntryRepository).saveAll(captor.capture());
        List<AccountingEntry> entries = captor.getValue();

        assertEquals(3, entries.size());
        // Primer asiento: Clientes débito por el total
        assertEquals("1305", entries.get(0).getAccountCode());
        assertEquals(0, new BigDecimal("119000").compareTo(entries.get(0).getDebit()));
        // Segundo asiento: Ingresos crédito por subtotal
        assertEquals("4135", entries.get(1).getAccountCode());
        assertEquals(0, new BigDecimal("100000").compareTo(entries.get(1).getCredit()));
    }

    // ── INGRESO con fallback a defaults PUC ─────────────────────

    @Test
    @DisplayName("generateEntries INGRESO: usa defaults PUC cuando no hay propósito configurado")
    void generateEntries_Ingreso_FallsBackToPucDefaultsWhenNoPurpose() {
        stubNoPurposeAccounts();

        accountingService.generateEntries(ingresoInvoice, testUser, null);

        ArgumentCaptor<List<AccountingEntry>> captor = ArgumentCaptor.forClass(List.class);
        verify(accountingEntryRepository).saveAll(captor.capture());
        List<AccountingEntry> entries = captor.getValue();

        assertEquals(3, entries.size());
        assertEquals("1300", entries.get(0).getAccountCode());  // default Clientes
        assertEquals("4100", entries.get(1).getAccountCode());  // default Ingresos
        assertEquals("2408", entries.get(2).getAccountCode());  // default IVA ventas
    }

    // ── EGRESO con fallback a defaults PUC ──────────────────────

    @Test
    @DisplayName("generateEntries EGRESO: usa defaults PUC cuando no hay propósito configurado")
    void generateEntries_Egreso_FallsBackToPucDefaults() {
        stubNoPurposeAccounts();

        accountingService.generateEntries(egresoInvoice, testUser, null);

        ArgumentCaptor<List<AccountingEntry>> captor = ArgumentCaptor.forClass(List.class);
        verify(accountingEntryRepository).saveAll(captor.capture());
        List<AccountingEntry> entries = captor.getValue();

        assertEquals(3, entries.size());
        assertEquals("5100", entries.get(0).getAccountCode());  // default Gastos
        assertEquals("2365", entries.get(1).getAccountCode());  // default IVA compras
        assertEquals("2200", entries.get(2).getAccountCode());  // default Proveedores
    }

    // ── accountCode en el request sobreescribe el propósito ─────

    @Test
    @DisplayName("generateEntries: accountCode del request tiene prioridad sobre el propósito")
    void generateEntries_UsesRequestAccountCodeOverPurpose() {
        Account customAccount = accountWithPurpose("5120", "Gastos de representación", null);
        // Mockito evalúa stubs del más reciente al más antiguo: registrar general primero,
        // específico después → el específico siempre gana para "5120"
        when(accountRepository.findByCompanyIdAndCode(anyLong(), anyString()))
                .thenReturn(Optional.empty());
        when(accountRepository.findByCompanyIdAndCode(1L, "5120"))
                .thenReturn(Optional.of(customAccount));
        when(accountRepository.findFirstByCompanyIdAndPurposeAndActiveTrueOrderByCode(anyLong(), anyString()))
                .thenReturn(Optional.empty());
        when(accountingEntryRepository.saveAll(anyList()))
                .thenAnswer(inv -> inv.getArgument(0));

        InvoiceUploadRequest req = new InvoiceUploadRequest(
                null, null, null, null, null, null,
                null, null, null, "5120", null, null);

        accountingService.generateEntries(egresoInvoice, testUser, req);

        ArgumentCaptor<List<AccountingEntry>> captor = ArgumentCaptor.forClass(List.class);
        verify(accountingEntryRepository).saveAll(captor.capture());
        assertEquals("5120", captor.getValue().get(0).getAccountCode());
    }

    // ── regenerateEntries elimina antes de recrear ───────────────

    @Test
    @DisplayName("regenerateEntries: elimina asientos existentes antes de generar nuevos")
    void regenerateEntries_DeletesBeforeRecreating() {
        stubNoPurposeAccounts();

        accountingService.regenerateEntries(ingresoInvoice, testUser);

        InOrder order = inOrder(accountingEntryRepository);
        order.verify(accountingEntryRepository).deleteByInvoiceId(1L);
        order.verify(accountingEntryRepository).saveAll(anyList());
    }

    // ── Verificación de partida doble EGRESO ────────────────────

    @Test
    @DisplayName("generateEntries EGRESO: Debe=Haber (principio de partida doble)")
    void generateEntries_Egreso_DoublEntryBalances() {
        stubNoPurposeAccounts();

        accountingService.generateEntries(egresoInvoice, testUser, null);

        ArgumentCaptor<List<AccountingEntry>> captor = ArgumentCaptor.forClass(List.class);
        verify(accountingEntryRepository).saveAll(captor.capture());
        List<AccountingEntry> entries = captor.getValue();

        // EGRESO: Débito Gastos(subtotal) + IVA(tax), Crédito Proveedores(total)
        assertEquals(0, new BigDecimal("50000").compareTo(entries.get(0).getDebit()));   // Gastos
        assertEquals(0, new BigDecimal("9500").compareTo(entries.get(1).getDebit()));    // IVA
        assertEquals(0, new BigDecimal("59500").compareTo(entries.get(2).getCredit())); // Proveedores

        BigDecimal totalDebe  = entries.stream().map(AccountingEntry::getDebit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal totalHaber = entries.stream().map(AccountingEntry::getCredit)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertEquals(0, totalDebe.compareTo(totalHaber), "Debe y Haber deben cuadrar");
    }

    // ── generateEntries overload (sin req) ───────────────────────

    @Test
    @DisplayName("generateEntries(invoice, user): delega a la versión con req=null")
    void generateEntries_WithoutRequest_DelegatesToThreeArgVersion() {
        stubNoPurposeAccounts();

        accountingService.generateEntries(ingresoInvoice, testUser);

        verify(accountingEntryRepository).saveAll(anyList());
    }

    // ── reverseEntries ───────────────────────────────────────────

    @Test
    @DisplayName("reverseEntries: crea asientos con Debe y Haber invertidos respecto al original")
    void reverseEntries_InvertsDebitsAndCreditsOfOriginalEntries() {
        AccountingEntry original = mock(AccountingEntry.class);
        when(original.getAccountCode()).thenReturn("1300");
        when(original.getAccountName()).thenReturn("Clientes");
        when(original.getDebit()).thenReturn(new BigDecimal("119000"));
        when(original.getCredit()).thenReturn(BigDecimal.ZERO);
        when(original.getDescription()).thenReturn("FAC-001 - Clientes");

        when(accountingEntryRepository.findByInvoiceId(1L)).thenReturn(List.of(original));
        when(accountingEntryRepository.saveAll(anyList())).thenAnswer(inv -> inv.getArgument(0));

        accountingService.reverseEntries(ingresoInvoice, testUser);

        ArgumentCaptor<List<AccountingEntry>> captor = ArgumentCaptor.forClass(List.class);
        verify(accountingEntryRepository).saveAll(captor.capture());
        List<AccountingEntry> reversals = captor.getValue();

        assertEquals(1, reversals.size());
        // Inversión: el Debe original pasa a Haber y viceversa
        assertEquals(0, BigDecimal.ZERO.compareTo(reversals.get(0).getDebit()));
        assertEquals(0, new BigDecimal("119000").compareTo(reversals.get(0).getCredit()));
        assertTrue(reversals.get(0).getDescription().startsWith("[REVERSIÓN]"));
    }

    // ── getEntries ───────────────────────────────────────────────

    @Test
    @DisplayName("getEntries: retorna DTOs de asientos contables de la empresa")
    void getEntries_ReturnsMappedDtosForCompany() {
        Invoice mockInvoice = mock(Invoice.class);
        when(mockInvoice.getId()).thenReturn(1L);
        when(mockInvoice.getInvoiceNumber()).thenReturn("FAC-001");

        AccountingEntry entry = mock(AccountingEntry.class);
        when(entry.getId()).thenReturn(1L);
        when(entry.getInvoice()).thenReturn(mockInvoice);
        when(entry.getAccountCode()).thenReturn("5100");
        when(entry.getAccountName()).thenReturn("Gastos");
        when(entry.getDebit()).thenReturn(new BigDecimal("50000"));
        when(entry.getCredit()).thenReturn(BigDecimal.ZERO);
        when(entry.getDescription()).thenReturn("FAC-001 - Gastos");
        when(entry.getEntryDate()).thenReturn(null);
        when(entry.getCreatedAt()).thenReturn(null);

        when(accountingEntryRepository.findByCompanyId(1L)).thenReturn(List.of(entry));

        List<AccountingEntryDto> result = accountingService.getEntries(1L);

        assertEquals(1, result.size());
        assertEquals("5100", result.get(0).accountCode());
        verify(authorizationService).verifyCompanyAccess(1L);
    }

    // ── deleteEntry ──────────────────────────────────────────────

    @Test
    @DisplayName("deleteEntry: elimina asiento si la empresa del asiento coincide")
    void deleteEntry_DeletesEntryAfterAccessVerification() {
        Company company = new Company();
        company.setId(1L);
        AccountingEntry entry = mock(AccountingEntry.class);
        when(entry.getCompany()).thenReturn(company);
        when(accountingEntryRepository.findById(99L)).thenReturn(Optional.of(entry));

        accountingService.deleteEntry(99L);

        verify(authorizationService).verifyCompanyAccess(1L);
        verify(accountingEntryRepository).deleteById(99L);
    }

    @Test
    @DisplayName("deleteEntry: lanza EntityNotFoundException si el asiento no existe")
    void deleteEntry_ThrowsWhenEntryNotFound() {
        when(accountingEntryRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(jakarta.persistence.EntityNotFoundException.class,
                () -> accountingService.deleteEntry(999L));
        verify(accountingEntryRepository, never()).deleteById(anyLong());
    }
}
