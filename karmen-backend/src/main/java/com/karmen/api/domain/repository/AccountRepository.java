package com.karmen.api.domain.repository;

import com.karmen.api.domain.entity.Account;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface AccountRepository extends JpaRepository<Account, Long> {
    List<Account> findByCompanyIdOrderByCode(Long companyId);
    boolean existsByCompanyIdAndCode(Long companyId, String code);
    long countByCompanyId(Long companyId);
    List<Account> findByCompanyIdAndTypeAndActiveTrueOrderByCode(Long companyId, String type);
    Optional<Account> findByCompanyIdAndCode(Long companyId, String code);
    Optional<Account> findFirstByCompanyIdAndPurposeAndActiveTrueOrderByCode(Long companyId, String purpose);
}
