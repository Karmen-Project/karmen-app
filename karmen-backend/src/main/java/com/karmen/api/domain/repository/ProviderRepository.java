package com.karmen.api.domain.repository;
import com.karmen.api.domain.entity.Provider;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ProviderRepository extends JpaRepository<Provider, Long> {
    List<Provider> findByCompanyIdAndIsActiveTrue(Long companyId);
    List<Provider> findByCompanyIdAndTypeAndIsActiveTrue(Long companyId, String type);
}
