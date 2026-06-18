package com.karmen.api.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.genai.Client;
import com.google.genai.types.Content;
import com.google.genai.types.GenerateContentConfig;
import com.google.genai.types.GenerateContentResponse;
import com.google.genai.types.Part;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Service;

import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;

/**
 * Extrae los campos de una factura usando Gemini (Google Gen AI) — tier gratuito.
 *
 * <p>Reemplaza la lógica de {@link InvoiceParser}: en vez de enumerar patrones regex para
 * cada tipo de factura colombiana, le pide al modelo que devuelva un JSON estructurado.
 * Para imágenes usa visión (envía la imagen directo al modelo); para PDFs y otros usa el
 * texto crudo que produjo Tesseract.</p>
 *
 * <p>El resultado tiene exactamente las mismas claves que {@code InvoiceParser.parse(...)}
 * para que {@link OcrService} no necesite cambios al mapear a la entidad Invoice:
 * {@code numero, fecha, empresa, rfc, concepto, metodoPago, subtotal, iva, total}.</p>
 *
 * <p>API key: variable de entorno {@code GOOGLE_API_KEY} (gratis en Google AI Studio).
 * La recoge automáticamente {@code new Client()}.</p>
 */
@Service
@Order(1) // Se intenta primero; si falla, OcrService usa el siguiente extractor.
@Slf4j
public class GeminiInvoiceExtractor implements InvoiceFieldExtractor {

    private final boolean enabled;
    private final String model;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // El cliente mantiene pools de conexiones: se construye una sola vez (perezosamente).
    private volatile Client client;

    private static final String PROMPT = """
        Eres un experto en contabilidad colombiana. Extrae los datos de esta factura o
        tiquete de venta (factura electrónica DIAN, POS térmico, tiquetes PSE/zonapagos, etc.).

        Devuelve ÚNICAMENTE un objeto JSON válido con EXACTAMENTE estas claves (en minúscula):

        {
          "numero": string|null,      // número de factura o tiquete. null si no aparece.
          "fecha": string|null,       // fecha de emisión en formato yyyy-MM-dd. null si no aparece.
          "empresa": string|null,     // nombre del COMERCIO emisor. NO el cajero/vendedor ni el
                                       // "Proveedor Tecnológico"/operador que genera la factura para la DIAN.
          "rfc": string|null,         // NIT del emisor, conservando puntos y guion (ej "901.331.844-8").
          "concepto": string|null,    // descripción breve de los productos/servicios.
          "metodoPago": string|null,  // Efectivo | Crédito | Débito | Transferencia | Tarjeta.
                                       // Si hay franquicia, añádela: "Crédito (VISA)".
          "subtotal": string,         // base gravable, en pesos. Sin separador de miles, punto decimal. "0" si no aparece.
          "iva": string,              // valor del IVA, en pesos. Mismas reglas. "0" si no aparece.
          "total": string             // total a pagar, en pesos. Mismas reglas. "0" si no aparece.
        }

        Reglas para los montos: usa el punto como separador decimal y NO uses separador de
        miles (ej "38000" o "38000.00", nunca "38.000" ni "38,000"). Si solo hay total sin
        desglose, deja subtotal=total e iva="0". No inventes datos: usa null o "0" cuando no
        haya certeza.
        """;

    public GeminiInvoiceExtractor(
            @Value("${gemini.enabled:true}") boolean enabled,
            @Value("${gemini.model:gemini-2.5-flash}") String model) {
        this.enabled = enabled;
        this.model = model;
    }

    /** Indica si la extracción por IA está activa y hay API key disponible. */
    public boolean isEnabled() {
        return enabled
            && (System.getenv("GOOGLE_API_KEY") != null
                || System.getenv("GEMINI_API_KEY") != null
                || System.getProperty("google.api.key") != null);
    }

    /**
     * Extrae los campos de la factura. Decide visión (imagen) o texto (PDF/otros)
     * según la extensión del archivo.
     *
     * @param filePath  ruta local del archivo de la factura (la misma que usa Tesseract).
     * @param rawText   proveedor perezoso del texto OCR (solo se usa para no-imágenes).
     * @param invoiceId id de la factura (solo para logs).
     */
    @Override
    public Map<String, Object> extract(String filePath, java.util.function.Supplier<String> rawText, Long invoiceId) throws Exception {
        String ext = getExtension(filePath);
        String mediaType = imageMediaType(ext);

        Content content;
        if (mediaType != null) {
            byte[] bytes = Files.readAllBytes(Paths.get(filePath));
            log.info("Extracción IA (Gemini) por VISIÓN para factura {} ({} bytes, {})", invoiceId, bytes.length, mediaType);
            content = Content.fromParts(
                Part.fromBytes(bytes, mediaType),
                Part.fromText(PROMPT));
        } else {
            // No es imagen: se necesita el texto OCR de Tesseract (esto dispara su ejecución).
            String text = rawText.get();
            log.info("Extracción IA (Gemini) por TEXTO para factura {} ({} caracteres OCR)", invoiceId,
                text == null ? 0 : text.length());
            content = Content.fromParts(
                Part.fromText(PROMPT + "\n\nTexto OCR de la factura:\n\n" + text));
        }

        GenerateContentConfig config = GenerateContentConfig.builder()
            .responseMimeType("application/json")
            .build();

        GenerateContentResponse response = client().models.generateContent(model, content, config);
        String responseText = response.text();

        Map<String, Object> data = parseJson(responseText);
        log.info("Datos extraídos por IA para factura {}: número={}, fecha={}, empresa={}, nit={}, total={}",
            invoiceId, data.get("numero"), data.get("fecha"), data.get("empresa"),
            data.get("rfc"), data.get("total"));
        return data;
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> parseJson(String text) throws Exception {
        if (text == null) {
            throw new IllegalStateException("Respuesta vacía del modelo");
        }
        // Defensa: si el modelo envolvió el JSON en ```json ... ``` o añadió texto,
        // quedarse con lo que hay entre la primera "{" y la última "}".
        int start = text.indexOf('{');
        int end = text.lastIndexOf('}');
        if (start >= 0 && end > start) {
            text = text.substring(start, end + 1);
        }
        return objectMapper.readValue(text, Map.class);
    }

    private Client client() {
        Client c = client;
        if (c == null) {
            synchronized (this) {
                c = client;
                if (c == null) {
                    // Lee GOOGLE_API_KEY (o GEMINI_API_KEY) del entorno automáticamente.
                    c = new Client();
                    client = c;
                }
            }
        }
        return c;
    }

    private String getExtension(String path) {
        if (path == null) return "";
        int lastDot = path.lastIndexOf('.');
        return lastDot > 0 ? path.substring(lastDot + 1).toLowerCase() : "";
    }

    /** Devuelve el media type de imagen para la extensión, o null si no es imagen soportada. */
    private String imageMediaType(String ext) {
        return switch (ext) {
            case "jpg", "jpeg" -> "image/jpeg";
            case "png"         -> "image/png";
            case "gif"         -> "image/gif";
            case "webp"        -> "image/webp";
            default            -> null;
        };
    }
}
