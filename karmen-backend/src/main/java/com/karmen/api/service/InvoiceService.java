package com.karmen.api.service;

import com.karmen.api.domain.constant.InvoiceStatus;
import com.karmen.api.domain.constant.InvoiceType;
import com.karmen.api.domain.entity.*;
import com.karmen.api.domain.repository.*;
import com.karmen.api.dto.invoice.*;
import com.karmen.api.dto.invoice.AuditLogDto;
import com.karmen.api.security.AuthorizationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;
import java.io.IOException;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceService {
    private final InvoiceRepository invoiceRepository;
    private final InvoiceFileRepository invoiceFileRepository;
    private final OcrExtractionRepository ocrExtractionRepository;
    private final ProviderRepository providerRepository;
    private final StorageService storageService;
    private final OcrService ocrService;
    private final AccountingService accountingService;
    private final AuthorizationService authorizationService;
    private final AuditLogService auditLogService;
    private final SupabaseStorageService supabaseStorageService;
    private final InvoiceFileUploader invoiceFileUploader;

    public Page<InvoiceDto> getAll(Long companyId, String status, int page, int size) {
        // Validar que el usuario tenga acceso a esta empresa
        authorizationService.verifyCompanyAccess(companyId);
        
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Invoice> invoices = (status != null)
                ? invoiceRepository.findByCompanyIdAndStatusAndDeletedAtIsNull(companyId, status, pageable)
                : invoiceRepository.findByCompanyIdAndDeletedAtIsNull(companyId, pageable);
        return invoices.map(this::toDto);
    }

    public InvoiceDto getById(Long id) {
        // Validar acceso a la factura
        Invoice invoice = authorizationService.verifyInvoiceAccess(id);
        return toDto(invoice);
    }

    public List<InvoiceDto> getRecent(Long companyId) {
        // Validar acceso a la empresa
        authorizationService.verifyCompanyAccess(companyId);
        
        return invoiceRepository.findTop5ByCompanyIdAndDeletedAtIsNullOrderByCreatedAtDesc(companyId)
                .stream().map(this::toDto).toList();
    }

    @Transactional(rollbackFor = Exception.class)
    public InvoiceDto upload(Long companyId, String type, MultipartFile file) {
        var company = authorizationService.getAuthorizedCompany(companyId);
        var user    = authorizationService.getCurrentUser();

        Invoice invoice         = createPendingInvoice(company, user, type);
        InvoiceFile invoiceFile = storeInvoiceFile(invoice, file);
        OcrExtraction ocr       = createOcrRecord(invoice);
        Long invoiceId          = invoice.getId();

        // OCR sincrónico: si falla, propaga → rollback de la transacción (la factura no queda en BD).
        runOcrOrRollback(invoiceId, ocr.getId(), invoiceFile.getFilePath());
        // Persistencia duradera de la imagen: se hace en segundo plano (tras el commit) para
        // no bloquear la respuesta. Best-effort: si falla se conserva la copia local.
        scheduleSupabaseUpload(invoiceFile, file, invoiceId);

        // Recargar factura con los datos extraídos por OCR
        invoice = invoiceRepository.findById(invoiceId)
                .orElseThrow(() -> new RuntimeException("Factura no encontrada tras OCR"));

        String originalName = file.getOriginalFilename();
        auditLogService.record("INVOICE", invoiceId, "CREACION", user.getId(),
                Map.of("type", type != null ? type : InvoiceType.INGRESO,
                       "fileName", originalName != null ? originalName : ""));

        // Si esta factura ya existía y fue eliminada, dejar constancia en su historial.
        logResubidaIfPreviouslyDeleted(invoice, user);

        return toDto(invoice);
    }

    /**
     * Detecta si la factura recién subida tiene el mismo número que una factura eliminada
     * (soft-delete) de la misma empresa y, de ser así, registra un evento RESUBIDA en su
     * historial que referencia la factura previa. No bloquea la carga.
     */
    private void logResubidaIfPreviouslyDeleted(Invoice invoice, User user) {
        String number = invoice.getInvoiceNumber();
        if (number == null || number.isBlank()) return;

        List<Invoice> previas = invoiceRepository
            .findByCompanyIdAndInvoiceNumberAndDeletedAtIsNotNullAndIdNotOrderByDeletedAtDesc(
                invoice.getCompany().getId(), number, invoice.getId());
        if (previas.isEmpty()) return;

        Invoice previa = previas.get(0); // la eliminada más reciente con ese número
        auditLogService.record("INVOICE", invoice.getId(), "RESUBIDA", user.getId(),
            Map.of("invoiceNumber",   number,
                   "facturaPreviaId", String.valueOf(previa.getId()),
                   "eliminadaEn",     previa.getDeletedAt() != null ? previa.getDeletedAt().toString() : "",
                   "coincidencias",   String.valueOf(previas.size())));
        log.info("Factura {} es re-subida de la factura eliminada {} (número '{}')",
            invoice.getId(), previa.getId(), number);
    }

    /** Crea la factura temporal en estado PENDIENTE y le asigna su número consecutivo. */
    private Invoice createPendingInvoice(Company company, User user, String type) {
        var invoice = Invoice.builder()
                .company(company).uploadedBy(user)
                .type(type != null ? type : InvoiceType.INGRESO)
                .status(InvoiceStatus.PENDIENTE).currency("COP").build();
        invoice = invoiceRepository.save(invoice);
        invoice.setInvoiceNumber("FAC-" + String.format("%04d", invoice.getId()));
        return invoiceRepository.saveAndFlush(invoice);
    }

    /** Guarda el archivo en disco y registra su metadata como InvoiceFile. */
    private InvoiceFile storeInvoiceFile(Invoice invoice, MultipartFile file) {
        String path = storageService.store(file);
        String originalName = file.getOriginalFilename();
        var invoiceFile = InvoiceFile.builder()
                .invoice(invoice).fileName(originalName).filePath(path)
                .fileType(resolveFileType(originalName))
                .fileSizeKb((int) (file.getSize() / 1024)).build();
        return invoiceFileRepository.saveAndFlush(invoiceFile);
    }

    /** Deriva el tipo de archivo (PDF/JPG/PNG) de la extensión; por defecto PDF. */
    private String resolveFileType(String originalName) {
        String ext = originalName != null && originalName.contains(".")
                ? originalName.substring(originalName.lastIndexOf('.') + 1).toUpperCase() : "PDF";
        return List.of("PDF", "JPG", "PNG").contains(ext) ? ext : "PDF";
    }

    /** Crea el registro OCR (con flush) para que el OCR sincrónico pueda encontrarlo. */
    private OcrExtraction createOcrRecord(Invoice invoice) {
        var ocr = OcrExtraction.builder()
                .invoice(invoice).status("PROCESANDO").build();
        return ocrExtractionRepository.saveAndFlush(ocr);
    }

    /** Ejecuta el OCR sincrónico; si falla, limpia el archivo y propaga para forzar rollback. */
    private void runOcrOrRollback(Long invoiceId, Long ocrId, String localPath) {
        try {
            ocrService.processSync(invoiceId, ocrId);
        } catch (Exception e) {
            log.error("OCR falló para factura {}: {}", invoiceId, e.getMessage());
            storageService.delete(localPath);
            throw new RuntimeException("No se pudo procesar la factura. " +
                    "Verifica que la imagen sea legible y vuelve a intentarlo.", e);
        }
    }

    /**
     * Programa la subida de la imagen a Supabase para que ocurra en segundo plano DESPUÉS
     * de que la transacción del upload haga commit (así el InvoiceFile ya es visible desde el
     * hilo asíncrono). Captura los bytes ahora porque el MultipartFile no estará disponible después.
     */
    private void scheduleSupabaseUpload(InvoiceFile invoiceFile, MultipartFile file, Long invoiceId) {
        if (!supabaseStorageService.isConfigured()) return;

        final Long invoiceFileId   = invoiceFile.getId();
        final String localPath     = invoiceFile.getFilePath();
        final String filename      = "invoices/" + Paths.get(localPath).getFileName().toString();
        final String contentType   = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        final byte[] content;
        try {
            content = file.getBytes();
        } catch (IOException e) {
            log.warn("No se pudieron leer los bytes de la factura {} para Supabase: {}", invoiceId, e.getMessage());
            return;
        }

        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                invoiceFileUploader.uploadToSupabaseAsync(
                        invoiceFileId, content, contentType, filename, localPath, invoiceId);
            }
        });
    }

    @Transactional
    public InvoiceDto confirm(Long id, InvoiceUploadRequest req) {
        // Validar acceso a la factura
        var invoice = authorizationService.verifyInvoiceAccess(id);
        var user = authorizationService.getCurrentUser();
        applyEditableFields(invoice, req);
        if (req.providerId() != null) {
            providerRepository.findById(req.providerId())
                .ifPresent(invoice::setProvider);
        }
        invoice.setStatus(InvoiceStatus.CONFIRMADA);
        invoice.setConfirmedAt(LocalDateTime.now());
        invoice = invoiceRepository.save(invoice);
        accountingService.generateEntries(invoice, user, req);
        invoice.setStatus(InvoiceStatus.CONTABILIZADA);
        invoice = invoiceRepository.save(invoice);
        auditLogService.record("INVOICE", id, "CONTABILIZACION", user.getId(), invoiceAuditPayload(invoice));
        return toDto(invoice);
    }

    @Transactional
    public InvoiceDto update(Long id, InvoiceUploadRequest req) {
        var invoice = authorizationService.verifyInvoiceAccess(id);
        var user    = authorizationService.getCurrentUser();
        applyEditableFields(invoice, req);
        invoice = invoiceRepository.save(invoice);
        if (InvoiceStatus.CONTABILIZADA.equals(invoice.getStatus()) || InvoiceStatus.CONFIRMADA.equals(invoice.getStatus())) {
            accountingService.regenerateEntries(invoice, user);
        }
        auditLogService.record("INVOICE", id, "EDICION", user.getId(), invoiceAuditPayload(invoice));
        return toDto(invoice);
    }

    public String getImageUrl(Long id) {
        authorizationService.verifyInvoiceAccess(id);
        return invoiceFileRepository.findByInvoiceId(id).stream()
                .map(InvoiceFile::getFileUrl)
                .filter(url -> url != null && !url.isBlank())
                .findFirst()
                .orElse(null);
    }

    @Transactional
    public void delete(Long id) {
        authorizationService.verifyDeleteAccess(id);
        Invoice invoice = invoiceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Factura no encontrada: " + id));

        // Limpiar archivos de Supabase antes de borrar registros
        invoiceFileRepository.findByInvoiceId(id).forEach(f -> {
            if (f.getFileUrl() != null && !f.getFileUrl().isBlank()) {
                supabaseStorageService.delete(f.getFileUrl());
            }
        });

        // Eliminar asientos contables y dependencias físicamente
        accountingService.deleteEntriesByInvoiceId(id);
        ocrExtractionRepository.deleteByInvoiceId(id);
        invoiceFileRepository.deleteByInvoiceId(id);

        var user = authorizationService.getCurrentUser();
        String invoiceNumber = invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : "";
        invoice.setDeletedAt(LocalDateTime.now());
        invoiceRepository.save(invoice);
        auditLogService.record("INVOICE", id, "ELIMINACION", user.getId(),
            Map.of("invoiceNumber", invoiceNumber));
    }

    @Transactional
    public InvoiceDto contabilizar(Long id) {
        var invoice = authorizationService.verifyInvoiceAccess(id);
        if (!InvoiceStatus.PENDIENTE.equals(invoice.getStatus())) {
            throw new IllegalStateException("Solo se pueden contabilizar facturas en estado PENDIENTE");
        }
        var user = authorizationService.getCurrentUser();
        invoice.setStatus(InvoiceStatus.CONTABILIZADA);
        invoice.setConfirmedAt(LocalDateTime.now());
        invoice = invoiceRepository.save(invoice);
        accountingService.generateEntries(invoice, user);
        auditLogService.record("INVOICE", id, "CONTABILIZACION", user.getId(), invoiceAuditPayload(invoice));
        return toDto(invoice);
    }

    /** Copia a la factura los campos editables del request que vengan con valor (no nulos). */
    private void applyEditableFields(Invoice invoice, InvoiceUploadRequest req) {
        if (req.invoiceNumber() != null) invoice.setInvoiceNumber(req.invoiceNumber());
        if (req.invoiceDate()   != null) invoice.setInvoiceDate(req.invoiceDate());
        if (req.subtotal()      != null) invoice.setSubtotal(req.subtotal());
        if (req.taxAmount()     != null) invoice.setTaxAmount(req.taxAmount());
        if (req.total()         != null) invoice.setTotal(req.total());
        if (req.notes()         != null) invoice.setNotes(req.notes());
        if (req.rfc()           != null) invoice.setTaxId(req.rfc());
        if (req.paymentMethod() != null) invoice.setPaymentMethod(req.paymentMethod());
    }

    /** Metadata estándar de auditoría para una factura (número + total). */
    private Map<String, Object> invoiceAuditPayload(Invoice invoice) {
        return Map.of(
            "invoiceNumber", invoice.getInvoiceNumber() != null ? invoice.getInvoiceNumber() : "",
            "total",         invoice.getTotal() != null ? invoice.getTotal().toString() : "0");
    }

    public List<AuditLogDto> getHistory(Long id) {
        authorizationService.verifyInvoiceAccess(id);
        return auditLogService.getInvoiceHistory(id);
    }

    private InvoiceDto toDto(Invoice i) {
        String providerName = i.getProvider() != null ? i.getProvider().getName() : null;
        // Si no hay Provider vinculado, intentar extraer el nombre del campo notes
        // (OcrService guarda "Comercio: XXXX | concepto" en notes)
        if (providerName == null && i.getNotes() != null && i.getNotes().startsWith("Comercio: ")) {
            providerName = i.getNotes().split("\\|")[0].replace("Comercio: ", "").trim();
        }
        return new InvoiceDto(i.getId(), i.getInvoiceNumber(), i.getInvoiceDate(),
                i.getType(), i.getStatus(), i.getSubtotal(), i.getTaxAmount(), i.getTotal(),
                i.getCurrency(), providerName,
                i.getCompany().getName(), i.getCompany().getId(),
                i.getProvider() != null ? i.getProvider().getId() : null,
                i.getCreatedAt(), i.getNotes(),
                i.getTaxId(), i.getPaymentMethod());
    }
}
