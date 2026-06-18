package com.karmen.api.domain.repository;
import com.karmen.api.domain.entity.Company;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface CompanyRepository extends JpaRepository<Company, Long> {
    List<Company> findByOwnerId(Long ownerId);
}
