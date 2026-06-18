package com.karmen.api.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.*;
import java.util.regex.*;

@Component
@Order(2) // Respaldo: siempre disponible; se usa si los extractores previos fallan o están deshabilitados.
public class InvoiceParser implements InvoiceFieldExtractor {

    private static final Logger log = LoggerFactory.getLogger(InvoiceParser.class);

    /** El parser de reglas siempre está disponible como respaldo. */
    @Override
    public boolean isEnabled() {
        return true;
    }

    /** Adapta el parser a la interfaz: trabaja sobre el texto OCR (lo solicita al supplier) e ignora el archivo. */
    @Override
    public Map<String, Object> extract(String filePath, java.util.function.Supplier<String> rawText, Long invoiceId) {
        return parse(rawText.get(), invoiceId);
    }

    // Compilado una sola vez — evita recompilación por línea y problemas de encoding con acentos
    private static final Pattern PAYMENT_LINE_PAT = Pattern.compile(
        "^(?:EFECTIVO|CAMBIO|VUELTO|DEVUELTA|DEVUELTO|TARJETA|"
        + "DEBITO|DÉBITO|CREDITO|CRÉDITO|"
        + "VALOR\\s+(?:EN\\s+)?EFECTIVO|DINERO\\s+RECIBIDO)"
        + "(?:[:\\s].+)?$",
        Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);

    private static final List<DateTimeFormatter> DATE_FORMATS = Arrays.asList(
        DateTimeFormatter.ofPattern("dd/MM/yyyy"),
        DateTimeFormatter.ofPattern("dd-MM-yyyy"),
        DateTimeFormatter.ofPattern("yyyy-MM-dd"),
        DateTimeFormatter.ofPattern("dd.MM.yyyy"),
        DateTimeFormatter.ofPattern("MM/dd/yyyy")
    );

    public Map<String, Object> parse(String rawText, Long invoiceId) {
        Map<String, Object> data = new HashMap<>();

        if (rawText == null || rawText.isBlank()) {
            log.warn("Texto OCR vacío para factura {}", invoiceId);
            return data;
        }

        data.put("numero",     extractInvoiceNumber(rawText));
        data.put("fecha",      extractDate(rawText));
        data.put("empresa",    extractCompanyName(rawText));
        data.put("rfc",        extractTaxId(rawText));
        data.put("concepto",   extractConcept(rawText));
        data.put("metodoPago", extractPaymentType(rawText));

        ExtractResult amounts = extractAmounts(rawText);
        data.put("subtotal", amounts.subtotal.toString());
        data.put("iva",      amounts.tax.toString());
        data.put("total",    amounts.total.toString());

        log.info("Datos parseados para factura {}: número={}, fecha={}, empresa={}, nit={}, metodoPago={}, subtotal={}, iva={}, total={}",
            invoiceId, data.get("numero"), data.get("fecha"), data.get("empresa"),
            data.get("rfc"), data.get("metodoPago"),
            data.get("subtotal"), data.get("iva"), data.get("total"));

        return data;
    }

    // ── Número de factura ────────────────────────────────────────────────────

