package com.karmen.api.service;

import com.karmen.api.domain.constant.InvoiceType;
import com.karmen.api.domain.entity.Account;
import com.karmen.api.domain.repository.AccountRepository;
import com.karmen.api.domain.repository.AccountingEntryRepository;
import com.karmen.api.domain.repository.CompanyRepository;
import com.karmen.api.dto.account.AccountDto;
import com.karmen.api.dto.account.AccountRequest;
import com.karmen.api.security.AuthorizationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AccountService {
    private final AccountRepository accountRepository;
    private final AccountingEntryRepository accountingEntryRepository;
    private final CompanyRepository companyRepository;
    private final AuthorizationService authorizationService;

    @Transactional
    public List<AccountDto> getAll(Long companyId) {
        authorizationService.verifyCompanyAccess(companyId);
        return accountRepository.findByCompanyIdOrderByCode(companyId)
                .stream().map(this::toDto).toList();
    }

    @Transactional
    public AccountDto create(Long companyId, AccountRequest req) {
        authorizationService.verifyCompanyAccess(companyId);
        if (accountRepository.existsByCompanyIdAndCode(companyId, req.code()))
            throw new IllegalArgumentException("Ya existe una cuenta con el código " + req.code());
        var company = companyRepository.findById(companyId).orElseThrow();
        var account = Account.builder()
                .company(company).code(req.code()).name(req.name()).type(req.type())
                .purpose(req.purpose()).custom(true).build();
        return toDto(accountRepository.save(account));
    }

    @Transactional
    public AccountDto update(Long id, AccountRequest req) {
        var account = getAccount(id);
        if (req.name()    != null) account.setName(req.name());
        if (req.type()    != null) account.setType(req.type());
        account.setPurpose(req.purpose());
        if (req.code() != null && account.isCustom()) {
            Long companyId = account.getCompany().getId();
            if (!req.code().equals(account.getCode())
                    && accountRepository.existsByCompanyIdAndCode(companyId, req.code()))
                throw new IllegalArgumentException("Ya existe una cuenta con el código " + req.code());
            account.setCode(req.code());
        }
        return toDto(accountRepository.save(account));
    }

    @Transactional
    public AccountDto toggleActive(Long id) {
        var account = getAccount(id);
        if (account.isActive()) {
            long count = accountingEntryRepository.countByAccountCode(account.getCode());
            if (count > 0)
                throw new IllegalStateException(
                    "No se puede desactivar: la cuenta tiene " + count + " asiento(s) contable(s) asociado(s)");
        }
        account.setActive(!account.isActive());
        return toDto(accountRepository.save(account));
    }

    @Transactional
    public void delete(Long id) {
        var account = getAccount(id);
        long count = accountingEntryRepository.countByAccountCode(account.getCode());
        if (count > 0)
            throw new IllegalStateException(
                "No se puede eliminar: la cuenta tiene " + count + " asiento(s) contable(s) asociado(s)");
        accountRepository.delete(account);
    }

    public List<AccountDto> suggest(Long companyId, String invoiceType) {
        authorizationService.verifyCompanyAccess(companyId);
        String accountType = InvoiceType.INGRESO.equals(invoiceType) ? "INGRESO" : "GASTO";
        return accountRepository.findByCompanyIdAndTypeAndActiveTrueOrderByCode(companyId, accountType)
                .stream().map(this::toDto).toList();
    }


    private Account getAccount(Long id) {
        var account = accountRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cuenta no encontrada: " + id));
        authorizationService.verifyCompanyAccess(account.getCompany().getId());
        return account;
    }

    private AccountDto toDto(Account a) {
        return new AccountDto(a.getId(), a.getCode(), a.getName(), a.getType(),
                a.isActive(), a.isCustom(), a.getPurpose(), a.getCreatedAt());
    }
}
