package com.karmen.api.service;

import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

@Service
@Slf4j
public class SupabaseStorageService {

    @Value("${supabase.url:}")
    private String supabaseUrl;

    @Value("${supabase.service-key:}")
    private String serviceKey;

    @Value("${supabase.storage.bucket:imagenes}")
    private String bucket;

    private final HttpClient httpClient = HttpClient.newBuilder().build();

    public boolean isConfigured() {
        return !supabaseUrl.isBlank() && !serviceKey.isBlank();
    }

    @PostConstruct
    void init() {
        supabaseUrl = supabaseUrl.trim().replaceAll("/+$", "");
        serviceKey  = serviceKey.trim();
        bucket      = bucket.trim();
        // Nunca loguear el secreto (ni fragmentos): solo se confirma que está presente.
        log.info("Supabase Storage → url={}, bucket={}, serviceKey={}",
                supabaseUrl, bucket,
                serviceKey.isBlank() ? "AUSENTE" : "configurada");
    }

    public String upload(MultipartFile file, String filename) throws IOException {
        String contentType = file.getContentType() != null ? file.getContentType() : "application/octet-stream";
        return upload(file.getBytes(), contentType, filename);
    }

    /**
     * Sube bytes en memoria (sin depender de un MultipartFile). Útil para subidas en
     * segundo plano, donde el request original ya no está disponible.
     */
    public String upload(byte[] content, String contentType, String filename) {
        String objectPath = bucket + "/" + filename;
        String uploadUrl  = supabaseUrl + "/storage/v1/object/" + objectPath;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(uploadUrl))
                .header("Authorization", "Bearer " + serviceKey)
                .header("Content-Type", contentType)
                .header("x-upsert", "true")
                .POST(HttpRequest.BodyPublishers.ofByteArray(content))
                .build();

        try {
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 400) {
                log.error("Supabase error {} en {}: {}", response.statusCode(), uploadUrl, response.body());
                throw new RuntimeException("Error Supabase Storage (" + response.statusCode() + "): " + response.body());
            }
            log.info("Archivo subido: {}", objectPath);
        } catch (IOException e) {
            throw new RuntimeException("Error de E/S subiendo a Supabase", e);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("Upload interrumpido", e);
        }

        return supabaseUrl + "/storage/v1/object/public/" + objectPath;
    }

    public void delete(String publicUrl) {
        if (publicUrl == null || !publicUrl.contains("/storage/v1/object/public/")) return;
        String objectPath = publicUrl.split("/storage/v1/object/public/")[1];
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(supabaseUrl + "/storage/v1/object/" + objectPath))
                .header("Authorization", "Bearer " + serviceKey)
                .DELETE()
                .build();
        try {
            httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        } catch (Exception e) {
            log.warn("No se pudo eliminar {}: {}", objectPath, e.getMessage());
        }
    }
}