    private String extractInvoiceNumber(String text) {
        Pattern[] patterns = {
            // Tiquetes de pago (zonapagos, PSE, etc.)
            Pattern.compile("(?:Ticket|Transacci[oó]n\\s*CUS)[:\\s]+([\\w\\d-]+)", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?:Referencia\\s*de\\s*pago|C[oó]d\\.?\\s*del\\s*pedido)[:\\s]+([\\w\\d-]+)", Pattern.CASE_INSENSITIVE),
            // Consecutivo electrónico / Número Interno — Adidas, Falabella, D1 electrónica
            Pattern.compile("(?:Consecutivo\\s+Electr[oó]nico|N[uú]mero\\s+Interno)[:\\s]+([A-Z0-9-]{4,30})", Pattern.CASE_INSENSITIVE),
            // Factura Electrónica de Venta colombiana — POS D1, Éxito, McDonald's, etc.
            // Ej: "Factura Electronica de Venta M1A179063"
            //     "Factura electronica de Venta: PNTE00152694"  ← con dos puntos
            Pattern.compile("Factura\\s+Electr[oó]nica\\s+de\\s+Venta[:\\s]+([A-Z0-9]{4,20})", Pattern.CASE_INSENSITIVE),
            // Facturas electrónicas colombianas (ej: Documento: FEEN739092)
            Pattern.compile("(?:Documento|Doc\\.?)[:\\s]+([A-Z0-9-]{4,30})", Pattern.CASE_INSENSITIVE),
            // Formatos colombianos clásicos — \\b evita capturar dentro de palabras como "FACTURADOR"
            Pattern.compile("\\b(FACT?-\\d{4}-\\d{3,})\\b", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bFACTURA\\b[\\s:#Nº°]*([A-Z0-9][-A-Z0-9]{3,24})", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\bFACT\\b[\\s:#Nº°]*([A-Z0-9][-A-Z0-9]{3,24})", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?:NUM|NUMBER|NRO|N\\.?)[°º]?[:\\s]*([A-Z0-9-]{5,30})", Pattern.CASE_INSENSITIVE),
            Pattern.compile("(?:Invoice|Number|Num)[:\\s#]*([A-Z0-9-]{5,30})", Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\b(\\d{3}-\\d{3}-\\d{3})\\b"),
            Pattern.compile("\\b([A-Z]{2,4}\\d{6,10})\\b")
        };

        for (Pattern pattern : patterns) {
            Matcher m = pattern.matcher(text);
            if (m.find()) {
                String number = m.group(1).trim();
                if (number.length() >= 3 && number.length() <= 30) {
                    number = number.replaceAll("^[-]+|[-]+$", "").toUpperCase();
                    log.debug("Número de factura encontrado: {}", number);
                    return number;
                }
            }
        }
        return null; // se asigna en InvoiceService
    }

    // ── Fecha ────────────────────────────────────────────────────────────────

    private String extractDate(String text) {
        Pattern[] patterns = {
            // "Realizado el: 27/12/2025 06:08:53.0"
            Pattern.compile("(?:Realizado\\s*el|Fecha\\s*de\\s*pago)[:\\s]*(\\d{1,2}[/\\-.](\\d{1,2})[/\\-.](\\d{4}))",
                Pattern.CASE_INSENSITIVE),
            // "Fecha y Hora: 28/05/2026 - 21:57:29" — facturas electrónicas Adidas, Falabella, etc.
            Pattern.compile("Fecha\\s+y\\s+Hora[:\\s]*(\\d{1,2}[/\\-.](\\d{1,2})[/\\-.](\\d{4}))",
                Pattern.CASE_INSENSITIVE),
            // "Fecha documento: 18/01/2025" — facturas electrónicas colombianas
            Pattern.compile("(?:Fecha\\s+documento|Fecha\\s+emisi[oó]n|Fecha\\s+factura)[:\\s]*(\\d{1,2}[/\\-.](\\d{1,2})[/\\-.](\\d{4}))",
                Pattern.CASE_INSENSITIVE),
            // Etiqueta explícita simple: "FECHA:", "DATE:"
            Pattern.compile("(?:FECHA|DATE|FEC)[:\\s]*(\\d{1,2}[/\\-.](\\d{1,2})[/\\-.](\\d{2,4}))",
                Pattern.CASE_INSENSITIVE),
            // ISO — grupo 1 = fecha completa
            Pattern.compile("\\b(\\d{4}[/\\-]\\d{1,2}[/\\-]\\d{1,2})\\b"),
            // dd/mm/yyyy sin etiqueta — grupo 1 = fecha completa
            Pattern.compile("\\b(\\d{1,2}[/\\-.]\\d{1,2}[/\\-.]\\d{4})\\b")
        };

        for (Pattern pattern : patterns) {
            Matcher m = pattern.matcher(text);
            if (m.find()) {
                String match = m.group(1) != null ? m.group(1) : m.group();
                LocalDate date = parseDate(match);
                if (date != null) {
                    log.debug("Fecha encontrada: {}", date);
                    return date.toString();
                }
            }
        }
        return LocalDate.now().toString();
    }

    private LocalDate parseDate(String dateStr) {
        // Quitar hora si viene adjunta: "27/12/2025 06:08"
        dateStr = dateStr.trim().split("\\s+")[0];

        for (DateTimeFormatter fmt : DATE_FORMATS) {
            try { return LocalDate.parse(dateStr, fmt); } catch (DateTimeParseException ignored) {}
        }
        try {
            String[] p = dateStr.split("[/\\-.]");
            if (p.length == 3) {
                int a, b, c;
                a = Integer.parseInt(p[0]);
                b = Integer.parseInt(p[1]);
                c = Integer.parseInt(p[2]);
                int day, month, year;
                if (a > 31) { year = a; month = b; day = c; }
                else         { day = a; month = b; year = c; }
                if (year < 100) year += 2000;
                if (month >= 1 && month <= 12 && day >= 1 && day <= 31)
                    return LocalDate.of(year, month, day);
            }
        } catch (Exception ignored) {}
        return null;
    }

    // ── Nombre de empresa / proveedor ────────────────────────────────────────

    private String extractCompanyName(String text) {
        String[] lines = text.split("\\r?\\n");

        // 1. "Comercio: XXXX" — zonapagos formato v1
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.matches("(?i)Comercio[:\\s]+.{3,}")) {
                String name = line.replaceFirst("(?i)^Comercio[:\\s]+", "").trim();
                if (name.length() >= 3) {
                    log.debug("Empresa (Comercio): {}", name);
                    return name;
                }
            }
        }

        // 2. "Razón social ó recaudador: XXXX" — zonapagos formato v2/v3
        //    El nombre puede estar en la misma línea o en la(s) siguiente(s)
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.matches("(?i)Raz[oó]n\\s+social.*recaudador.*")) {
                String value = line.replaceFirst("(?i)^Raz[oó]n\\s+social[^:]*:[\\s]*", "").trim();
                if (value.length() < 5 && i + 1 < lines.length) {
                    // Nombre en la(s) línea(s) siguiente(s)
                    StringBuilder sb = new StringBuilder();
                    for (int j = i + 1; j < Math.min(i + 3, lines.length); j++) {
                        String next = lines[j].trim();
                        if (next.isEmpty() || next.matches("(?i)(Concepto|Nombre|Identificaci[oó]n|Valor|Medio|Banco).*"))
                            break;
                        if (sb.length() > 0) sb.append(" ");
                        sb.append(next);
                    }
                    value = sb.toString().trim();
                }
                if (value.length() >= 5) {
                    log.debug("Empresa (Razón social): {}", value);
                    return value;
                }
            }
        }

