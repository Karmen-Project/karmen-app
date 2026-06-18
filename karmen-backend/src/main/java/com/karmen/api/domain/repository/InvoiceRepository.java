package com.karmen.api.domain.repository;
import com.karmen.api.domain.entity.Invoice;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    Page<Invoice> findByCompanyIdAndDeletedAtIsNull(Long companyId, Pageable pageable);
    Page<Invoice> findByCompanyIdAndStatusAndDeletedAtIsNull(Long companyId, String status, Pageable pageable);
    List<Invoice> findTop5ByCompanyIdAndDeletedAtIsNullOrderByCreatedAtDesc(Long companyId);
    Optional<Invoice> findByIdAndDeletedAtIsNull(Long id);
    // Para reportes: devuelve también las no eliminadas
    Page<Invoice> findByCompanyId(Long companyId, Pageable pageable);
    // Facturas ya eliminadas (soft-delete) de la empresa con el mismo número, excluyendo una dada.
    // Se usa para detectar la re-subida de una factura previamente eliminada.
    List<Invoice> findByCompanyIdAndInvoiceNumberAndDeletedAtIsNotNullAndIdNotOrderByDeletedAtDesc(
            Long companyId, String invoiceNumber, Long id);
}
