package com.karmen.api.service;

import java.util.Map;
import java.util.function.Supplier;

/**
 * Estrategia para extraer los campos de una factura. Permite agregar nuevos
 * extractores (IA, modelo propio, reglas...) sin modificar {@link OcrService}
 * (principio Abierto/Cerrado).
 *
 * <p>{@link OcrService} prueba los extractores en orden (ver {@code @Order} en cada
 * implementación) y usa el primero que esté habilitado; si lanza excepción, pasa
 * al siguiente. El extractor de respaldo (parser de reglas) debe ir último y estar
 * siempre habilitado para garantizar un resultado.</p>
 */
public interface InvoiceFieldExtractor {

    /** Indica si este extractor está disponible (p. ej. hay API key configurada). */
    boolean isEnabled();

    /**
     * Extrae los campos de la factura.
     *
     * @param filePath  ruta local del archivo (la usan los extractores con visión).
     * @param rawText   proveedor perezoso del texto OCR de Tesseract. Solo se ejecuta
     *                  Tesseract cuando un extractor llama a {@code rawText.get()}
     *                  (extractores de texto o de respaldo); los de visión lo omiten.
     * @param invoiceId id de la factura (para logs).
     * @return mapa con las claves estándar: numero, fecha, empresa, rfc, concepto,
     *         metodoPago, subtotal, iva, total.
     */
    Map<String, Object> extract(String filePath, Supplier<String> rawText, Long invoiceId) throws Exception;
}