        // 3. Facturas electrónicas colombianas: "Nombre facturador:" / "Nombre comercio:"
        for (int i = 0; i < lines.length; i++) {
            String line = lines[i].trim();
            Matcher mFact = Pattern.compile(
                "(?:Nombre\\s+facturador|Nombre\\s+comercio|Nombre\\s+emisor)[:\\s]+(.{3,100})",
                Pattern.CASE_INSENSITIVE).matcher(line);
            if (mFact.find()) {
                String name = mFact.group(1).trim();
                if (name.length() >= 3) {
                    log.debug("Empresa (Nombre facturador): {}", name);
                    return name;
                }
            }
        }

        // 4. Facturas electrónicas: línea inmediatamente anterior al NIT
        //    Adidas, Falabella, McDonald's, etc. ponen el nombre de la empresa en la
        //    línea justo antes de "NIT: 805.011.074-2" o "NIT.800.244.387-4" (con punto).
        //    Se ejecuta ANTES de los patrones de etiqueta para evitar que
        //    "Vendedor: NOMBRE PERSONA" o "Proveedor Tecnologico" tengan prioridad.
        //    [:\s.] cubre el punto que usan algunos tiquetes como separador (NIT.800...).
        for (int i = 1; i < lines.length; i++) {
            String line = lines[i].trim();
            if (line.matches("(?i)NIT[:\\s.]+[\\d.\\-]+.*")) {
                String candidate = lines[i - 1].trim();
                if (candidate.length() >= 3
                        && !candidate.toUpperCase().contains("FACTURA")
                        && !candidate.matches(".*\\d{6,}.*")) {
                    log.debug("Empresa (línea antes de NIT): {}", candidate);
                    return candidate;
                }
            }
        }

        // 5. Etiquetas genéricas — VENDEDOR excluido intencionalmente:
        //    en facturas POS/electrónicas "Vendedor:" se refiere al cajero/vendedor
        //    de la tienda, no a la empresa emisora.
        //    PROVEEDOR(?!\s+Tecnol) excluye "Proveedor Tecnologico: Carvajal..." que
        //    es el operador que genera la factura electrónica para la DIAN, no el comercio.
        Pattern labelPattern = Pattern.compile(
            "(?:EMPRESA|RAZON\\s*SOCIAL|COMPANY|SELLER|PROVEEDOR(?!\\s+Tecnol))[:\\s]+([^\\n\\r]{5,100})",
            Pattern.CASE_INSENSITIVE | Pattern.UNICODE_CASE);
        Matcher m = labelPattern.matcher(text);
        if (m.find()) {
            String name = m.group(1).trim().replaceAll("\\s+", " ");
            if (name.length() >= 5) {
                log.debug("Empresa (label): {}", name);
                return name;
            }
        }

