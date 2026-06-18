package com.karmen.api.service;


import com.karmen.api.domain.entity.InvoiceFile;
import com.karmen.api.domain.repository.InvoiceFileRepository;
import com.karmen.api.domain.repository.InvoiceRepository;
import com.karmen.api.domain.repository.OcrExtractionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

@Service
@RequiredArgsConstructor
@Slf4j
public class OcrService {
    private final OcrExtractionRepository ocrExtractionRepository;
    private final InvoiceRepository invoiceRepository;
    private final InvoiceFileRepository invoiceFileRepository;
    private final TesseractService tesseractService;
    // Inyectados en orden de @Order: IA primero, parser de reglas como respaldo.
    private final List<InvoiceFieldExtractor> invoiceFieldExtractors;
    private final InvoiceOcrMapper invoiceOcrMapper;

    @Async
    public void process(Long invoiceId) {
        processWithRetry(invoiceId, null);
    }

    /**
     * Versión SINCRÓNICA del OCR — lanzada dentro de la misma transacción de upload().
     * Si falla, propaga la excepción para que el rollback elimine la factura de la BD.
     */
    public void processSync(Long invoiceId, Long ocrId) {
        log.info("Iniciando OCR sincrónico para factura {}", invoiceId);
        doProcess(invoiceId, ocrId);
    }

    @Async
    public void processWithRetry(Long invoiceId, Long ocrId) {
        log.info("Iniciando OCR real para factura {}", invoiceId);
        try {
            doProcess(invoiceId, ocrId);
        } catch (Exception e) {
            log.error("OCR falló para factura {}: {}", invoiceId, e.getMessage());
            updateOcrStatus(invoiceId, "ERROR", e.getMessage());
        }
    }

    private void doProcess(Long invoiceId, Long ocrId) {
        int maxRetries = 3;
        int retryDelayMs = 800;

        for (int attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                var ocr = (ocrId != null)
                    ? ocrExtractionRepository.findById(ocrId).orElse(null)
                    : ocrExtractionRepository.findByInvoiceId(invoiceId).orElse(null);
                    
                if (ocr == null) {
                    if (attempt < maxRetries) {
                        log.warn("OCR no encontrado para factura {} (intento {}/{}), reintentando...", invoiceId, attempt, maxRetries);
                        Thread.sleep(retryDelayMs * attempt);
                        continue;
                    }
                    throw new RuntimeException("No se encontró OCR para factura " + invoiceId);
                }
                
                ocr.setStatus("PROCESANDO");
                ocrExtractionRepository.save(ocr);
                log.info("OCR status actualizado a PROCESANDO para factura {}", invoiceId);
                
                List<InvoiceFile> files = invoiceFileRepository.findByInvoiceId(invoiceId);
                if (files.isEmpty()) {
                    throw new RuntimeException("No se encontró archivo para la factura " + invoiceId);
                }
                
                InvoiceFile invoiceFile = files.get(0);
                String filePath = invoiceFile.getFilePath();
                log.info("Procesando archivo: {}", filePath);
                
                // Tesseract perezoso: solo se ejecuta si un extractor lo necesita (PDF o respaldo).
                // Para imágenes con Gemini (visión), Tesseract NO corre → la carga es más rápida.
                LazyOcrText rawText = new LazyOcrText(filePath);

                // Extracción de campos: se prueban los extractores en orden (IA primero, parser
                // de reglas como respaldo). El primero habilitado que no falle gana.
                Map<String, Object> extractedData = extractFields(filePath, rawText, invoiceId);
                ocr.setExtractedData(extractedData);

                // Guardar el texto OCR y la confianza solo si Tesseract llegó a ejecutarse.
                if (rawText.wasComputed()) {
                    String text = rawText.value();
                    ocr.setRawText(text);
                    ocr.setConfidenceScore(tesseractService.calculateConfidence(text));
                    log.info("Texto OCR ({} caracteres), confianza {}%", text.length(), ocr.getConfidenceScore());
                } else {
                    log.info("Tesseract omitido (extracción por visión) para factura {}", invoiceId);
                }
                
                ocr.setStatus("COMPLETADO");
                ocr.setProcessedAt(LocalDateTime.now());
                ocrExtractionRepository.save(ocr);
                log.info("OCR_EXTraction guardado para factura {}", invoiceId);
                
                var invoice = invoiceRepository.findById(invoiceId).orElse(null);
                if (invoice != null) {
                    try {
                        invoiceOcrMapper.applyTo(invoice, extractedData, invoiceId);
                        invoiceRepository.save(invoice);
                        log.info("Invoice {} actualizado con datos extraídos por OCR: subtotal={}, tax={}, total={}",
                            invoiceId, invoice.getSubtotal(), invoice.getTaxAmount(), invoice.getTotal());
                    } catch (Exception e) {
                        log.error("Error al actualizar invoice {} con datos OCR: {}", invoiceId, e.getMessage(), e);
                    }
                }
                
                log.info("OCR completado exitosamente para factura {}", invoiceId);
                return;
                
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                throw new RuntimeException("OCR interrumpido para factura " + invoiceId);
            } catch (Exception e) {
                log.error("Error OCR factura {} (intento {}/{}): {}", invoiceId, attempt, maxRetries, e.getMessage());
                if (attempt >= maxRetries) {
                    throw new RuntimeException("OCR falló después de " + maxRetries + " intentos: " + e.getMessage(), e);
                }
                try { Thread.sleep(retryDelayMs * attempt); } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("OCR interrumpido", ie);
                }
            }
        }
    }
    
    /**
     * Prueba los extractores en orden y devuelve el resultado del primero habilitado
     * que no falle. El parser de reglas (último, siempre habilitado) garantiza un resultado.
     */
    private Map<String, Object> extractFields(String filePath, Supplier<String> rawText, Long invoiceId) {
        for (InvoiceFieldExtractor extractor : invoiceFieldExtractors) {
            if (!extractor.isEnabled()) continue;
            try {
                return extractor.extract(filePath, rawText, invoiceId);
            } catch (Exception e) {
                log.warn("Extractor {} falló para factura {}, intentando el siguiente: {}",
                    extractor.getClass().getSimpleName(), invoiceId, e.getMessage());
            }
        }
        log.error("Ningún extractor disponible para factura {}", invoiceId);
        return Map.of();
    }

    /**
     * Proveedor perezoso del texto OCR: ejecuta Tesseract solo la primera vez que se
     * solicita ({@code get()}) y memoiza el resultado. Permite que los extractores de
     * visión omitan Tesseract por completo.
     */
    private final class LazyOcrText implements Supplier<String> {
        private final String filePath;
        private String value;
        private boolean computed;

        LazyOcrText(String filePath) {
            this.filePath = filePath;
        }

        @Override
        public String get() {
            if (!computed) {
                try {
                    value = tesseractService.extractText(filePath);
                } catch (IOException e) {
                    throw new RuntimeException("Error de E/S ejecutando Tesseract", e);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    throw new RuntimeException("Tesseract interrumpido", e);
                }
                computed = true;
            }
            return value;
        }

        boolean wasComputed() {
            return computed;
        }

        String value() {
            return value != null ? value : "";
        }
    }

    private void updateOcrStatus(Long invoiceId, String status, String errorMessage) {
        try {
            ocrExtractionRepository.findByInvoiceId(invoiceId).ifPresent(ocr -> {
                ocr.setStatus(status);
                ocr.setErrorMessage(errorMessage);
                ocrExtractionRepository.save(ocr);
            });
        } catch (Exception ex) {
            log.error("Error actualizando status OCR: {}", ex.getMessage());
        }
    }
}
