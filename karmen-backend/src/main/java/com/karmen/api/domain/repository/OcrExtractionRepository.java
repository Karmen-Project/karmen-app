package com.karmen.api.domain.repository;
import com.karmen.api.domain.entity.OcrExtraction;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface OcrExtractionRepository extends JpaRepository<OcrExtraction, Long> {
    Optional<OcrExtraction> findByInvoiceId(Long invoiceId);
    void deleteByInvoiceId(Long invoiceId);
}