        // 6. POS colombianos: "NOMBRE_EMPRESA NIT123456789-1 ..."
        //     La empresa y el NIT están en la misma línea → extraer lo que está ANTES del NIT
        for (String line : lines) {
            Matcher mNitInline = Pattern.compile(
                "^(.{3,40})\\s+NIT\\d",
                Pattern.CASE_INSENSITIVE).matcher(line.trim());
            if (mNitInline.find()) {
                String name = mNitInline.group(1).trim();
                if (name.length() >= 2) {
                    log.debug("Empresa (antes de NIT inline): {}", name);
                    return name;
                }
            }
        }

        // 6. Heurística: primera línea significativa
        for (String line : lines) {
            line = line.trim();
            String upper = line.toUpperCase();
            if (line.length() > 4
                && !line.matches(".*\\d{5,}.*")
                && !upper.contains("FACTURA") && !upper.contains("NIT")
                && !upper.contains("RUC")     && !upper.contains("RFC")
                && !upper.contains("TELEFONO")&& !upper.contains("FECHA")
                && !upper.contains("SUBTOTAL")&& !upper.contains("IVA")
                && !upper.contains("TOTAL")   && !upper.contains("INICIO")
                && line.matches(".*[A-Z]{4,}.*")) {
                String clean = line.replaceAll("[^A-ZÁÉÍÓÚÑ\\s&,.-]", "").trim();
                if (clean.length() >= 5) {
                    log.debug("Empresa (heurística): {}", clean);
                    return clean;
                }
            }
        }
        return "Empresa sin nombre";
    }

    // ── NIT / RFC / Tax ID ───────────────────────────────────────────────────

    private String extractTaxId(String text) {
        // El "Proveedor Tecnologico ... Nit: 890.321.151-0" (Carvajal, etc.) que generan
        // la factura electrónica para la DIAN aparece al final y NO es el NIT del comercio.
        // Se elimina ese bloque antes de buscar para no capturar su NIT por error.
        String cleanText = text.replaceAll(
            "(?is)Proveedor\\s+Tecnol[oó]gico.*", "");

        Pattern[] patterns = {
            // NIT colombiano: "NIT: 901.331.844-8" o "NIT.800.244.387-4" (punto separador)
            Pattern.compile("(?:NIT|N\\.?I\\.?T\\.?|RUC|TAX\\s*ID|RFC|NIF)[:\\s.]*([\\d][\\d\\-.\\sA-Z]{6,20}[\\dkK])",
                Pattern.CASE_INSENSITIVE),
            Pattern.compile("\\b(\\d{3}\\.\\d{3}\\.\\d{3}[-]?\\d)\\b"),
            Pattern.compile("\\b(\\d{8,10}[-]?\\d)\\b"),
            Pattern.compile("\\b(\\d{6}[-]?\\d{3}[-]?\\d{3})\\b"),
            Pattern.compile("\\b([A-Z]{2}\\d{8,12})\\b")
        };
        for (Pattern p : patterns) {
            Matcher m = p.matcher(cleanText);
            if (m.find()) {
                // Conservar el formato original (puntos/guion) para mostrarlo,
                // quitando solo espacios sobrantes que el OCR pueda introducir.
                String formatted = m.group(1).trim().replaceAll("\\s+", "");
                String digits = formatted.replaceAll("[^A-Za-z0-9]", "");
                if (digits.length() >= 8 && digits.length() <= 15) {
                    log.debug("Tax ID: {}", formatted);
                    return formatted;
                }
            }
        }
        return "";
    }

    // ── Método de pago ───────────────────────────────────────────────────────

    private String extractPaymentType(String text) {
        // Franquicia de tarjeta (MASTERCARD, VISA, AMEX, DINERS, MAESTRO)
        Matcher mFranq = Pattern.compile(
            "\\b(MASTERCARD|VISA|AMERICAN\\s*EXPRESS|AMEX|DINERS(?:\\s*CLUB)?|MAESTRO)\\b",
            Pattern.CASE_INSENSITIVE).matcher(text);
        String franquicia = mFranq.find()
            ? mFranq.group(1).toUpperCase().replaceAll("\\s+", " ")
            : null;

        String tipo = null;
        // "T. Crédito", "Tarjeta de crédito", "TC"
        if (Pattern.compile("(?i)(?:T\\.?\\s*|tarjeta\\s+(?:de\\s+)?)cr[eé]dito").matcher(text).find()) {
            tipo = "Crédito";
        } else if (Pattern.compile("(?i)(?:T\\.?\\s*|tarjeta\\s+(?:de\\s+)?)d[eé]bito").matcher(text).find()) {
            tipo = "Débito";
        } else if (Pattern.compile("(?i)\\befectivo\\b").matcher(text).find()) {
            tipo = "Efectivo";
        } else if (Pattern.compile("(?i)\\b(?:PSE|transferencia|nequi|daviplata)\\b").matcher(text).find()) {
            tipo = "Transferencia";
        } else if (franquicia != null) {
            tipo = "Tarjeta";
        }

        String result;
        if (tipo != null && franquicia != null) result = tipo + " (" + franquicia + ")";
        else if (tipo != null)                  result = tipo;
        else if (franquicia != null)            result = "Tarjeta (" + franquicia + ")";
        else                                    result = "";

        if (!result.isBlank()) log.debug("Método de pago: {}", result);
        return result;
    }

    // ── Concepto / Descripción ───────────────────────────────────────────────

    private String extractConcept(String text) {
        // 1. "Descripción:" explícito (tiquetes)
        Pattern descPattern = Pattern.compile(
            "(?:Descripci[oó]n|Concepto|Description)[:\\s]+([^\\n\\r]{5,120})",
            Pattern.CASE_INSENSITIVE);
        Matcher m = descPattern.matcher(text);
        if (m.find()) {
            String concept = m.group(1).trim();
            log.debug("Concepto (label): {}", concept);
            return concept;
        }

        // 2. Heurística: línea de texto libre mediana
        for (String line : text.split("\\n")) {
            line = line.trim();
            if (line.length() > 10 && line.length() < 120
                && !line.matches(".*\\d{5,}.*")
                && !line.toUpperCase().contains("FACTURA")
                && !line.toUpperCase().contains("SUBTOTAL")
                && !line.toUpperCase().contains("TOTAL")
                && !line.toUpperCase().contains("COMERCIO")
                && line.matches(".*[A-Za-z]{3,}.*")) {
                log.debug("Concepto (heurística): {}", line);
                return line;
            }
        }
        return "Productos/Servicios varios";
    }

    // ── Montos ───────────────────────────────────────────────────────────────

    // Elimina líneas de medio de pago que no forman parte del valor de la factura.
    // Sin esto, "EFECTIVO: 60,000" puede ser tomado como total cuando el cliente
    // entrega más dinero que el valor real de la factura.
    private String stripPaymentLines(String text) {
        StringBuilder sb = new StringBuilder();
        for (String line : text.split("\\r?\\n")) {
            if (!PAYMENT_LINE_PAT.matcher(line.trim()).matches()) {
                sb.append(line).append("\n");
            }
        }
        return sb.toString();
    }

    private ExtractResult extractAmounts(String text) {
        // Quitar líneas de medio de pago antes de analizar montos
        text = stripPaymentLines(text);
        log.info("=== TEXTO PROCESADO POR extractAmounts (primeros 600 chars) ===\n{}",
            text.length() > 600 ? text.substring(0, 600) + "..." : text);

        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal tax      = BigDecimal.ZERO;
        BigDecimal total    = BigDecimal.ZERO;

        // Anclar al inicio de línea con ^ + MULTILINE para evitar que "SUBTOTAL" dispare "TOTAL".
        // Cubre: "TOTAL:", "TOTAL A PAGAR:", "GRAN TOTAL:", "TOTAL COP 9500", "TOTAL FACTURA:",
        //        "TOTAL (COP):" (facturas electrónicas Adidas, Falabella, etc.)
        // (?:\\s*\\([A-Z]{2,3}\\))? cubre el código de moneda entre paréntesis antes de los ":"
        // (?:[A-Z]{2,3}\\s+)?       cubre el código de moneda antes del número
        Pattern totalPat = Pattern.compile(
            "^\\s*(?:GRAN\\s*TOTAL|TOTAL\\s+(?:A\\s+PAGAR|FACTURA|COMPROBANTE|VENTA|COBRAR)|VALOR\\s+(?:TOTAL|A\\s+PAGAR|FACTURA)|IMPORTE\\s+TOTAL|TOTAL(?!\\s*ES\\b))(?:\\s*\\([A-Z]{2,3}\\))?[:\\s\\t]+(?:[A-Z]{2,3}\\s+)?\\$?\\s*([\\d][\\d,.\\s']*)",
            Pattern.CASE_INSENSITIVE | Pattern.MULTILINE);

        // "Valor: $38,000.00 COP", "Valor cancelado: 33,000.00", "Valor obligación: 117,000.00"
        // Excluye "Valor efectivo" / "Valor en efectivo" para no confundirlo con el total de la factura
        Pattern valorPat = Pattern.compile(
            "^\\s*Valor(?!\\s*(?:en\\s+)?efectivo)[^:\\n]{0,20}:[\\s\\t]*\\$?\\s*([\\d][\\d,.]*(?:\\s*COP)?)",
            Pattern.CASE_INSENSITIVE | Pattern.MULTILINE);

        // SUBTOTAL — sin ambigüedad porque empieza la línea
        Pattern subPat = Pattern.compile(
            "^\\s*(?:SUBTOTAL|SUB[\\s.]?TOTAL|BASE\\s+GRAVABLE|VALOR\\s+ANTES\\s+(?:DE\\s+)?IVA|NETO)[:\\s\\t]+\\$?\\s*([\\d][\\d,.\\s']*)",
            Pattern.CASE_INSENSITIVE | Pattern.MULTILINE);

        // IVA — cubre:
        //   "IVA: 1517"         → etiqueta directa
        //   "IVA 19%: 1517"     → con porcentaje
        //   "INCL 19% IVA= 1517"→ formato McDonald's / facturas electrónicas
        //   "IMPUESTO:", "TAX:" → aliases internacionales
        Pattern taxPat = Pattern.compile(
            "^\\s*(?:IVA(?:\\s*\\(?\\s*\\d{1,2}\\s*%\\s*\\)?)?|I\\.?V\\.?A\\.?|IMPUESTO(?:\\s+(?:AL\\s+)?VALOR)?|IMPTO\\.?|TAX)[:\\s\\t]+\\$?\\s*([\\d][\\d,.\\s']*)",
            Pattern.CASE_INSENSITIVE | Pattern.MULTILINE);

        // Formato "INCL 19% IVA = 1517" — McDonald's, Rappi, facturas electrónicas
        Pattern inclIvaPat = Pattern.compile(
            "^\\s*INCL\\.?\\s*\\d{1,2}\\s*%\\s*IVA\\s*[=:]\\s*([\\d][\\d,.]*)",
            Pattern.CASE_INSENSITIVE | Pattern.MULTILINE);

        Matcher mTotal = totalPat.matcher(text);
        if (mTotal.find()) {
            total = parseAmount(mTotal.group(1));
            log.info("totalPat match: '{}' -> {}", mTotal.group(1).trim(), total);
        } else {
            log.warn("totalPat: SIN COINCIDENCIA");
        }

        // Si no hay TOTAL explícito, buscar "Valor:"
        if (total.compareTo(BigDecimal.ZERO) == 0) {
            Matcher mValor = valorPat.matcher(text);
            if (mValor.find()) {
                total = parseAmount(mValor.group(1));
                log.info("valorPat match: '{}' -> {}", mValor.group(1).trim(), total);
            } else {
                log.warn("valorPat: SIN COINCIDENCIA");
            }
        }

        // Fallback robusto para tiquetes retail (IKEA, Falabella, etc.):
        // "Total $  129,960" donde el OCR puede ensuciar la etiqueta. Toma el
        // mayor número en cualquier línea que contenga TOTAL, excluyendo
        // SUBTOTAL y las columnas "IVA Total" del resumen de impuestos.
        if (total.compareTo(BigDecimal.ZERO) == 0) {
            BigDecimal best = BigDecimal.ZERO;
            for (String line : text.split("\\r?\\n")) {
                String u = line.toUpperCase();
                if (u.contains("TOTAL") && !u.contains("SUBTOTAL") && !u.contains("IVA")) {
                    Matcher mn = Pattern.compile("([\\d][\\d,.]*[\\d])").matcher(line);
                    while (mn.find()) {
                        BigDecimal v = parseAmount(mn.group(1));
                        if (v.compareTo(best) > 0) best = v;
                    }
                }
            }
            if (best.compareTo(BigDecimal.ZERO) > 0) {
                total = best;
                log.info("totalLineFallback match -> {}", total);
            }
        }

        Matcher mSub = subPat.matcher(text);
        if (mSub.find()) {
            subtotal = parseAmount(mSub.group(1));
            log.info("subPat match: '{}' -> {}", mSub.group(1).trim(), subtotal);
        } else {
            log.warn("subPat: SIN COINCIDENCIA");
        }

        Matcher mTax = taxPat.matcher(text);
        if (mTax.find()) {
            tax = parseAmount(mTax.group(1));
            log.info("taxPat match: '{}' -> {}", mTax.group(1).trim(), tax);
        } else {
            log.warn("taxPat: SIN COINCIDENCIA");
        }

        // Fallback: "INCL 19% IVA = 1517" (McDonald's, Rappi, facturas electrónicas con IVA incluido)
        if (tax.compareTo(BigDecimal.ZERO) == 0) {
            Matcher mIncl = inclIvaPat.matcher(text);
            if (mIncl.find()) {
                tax = parseAmount(mIncl.group(1));
                log.info("inclIvaPat match: '{}' -> {}", mIncl.group(1).trim(), tax);
            }
        }

        // ── Tiquetes POS colombianos (D1, Éxito, Olímpica, etc.) ─────────────
        // La tabla "RESUMEN DE IMPUESTOS" termina con una fila de totales:
        //   101,562    12,848
        //   ^^^^^^^    ^^^^^^
        //   BASE TOTAL IVA TOTAL
        //
        // Estrategia: buscar cualquier línea con EXACTAMENTE dos tokens numéricos
        // cuya suma sea igual al total de la factura.
        // Se usa \\s+ (no \\s{2,}) porque Tesseract puede producir 1 o N espacios.
        if ((tax.compareTo(BigDecimal.ZERO) == 0 || subtotal.compareTo(BigDecimal.ZERO) == 0)
                && total.compareTo(BigDecimal.ZERO) > 0) {
            int resumIdx = text.toUpperCase().indexOf("RESUMEN");
            String searchArea = resumIdx >= 0 ? text.substring(resumIdx) : text;

            // [\\d][\\d,.]* cubre "101,562", "101562", "101.562"
            Pattern twoNumLinePat = Pattern.compile(
                "^\\s*([\\d][\\d,.]*[\\d])\\s+([\\d][\\d,.]*[\\d])\\s*$",
                Pattern.MULTILINE);
            Matcher mTwo = twoNumLinePat.matcher(searchArea);
            while (mTwo.find()) {
                BigDecimal n1 = parseAmount(mTwo.group(1));
                BigDecimal n2 = parseAmount(mTwo.group(2));
                // Validar: n1 (BASE) + n2 (IVA) = total exacto
                if (n1.add(n2).compareTo(total) == 0
                        && n1.compareTo(BigDecimal.ZERO) > 0
                        && n2.compareTo(BigDecimal.ZERO) > 0
                        && n1.compareTo(total) < 0) {
                    subtotal = n1;
                    tax      = n2;
                    log.info("POS RESUMEN totals: base={} iva={} suma={}", n1, n2, total);
                    break;
                }
            }
        }

        // Patrón bloque Alegra/DIAN: Subtotal y Total en misma línea con cada valor,
        // IVA sin etiqueta — captura los 3 montos del bloque resumen.
        // Ej: "Subtotal   $259.449\n   $32.651\nTotal   $292.100"
        if (tax.compareTo(BigDecimal.ZERO) == 0) {
            Pattern alegraBlock = Pattern.compile(
                "Subtotal[\\s\\t]+\\$?\\s*([\\d][\\d,.'.]*)\\s+\\$?\\s*([\\d][\\d,.'.]*)\\s+Total",
                Pattern.CASE_INSENSITIVE);
            Matcher mBlock = alegraBlock.matcher(text);
            if (mBlock.find()) {
                BigDecimal s = parseAmount(mBlock.group(1));
                BigDecimal t = parseAmount(mBlock.group(2));
                if (s.compareTo(BigDecimal.ZERO) > 0) subtotal = s;
                if (t.compareTo(BigDecimal.ZERO) > 0) tax      = t;
            }
        }

        // Fallback: si tenemos subtotal y total pero IVA = 0, derivarlo
        if (tax.compareTo(BigDecimal.ZERO) == 0
                && subtotal.compareTo(BigDecimal.ZERO) > 0
                && total.compareTo(subtotal) > 0) {
            tax = total.subtract(subtotal);
        }

        // Si solo tenemos total (tiquete sin desglose), calcular subtotal/IVA
        if (total.compareTo(BigDecimal.ZERO) > 0 && subtotal.compareTo(BigDecimal.ZERO) == 0
                && tax.compareTo(BigDecimal.ZERO) == 0) {
            // Los tiquetes de transporte suelen no tener IVA desglosado
            subtotal = total;
            tax      = BigDecimal.ZERO;
        } else if (total.compareTo(BigDecimal.ZERO) > 0 && subtotal.compareTo(BigDecimal.ZERO) == 0) {
            subtotal = total.subtract(tax);
        }

        // Fallback: buscar montos numéricos con $ en el texto
        if (total.compareTo(BigDecimal.ZERO) == 0) {
            BigDecimal[] nums = extractAllAmounts(text);
            if (nums.length >= 3) {
                Arrays.sort(nums, Collections.reverseOrder());
                total    = nums[0];
                subtotal = total.divide(new BigDecimal("1.19"), 2, java.math.RoundingMode.HALF_UP);
                tax      = total.subtract(subtotal);
            } else if (nums.length == 2) {
                total    = nums[0];
                tax      = nums[1];
                subtotal = total.subtract(tax);
            } else if (nums.length == 1) {
                total    = nums[0];
                subtotal = total;
            }
        }

        return new ExtractResult(subtotal, tax, total);
    }

    private BigDecimal[] extractAllAmounts(String text) {
        List<BigDecimal> amounts = new ArrayList<>();
        // Captura $38,000.00 / $ 38.000,00 / $38000
        Pattern p = Pattern.compile("\\$\\s*([\\d][\\d,.']*[\\d]|\\d)");
        Matcher m = p.matcher(text);
        while (m.find()) {
            BigDecimal amount = parseAmount(m.group(1));
            if (amount.compareTo(new BigDecimal("100")) > 0
                    && amount.compareTo(new BigDecimal("999999999")) < 0) {
                amounts.add(amount);
            }
        }
        return amounts.toArray(new BigDecimal[0]);
    }

    /**
     * Detecta automáticamente si el separador de miles/decimales es
     * formato US  (38,000.00) o colombiano/europeo (38.000,00).
     */
    private BigDecimal parseAmount(String raw) {
        if (raw == null) return BigDecimal.ZERO;

        String s = raw.trim()
            .replace("$", "")
            .replace("COP", "")
            .replace(" ", "")
            .replace("'", ""); // apóstrofe como miles (suizo)

        int lastComma = s.lastIndexOf(',');
        int lastDot   = s.lastIndexOf('.');

        if (lastComma > 0 && lastDot > 0) {
            if (lastDot > lastComma) {
                // US: 38,000.00  →  38000.00
                s = s.replace(",", "");
            } else {
                // Europeo: 38.000,00  →  38000.00
                s = s.replace(".", "").replace(",", ".");
            }
        } else if (lastComma > 0) {
            String afterComma = s.substring(lastComma + 1);
            if (afterComma.length() <= 2) {
                // Decimal: 38,00  →  38.00
                s = s.replace(",", ".");
            } else {
                // Miles: 38,000  →  38000
                s = s.replace(",", "");
            }
        } else if (lastDot > 0) {
            String afterDot = s.substring(lastDot + 1);
            if (afterDot.length() > 2) {
                // Miles: 38.000  →  38000
                s = s.replace(".", "");
            }
            // else: decimal normal  38.00  (sin cambio)
        }

        try {
            return new BigDecimal(s).setScale(2, java.math.RoundingMode.HALF_UP);
        } catch (NumberFormatException e) {
            log.trace("No se pudo parsear monto: '{}'", raw);
            return BigDecimal.ZERO;
        }
    }

    private static class ExtractResult {
        BigDecimal subtotal, tax, total;
        ExtractResult(BigDecimal s, BigDecimal t, BigDecimal tot) {
            subtotal = s; tax = t; total = tot;
        }
    }
}
