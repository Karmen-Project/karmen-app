package com.karmen.api.domain.repository;
import com.karmen.api.domain.entity.InvoiceFile;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface InvoiceFileRepository extends JpaRepository<InvoiceFile, Long> {
    List<InvoiceFile> findByInvoiceId(Long invoiceId);
    void deleteByInvoiceId(Long invoiceId);
}
