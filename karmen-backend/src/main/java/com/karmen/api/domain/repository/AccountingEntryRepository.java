package com.karmen.api.domain.repository;
import com.karmen.api.domain.entity.AccountingEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDate;
import java.util.List;
public interface AccountingEntryRepository extends JpaRepository<AccountingEntry, Long> {
    List<AccountingEntry> findByCompanyId(Long companyId);
    List<AccountingEntry> findByCompanyIdAndEntryDateBetween(Long companyId, LocalDate from, LocalDate to);
    List<AccountingEntry> findByInvoiceId(Long invoiceId);
    void deleteByInvoiceId(Long invoiceId);
    long countByAccountCode(String accountCode);
}
