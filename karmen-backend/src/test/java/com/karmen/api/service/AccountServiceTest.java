package com.karmen.api.service;

import com.karmen.api.domain.entity.*;
import com.karmen.api.domain.repository.*;
import com.karmen.api.dto.account.*;
import com.karmen.api.security.AuthorizationService;
import jakarta.persistence.EntityNotFoundException;
import org.junit.jupiter.api.*;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.*;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock private AccountRepository accountRepository;
    @Mock private AccountingEntryRepository accountingEntryRepository;
    @Mock private CompanyRepository companyRepository;
    @Mock private AuthorizationService authorizationService;

    @InjectMocks
    private AccountService accountService;

    private Company testCompany;
    private Account customAccount;     // cuenta personalizada (custom=true)
    private Account standardAccount;  // cuenta PUC (custom=false)

    @BeforeEach
    void setUp() {
        testCompany = new Company();
        testCompany.setId(1L);
        testCompany.setName("Empresa Test");

        customAccount = Account.builder()
                .id(5L).company(testCompany)
                .code("5120").name("Gastos de representación")
                .type("GASTO").purpose("GASTOS")
                .active(true).custom(true).build();

        standardAccount = Account.builder()
                .id(6L).company(testCompany)
                .code("1300").name("Clientes")
                .type("ACTIVO").purpose(null)
                .active(true).custom(false).build();
    }

    // ── create ──────────────────────────────────────────────────

    @Test
    @DisplayName("create: crea cuenta personalizada con propósito y la marca como custom")
    void create_Success_WithPurposeAndMarkedAsCustom() {
        when(accountRepository.existsByCompanyIdAndCode(1L, "5120")).thenReturn(false);
        when(companyRepository.findById(1L)).thenReturn(Optional.of(testCompany));
        when(accountRepository.save(any())).thenReturn(customAccount);

        AccountRequest req = new AccountRequest("5120", "Gastos de representación", "GASTO", "GASTOS");
        AccountDto result = accountService.create(1L, req);

        assertNotNull(result);
        assertEquals("5120", result.code());
        assertEquals("GASTOS", result.purpose());
        verify(accountRepository).save(argThat(acc ->
                acc.getCode().equals("5120") &&
                acc.getPurpose().equals("GASTOS") &&
                acc.isCustom()));
    }

    @Test
    @DisplayName("create: lanza IllegalArgumentException si el código ya existe en la empresa")
    void create_ThrowsWhenCodeAlreadyExists() {
        when(accountRepository.existsByCompanyIdAndCode(1L, "5120")).thenReturn(true);

        assertThrows(IllegalArgumentException.class,
                () -> accountService.create(1L, new AccountRequest("5120", "Otro", "GASTO", null)));

        verify(accountRepository, never()).save(any());
    }

    // ── update ──────────────────────────────────────────────────

    @Test
    @DisplayName("update: asigna propósito nulo cuando el request no trae propósito")
    void update_ClearsPurposeWhenRequestHasNullPurpose() {
        when(accountRepository.findById(5L)).thenReturn(Optional.of(customAccount));
        when(accountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AccountDto result = accountService.update(5L,
                new AccountRequest(null, "Nombre nuevo", "GASTO", null));

        assertNull(result.purpose(), "El propósito debe quedar en null");
        assertEquals("Nombre nuevo", customAccount.getName());
    }

    @Test
    @DisplayName("update: permite cambiar código solo en cuentas custom")
    void update_AllowsCodeChangeOnCustomAccountOnly() {
        when(accountRepository.findById(5L)).thenReturn(Optional.of(customAccount));
        when(accountRepository.existsByCompanyIdAndCode(1L, "5130")).thenReturn(false);
        when(accountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        accountService.update(5L, new AccountRequest("5130", null, null, null));

        assertEquals("5130", customAccount.getCode());
    }

    @Test
    @DisplayName("update: NO cambia código en cuentas estándar (custom=false)")
    void update_DoesNotChangeCodeOnStandardAccount() {
        when(accountRepository.findById(6L)).thenReturn(Optional.of(standardAccount));
        when(accountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        accountService.update(6L, new AccountRequest("9999", "Nuevo nombre", null, null));

        // El código no debe cambiar porque custom=false
        assertEquals("1300", standardAccount.getCode());
    }

    // ── toggleActive ─────────────────────────────────────────────

    @Test
    @DisplayName("toggleActive: lanza IllegalStateException si la cuenta tiene asientos contables")
    void toggleActive_ThrowsWhenAccountHasEntries() {
        when(accountRepository.findById(5L)).thenReturn(Optional.of(customAccount));
        when(accountingEntryRepository.countByAccountCode("5120")).thenReturn(3L);

        assertThrows(IllegalStateException.class,
                () -> accountService.toggleActive(5L));
        verify(accountRepository, never()).save(any());
    }

    @Test
    @DisplayName("toggleActive: desactiva cuenta activa sin asientos")
    void toggleActive_DeactivatesActiveAccountWithNoEntries() {
        when(accountRepository.findById(5L)).thenReturn(Optional.of(customAccount));
        when(accountingEntryRepository.countByAccountCode("5120")).thenReturn(0L);
        when(accountRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        AccountDto result = accountService.toggleActive(5L);

        assertFalse(customAccount.isActive(), "La cuenta debe quedar inactiva");
    }

    // ── delete ───────────────────────────────────────────────────

    @Test
    @DisplayName("delete: lanza IllegalStateException si la cuenta tiene asientos contables")
    void delete_ThrowsWhenAccountHasEntries() {
        when(accountRepository.findById(5L)).thenReturn(Optional.of(customAccount));
        when(accountingEntryRepository.countByAccountCode("5120")).thenReturn(2L);

        assertThrows(IllegalStateException.class, () -> accountService.delete(5L));
        verify(accountRepository, never()).delete(any());
    }

    @Test
    @DisplayName("delete: elimina la cuenta si no tiene asientos contables")
    void delete_SuccessWhenNoEntries() {
        when(accountRepository.findById(5L)).thenReturn(Optional.of(customAccount));
        when(accountingEntryRepository.countByAccountCode("5120")).thenReturn(0L);

        accountService.delete(5L);

        verify(accountRepository).delete(customAccount);
    }

    // ── getAll ───────────────────────────────────────────────────

    @Test
    @DisplayName("getAll: retorna todas las cuentas de la empresa ordenadas por código")
    void getAll_ReturnsAllAccountsOrderedByCode() {
        when(accountRepository.findByCompanyIdOrderByCode(1L))
                .thenReturn(List.of(customAccount, standardAccount));

        List<AccountDto> result = accountService.getAll(1L);

        assertEquals(2, result.size());
        assertEquals("5120", result.get(0).code());
        assertEquals("1300", result.get(1).code());
        verify(authorizationService).verifyCompanyAccess(1L);
    }

    // ── suggest ──────────────────────────────────────────────────

    @Test
    @DisplayName("suggest: retorna cuentas GASTO activas para facturas de EGRESO")
    void suggest_ReturnsGastoAccountsForEgreso() {
        when(accountRepository.findByCompanyIdAndTypeAndActiveTrueOrderByCode(1L, "GASTO"))
                .thenReturn(List.of(customAccount));

        List<AccountDto> result = accountService.suggest(1L, "EGRESO");

        assertEquals(1, result.size());
        assertEquals("5120", result.get(0).code());
        verify(authorizationService).verifyCompanyAccess(1L);
    }

    @Test
    @DisplayName("suggest: retorna cuentas INGRESO activas para facturas de INGRESO")
    void suggest_ReturnsIngresoAccountsForIngreso() {
        when(accountRepository.findByCompanyIdAndTypeAndActiveTrueOrderByCode(1L, "INGRESO"))
                .thenReturn(List.of());

        List<AccountDto> result = accountService.suggest(1L, "INGRESO");

        assertEquals(0, result.size());
        verify(accountRepository).findByCompanyIdAndTypeAndActiveTrueOrderByCode(1L, "INGRESO");
    }
}
