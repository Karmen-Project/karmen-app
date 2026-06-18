package com.karmen.api.service;

import com.karmen.api.domain.entity.Invoice;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Map;
import java.util.function.Consumer;

/**
 * Vuelca los datos extraídos por OCR/IA ({@code Map<String,Object>}) sobre una
 * {@link Invoice}. Aislar este mapeo saca esa responsabilidad de {@link OcrService},
 * que solo debe orquestar el proceso de OCR.
 *
 * <p>Solo se sobrescribe un campo cuando el dato extraído trae un valor válido,
 * para no pisar con vacíos lo que ya tuviera la factura.</p>
 */
@Component
@Slf4j
public class InvoiceOcrMapper {

    // Marcadores de "sin dato" que produce el parser de respaldo: no se guardan.
    private static final String EMPRESA_SIN_NOMBRE = "Empresa sin nombre";
    private static final String CONCEPTO_GENERICO  = "Productos/Servicios varios";

    /** Aplica sobre la factura los campos extraídos que traen un valor válido. */
    public void applyTo(Invoice invoice, Map<String, Object> data, Long invoiceId) {
        applyInvoiceNumber(invoice, data);
        applyDate(invoice, data);
        applyNotes(invoice, data);
        applyAmount(data, "subtotal", invoice::setSubtotal,  invoiceId, "Subtotal");
        applyAmount(data, "iva",      invoice::setTaxAmount, invoiceId, "IVA");
        applyAmount(data, "total",    invoice::setTotal,     invoiceId, "Total");
        applyTaxId(invoice, data);
        applyPaymentMethod(invoice, data);
    }

    private void applyInvoiceNumber(Invoice invoice, Map<String, Object> data) {
        String numero = getString(data, "numero");
        if (numero != null) {
            invoice.setInvoiceNumber(numero);
        }
    }

    private void applyDate(Invoice invoice, Map<String, Object> data) {
        String fechaStr = getString(data, "fecha");
        if (fechaStr == null) return;
        try {
            invoice.setInvoiceDate(LocalDate.parse(fechaStr));
        } catch (Exception dateEx) {
            log.warn("No se pudo parsear la fecha '{}': {}", fechaStr, dateEx.getMessage());
        }
    }

    private void applyNotes(Invoice invoice, Map<String, Object> data) {
        String empresa  = getString(data, "empresa");
        String concepto = getString(data, "concepto");
        boolean hasEmpresa  = empresa != null && !empresa.isBlank() && !empresa.equals(EMPRESA_SIN_NOMBRE);
        boolean hasConcepto = concepto != null && !concepto.isBlank() && !concepto.equals(CONCEPTO_GENERICO);

        if (hasEmpresa) {
            String notes = "Comercio: " + empresa;
            if (hasConcepto) {
                notes += " | " + concepto;
            }
            invoice.setNotes(notes);
            log.info("Notas actualizadas: {}", notes);
        } else if (hasConcepto) {
            invoice.setNotes(concepto);
        }
    }

    /**
     * Parsea el monto y solo lo asigna si es mayor que cero. Un valor no numérico
     * lanza {@link NumberFormatException} que {@link OcrService} maneja (mismo
     * comportamiento que antes: aborta el resto del mapeo y no persiste).
     */
    private void applyAmount(Map<String, Object> data, String key, Consumer<BigDecimal> setter,
                             Long invoiceId, String label) {
        String raw = getString(data, key);
        if (raw == null) return;
        BigDecimal value = new BigDecimal(raw);
        if (value.compareTo(BigDecimal.ZERO) > 0) {
            setter.accept(value);
            log.info("{} actualizado a: {} (factura {})", label, value, invoiceId);
        }
    }

    private void applyTaxId(Invoice invoice, Map<String, Object> data) {
        String nit = getString(data, "rfc");
        if (nit != null && !nit.isBlank()) {
            invoice.setTaxId(nit);
            log.info("NIT actualizado a: {}", nit);
        }
    }

    private void applyPaymentMethod(Invoice invoice, Map<String, Object> data) {
        String metodoPago = getString(data, "metodoPago");
        if (metodoPago != null && !metodoPago.isBlank()) {
            invoice.setPaymentMethod(metodoPago);
            log.info("Método de pago actualizado a: {}", metodoPago);
        }
    }

    private String getString(Map<String, Object> map, String key) {
        Object val = map.get(key);
        return (val != null) ? val.toString() : null;
    }
}
