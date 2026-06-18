package com.karmen.api.service;

import com.karmen.api.domain.constant.InvoiceType;
import com.karmen.api.domain.entity.*;
import com.karmen.api.domain.repository.*;
import com.karmen.api.dto.accounting.AccountingEntryDto;
import com.karmen.api.dto.invoice.InvoiceUploadRequest;
import com.karmen.api.security.AuthorizationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class AccountingService {
    private final AccountingEntryRepository accountingEntryRepository;
    private final AccountRepository accountRepository;
    private final AuthorizationService authorizationService;

    // Defaults PUC colombiano por tipo de factura
    private static final String DEFAULT_INGRESO_MAIN        = "1300"; // Clientes
    private static final String DEFAULT_INGRESO_TAX         = "2408"; // IVA por pagar
    private static final String DEFAULT_INGRESO_COUNTERPART = "4100"; // Ingresos
    private static final String DEFAULT_EGRESO_MAIN         = "5100"; // Gastos generales
    private static final String DEFAULT_EGRESO_TAX          = "2365"; // IVA por acreditar
    private static final String DEFAULT_EGRESO_COUNTERPART  = "2200"; // Proveedores

    private static final Map<String, String> PUC_NAMES = Map.of(
        "1300", "Clientes",
        "2408", "IVA por pagar",
        "4100", "Ingresos",
        "5100", "Gastos generales",
        "2365", "IVA descontable (compras)",
        "2200", "Proveedores por pagar"
    );

    @Transactional
    public void regenerateEntries(Invoice invoice, User createdBy) {
        accountingEntryRepository.deleteByInvoiceId(invoice.getId());
        generateEntries(invoice, createdBy, null);
    }

    @Transactional
    public void reverseEntries(Invoice invoice, User reversedBy) {
        // Obtiene asientos originales de la factura
        List<AccountingEntry> originalEntries = accountingEntryRepository.findByInvoiceId(invoice.getId());

        // Crea asientos de reversión (Debe↔Haber invertidos) para auditoría
        List<AccountingEntry> reversalEntries = new ArrayList<>();
        for (AccountingEntry original : originalEntries) {
            reversalEntries.add(AccountingEntry.builder()
                    .invoice(invoice)
                    .company(invoice.getCompany())
                    .createdBy(reversedBy)
                    .accountCode(original.getAccountCode())
                    .accountName(original.getAccountName())
                    .debit(original.getCredit())        // Invertir Debe/Haber
                    .credit(original.getDebit())
                    .description("[REVERSIÓN] " + original.getDescription())
                    .entryDate(LocalDate.now())
                    .build());
        }
        accountingEntryRepository.saveAll(reversalEntries);
    }

    @Transactional
    public void generateEntries(Invoice invoice, User createdBy) {
        generateEntries(invoice, createdBy, null);
    }

    @Transactional
    public void generateEntries(Invoice invoice, User createdBy, InvoiceUploadRequest req) {
        Long companyId = invoice.getCompany().getId();
        boolean isIngreso = InvoiceType.INGRESO.equals(invoice.getType());

        // Cuenta principal: usa la del request si viene, sino busca por propósito, sino default PUC
        String mainCode = (req != null && req.accountCode() != null && !req.accountCode().isBlank())
                ? resolveCode(req.accountCode(), companyId, isIngreso ? DEFAULT_INGRESO_MAIN : DEFAULT_EGRESO_MAIN)
                : resolvePurpose(companyId, isIngreso ? "COBRAR" : "GASTOS",
                                 isIngreso ? DEFAULT_INGRESO_MAIN : DEFAULT_EGRESO_MAIN);
        String taxCode = resolvePurpose(companyId,
                isIngreso ? "IVA_VENTAS" : "IVA_COMPRAS",
                isIngreso ? DEFAULT_INGRESO_TAX : DEFAULT_EGRESO_TAX);
        String counterpartCode = resolvePurpose(companyId,
                isIngreso ? "INGRESOS" : "PAGAR",
                isIngreso ? DEFAULT_INGRESO_COUNTERPART : DEFAULT_EGRESO_COUNTERPART);

        String mainName        = accountName(companyId, mainCode);
        String taxName         = accountName(companyId, taxCode);
        String counterpartName = accountName(companyId, counterpartCode);

        List<AccountingEntry> entries = new ArrayList<>();
        if (isIngreso) {
            entries.add(entry(invoice, createdBy, mainCode,        mainName,        invoice.getTotal(),     null));
            entries.add(entry(invoice, createdBy, counterpartCode, counterpartName, null,                   invoice.getSubtotal()));
            entries.add(entry(invoice, createdBy, taxCode,         taxName,         null,                   invoice.getTaxAmount()));
        } else {
            entries.add(entry(invoice, createdBy, mainCode,        mainName,        invoice.getSubtotal(),  null));
            entries.add(entry(invoice, createdBy, taxCode,         taxName,         invoice.getTaxAmount(), null));
            entries.add(entry(invoice, createdBy, counterpartCode, counterpartName, null,                   invoice.getTotal()));
        }
        accountingEntryRepository.saveAll(entries);
    }

    @Transactional
    public void deleteEntriesByInvoiceId(Long invoiceId) {
        accountingEntryRepository.deleteByInvoiceId(invoiceId);
    }

    private String resolveCode(String requested, Long companyId, String defaultCode) {
        if (requested == null || requested.isBlank()) return defaultCode;
        return accountRepository.findByCompanyIdAndCode(companyId, requested)
                .filter(Account::isActive)
                .map(Account::getCode)
                .orElse(defaultCode);
    }

    private String resolvePurpose(Long companyId, String purpose, String defaultCode) {
        return accountRepository
                .findFirstByCompanyIdAndPurposeAndActiveTrueOrderByCode(companyId, purpose)
                .map(Account::getCode)
                .orElse(defaultCode);
    }

    private String accountName(Long companyId, String code) {
        return accountRepository.findByCompanyIdAndCode(companyId, code)
                .map(Account::getName)
                .orElse(PUC_NAMES.getOrDefault(code, code));
    }

    private AccountingEntry entry(Invoice inv, User user, String code, String name,
                                   BigDecimal debit, BigDecimal credit) {
        return AccountingEntry.builder()
                .invoice(inv).company(inv.getCompany()).createdBy(user)
                .accountCode(code).accountName(name)
                .debit(debit != null ? debit : BigDecimal.ZERO)
                .credit(credit != null ? credit : BigDecimal.ZERO)
                .description(inv.getInvoiceNumber() + " - " + name)
                .entryDate(inv.getInvoiceDate() != null ? inv.getInvoiceDate() : LocalDate.now())
                .build();
    }

    public List<AccountingEntryDto> getEntries(Long companyId) {
        authorizationService.verifyCompanyAccess(companyId);
        return accountingEntryRepository.findByCompanyId(companyId).stream()
                .map(e -> new AccountingEntryDto(e.getId(), e.getInvoice().getId(),
                        e.getInvoice().getInvoiceNumber(), e.getAccountCode(), e.getAccountName(),
                        e.getDebit(), e.getCredit(), e.getDescription(), e.getEntryDate(), e.getCreatedAt()))
                .toList();
    }

    @Transactional
    public void deleteEntry(Long entryId) {
        AccountingEntry entry = accountingEntryRepository.findById(entryId)
                .orElseThrow(() -> new EntityNotFoundException("Asiento no encontrado: " + entryId));
        authorizationService.verifyCompanyAccess(entry.getCompany().getId());
        accountingEntryRepository.deleteById(entryId);
    }

    @Transactional
    public void deleteAllEntriesByCompany(Long companyId) {
        authorizationService.verifyCompanyAccess(companyId);
        List<AccountingEntry> entries = accountingEntryRepository.findByCompanyId(companyId);
        accountingEntryRepository.deleteAll(entries);
    }
}
