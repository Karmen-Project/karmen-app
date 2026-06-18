package com.karmen.api.service;

import com.karmen.api.domain.repository.InvoiceFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Sube el archivo de la factura a Supabase Storage en segundo plano, fuera de la
 * ruta crítica del upload. Así el usuario no espera por la subida (1–3 s).
 *
 * <p>Best-effort: si la subida falla, se conserva la copia local. Debe invocarse
 * DESPUÉS del commit de la transacción del upload (ver {@code afterCommit} en
 * {@link InvoiceService}) para que el InvoiceFile ya sea visible desde este hilo.</p>
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InvoiceFileUploader {

    private final SupabaseStorageService supabaseStorageService;
    private final InvoiceFileRepository invoiceFileRepository;
    private final StorageService storageService;

    @Async
    @Transactional
    public void uploadToSupabaseAsync(Long invoiceFileId, byte[] content, String contentType,
                                      String supabaseFilename, String localPath, Long invoiceId) {
        try {
            String fileUrl = supabaseStorageService.upload(content, contentType, supabaseFilename);
            invoiceFileRepository.findById(invoiceFileId).ifPresent(f -> {
                f.setFileUrl(fileUrl);
                invoiceFileRepository.save(f);
            });
            storageService.delete(localPath);
            log.info("Imagen de factura {} subida a Supabase (async): {}", invoiceId, fileUrl);
        } catch (Exception e) {
            log.warn("No se pudo subir imagen de factura {} a Supabase (async), copia local conservada: {}",
                    invoiceId, e.getMessage());
        }
    }
}
