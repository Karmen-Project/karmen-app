package com.karmen.api.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.awt.*;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.*;
import java.math.BigDecimal;
import java.nio.file.*;
import java.util.*;
import java.util.regex.*;

@Service
@Slf4j
public class TesseractService {

    public String extractText(String filePath) throws IOException, InterruptedException {
        String extension = getFileExtension(filePath).toLowerCase();
        String text;
        
        if ("pdf".equals(extension)) {
            text = extractTextFromPdf(filePath);
        } else {
            text = extractTextFromImage(filePath);
        }
        
        return text;
    }

    private String extractTextFromImage(String imagePath) throws IOException, InterruptedException {
        log.info("Ejecutando Tesseract OCR en imagen: {}", imagePath);

        // Preprocesar la imagen (escala de grises + ampliación + contraste) para mejorar
        // la legibilidad. Los tiquetes térmicos fotografiados suelen tener baja resolución
        // y bajo contraste, lo que produce texto OCR corrupto en el encabezado.
        String ocrPath = imagePath;
        File preprocessed = null;
        try {
            preprocessed = preprocessImage(imagePath);
            if (preprocessed != null) ocrPath = preprocessed.getAbsolutePath();
        } catch (Exception e) {
            log.warn("Preprocesamiento de imagen falló, se usa la original: {}", e.getMessage());
        }

        ProcessBuilder pb = new ProcessBuilder(
            "tesseract", ocrPath, "stdout",
            "-l", "spa+eng",
            "--psm", "3",
            "--oem", "3",
            "--dpi", "300"   // evita el "Estimating resolution" y mejora la segmentación
        );
        // Hereda TESSDATA_PREFIX del entorno del contenedor (configurado en Dockerfile).
        // stderr se descarta: si se mezclara con stdout, mensajes de diagnóstico de
        // Tesseract ("Estimating resolution as 207", "Detected N diacritics") se colarían
        // como si fueran texto de la factura.
        pb.redirectError(ProcessBuilder.Redirect.DISCARD);

        Process process = pb.start();

        StringBuilder text = new StringBuilder();
        try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
            String line;
            while ((line = reader.readLine()) != null) {
                text.append(line).append("\n");
            }
        }

        int exitCode = process.waitFor();
        if (exitCode != 0) {
            log.warn("Tesseract terminó con código: {}", exitCode);
        }

        if (preprocessed != null) {
            try { Files.deleteIfExists(preprocessed.toPath()); } catch (IOException ignored) {}
        }

        log.info("OCR completado. Caracteres extraídos: {}", text.length());
        return text.toString();
    }

    /**
     * Mejora la imagen para OCR sin dependencias externas (Java puro):
     *  - Amplía la resolución si la imagen es pequeña (letra del tiquete muy chica).
     *  - Convierte a escala de grises.
     *  - Aplica estiramiento de contraste por percentiles (clave en papel térmico).
     * Devuelve un PNG temporal, o null si no se pudo procesar.
     */
    private File preprocessImage(String imagePath) throws IOException {
        BufferedImage src = ImageIO.read(new File(imagePath));
        if (src == null) return null;

        int w = src.getWidth();
        int h = src.getHeight();
        int minSide = Math.min(w, h);

        // Ampliar para que el lado menor tenga al menos ~1600px (mejora letra pequeña)
        double scale = 1.0;
        if (minSide > 0 && minSide < 1600) scale = 1600.0 / minSide;
        if (scale > 3.0) scale = 3.0;
        int nw = Math.max(1, (int) Math.round(w * scale));
        int nh = Math.max(1, (int) Math.round(h * scale));

        // Redibujar a escala de grises con interpolación bicúbica
        BufferedImage gray = new BufferedImage(nw, nh, BufferedImage.TYPE_BYTE_GRAY);
        Graphics2D g = gray.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION,
            RenderingHints.VALUE_INTERPOLATION_BICUBIC);
        g.setRenderingHint(RenderingHints.KEY_RENDERING,
            RenderingHints.VALUE_RENDER_QUALITY);
        g.drawImage(src, 0, 0, nw, nh, null);
        g.dispose();

        // Estiramiento de contraste por percentiles 2%–98% sobre el canal de gris
        var raster = gray.getRaster();
        int total = nw * nh;
        int[] hist = new int[256];
        for (int y = 0; y < nh; y++)
            for (int x = 0; x < nw; x++)
                hist[raster.getSample(x, y, 0)]++;

        int lowCut = (int) (total * 0.02);
        int highCut = (int) (total * 0.98);
        int lo = 0, hi = 255, acc = 0;
        for (int i = 0; i < 256; i++) { acc += hist[i]; if (acc >= lowCut) { lo = i; break; } }
        acc = 0;
        for (int i = 255; i >= 0; i--) { acc += hist[i]; if (acc >= (total - highCut)) { hi = i; break; } }
        if (hi <= lo) { lo = 0; hi = 255; } // imagen plana: no estirar

        int range = hi - lo;
        int[] lut = new int[256];
        for (int i = 0; i < 256; i++) {
            int v = (int) ((i - lo) * 255.0 / range);
            lut[i] = Math.max(0, Math.min(255, v));
        }
        for (int y = 0; y < nh; y++)
            for (int x = 0; x < nw; x++)
                raster.setSample(x, y, 0, lut[raster.getSample(x, y, 0)]);

        File out = File.createTempFile("karmen_prep_", ".png");
        ImageIO.write(gray, "png", out);
        log.info("Imagen preprocesada para OCR: {}x{} -> {}x{} (contraste {}–{})",
            w, h, nw, nh, lo, hi);
        return out;
    }

    private String extractTextFromPdf(String pdfPath) throws IOException, InterruptedException {
        // Intento 1: pdftotext — extrae texto embebido directamente (PDFs digitales)
        // Es mucho más preciso que OCR para facturas generadas por software.
        String directText = tryPdftotext(pdfPath);
        if (directText != null && directText.trim().length() > 80) {
            log.info("Texto extraído con pdftotext ({} caracteres) — PDF digital", directText.length());
            return directText;
        }
        log.info("pdftotext insuficiente ({}c), usando pdftoppm+Tesseract — PDF escaneado",
            directText == null ? 0 : directText.trim().length());

        // Intento 2: pdftoppm + Tesseract OCR — para PDFs escaneados (imágenes)
        Path tempDir = Files.createTempDirectory("karmen_ocr_");
        Path outputPrefix = tempDir.resolve("page");

        ProcessBuilder convertPb = new ProcessBuilder(
            "pdftoppm", "-png", "-r", "300", "-l", "2", pdfPath, outputPrefix.toString()
        );
        convertPb.redirectErrorStream(true);
        Process convertProcess = convertPb.start();
        int convertExit = convertProcess.waitFor();

        if (convertExit != 0) {
            log.error("pdftoppm falló con código: {}", convertExit);
            throw new IOException("Error al convertir PDF a imagen. Verifica que poppler-utils esté instalado.");
        }

        File[] files = tempDir.toFile().listFiles((dir, name) -> name.startsWith("page-") && name.endsWith(".png"));
        if (files == null || files.length == 0) {
            log.error("No se generó ninguna imagen del PDF");
            throw new IOException("No se pudo convertir el PDF a imagen");
        }

        Arrays.sort(files, Comparator.comparing(File::getName));

        StringBuilder allText = new StringBuilder();
        for (File file : files) {
            log.info("Procesando página OCR: {}", file.getName());
            allText.append(extractTextFromImage(file.getAbsolutePath())).append("\n");
            Files.deleteIfExists(file.toPath());
        }

        Files.deleteIfExists(tempDir);
        return allText.toString();
    }

    private String tryPdftotext(String pdfPath) {
        try {
            // -layout preserva la disposición espacial del texto (columnas, tablas)
            ProcessBuilder pb = new ProcessBuilder("pdftotext", "-layout", pdfPath, "-");
            pb.redirectErrorStream(false);
            Process process = pb.start();

            StringBuilder text = new StringBuilder();
            try (BufferedReader reader = new BufferedReader(
                    new InputStreamReader(process.getInputStream(), java.nio.charset.StandardCharsets.UTF_8))) {
                String line;
                while ((line = reader.readLine()) != null) {
                    text.append(line).append("\n");
                }
            }
            process.waitFor();
            return text.toString();
        } catch (Exception e) {
            log.warn("pdftotext no disponible o falló: {}", e.getMessage());
            return null;
        }
    }

    public BigDecimal calculateConfidence(String text) {
        if (text == null || text.isEmpty()) {
            return BigDecimal.ZERO;
        }
        
        long totalChars = text.length();
        long recognizedChars = text.chars().filter(c -> c != '?' && c != '□' && c != '\uFFFD').count();
        
        if (totalChars == 0) return BigDecimal.ZERO;
        
        BigDecimal confidence = BigDecimal.valueOf((double) recognizedChars / totalChars * 100)
            .setScale(2, java.math.RoundingMode.HALF_UP);
        
        return confidence.min(BigDecimal.valueOf(100)).max(BigDecimal.ZERO);
    }

    private String getFileExtension(String path) {
        int lastDot = path.lastIndexOf('.');
        return lastDot > 0 ? path.substring(lastDot + 1) : "";
    }
}
