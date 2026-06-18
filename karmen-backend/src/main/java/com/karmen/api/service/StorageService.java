package com.karmen.api.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import java.io.*;
import java.nio.file.*;
import java.util.Set;
import java.util.UUID;

@Service
public class StorageService {
    @Value("${storage.upload-dir}")
    private String uploadDir;
    
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("pdf", "jpg", "jpeg", "png");

    public String store(MultipartFile file) {
        try {
            // 1. Validar que el archivo no esté vacío
            if (file.isEmpty()) {
                throw new IllegalArgumentException("El archivo está vacío");
            }
            
            // 2. Validar tamaño máximo
            if (file.getSize() > MAX_FILE_SIZE) {
                throw new IllegalArgumentException("El archivo excede el tamaño máximo de 10MB");
            }
            
            // 3. Validar extensión permitida
            String originalName = file.getOriginalFilename();
            String extension = getExtension(originalName).toLowerCase();
            if (!ALLOWED_EXTENSIONS.contains(extension)) {
                throw new IllegalArgumentException("Tipo de archivo no permitido. Solo se aceptan: PDF, JPG, PNG");
            }
            
            // 4. Validar contenido real (magic bytes)
            validateFileContent(file, extension);
            
            // 5. Generar nombre seguro (UUID + extensión sanitizada)
            String safeFilename = UUID.randomUUID() + "." + extension;
            
            // 6. Crear directorio si no existe
            Path uploadPath = Paths.get(uploadDir);
            Files.createDirectories(uploadPath);
            
            // 7. Resolver ruta segura (prevenir path traversal)
            Path dest = uploadPath.resolve(safeFilename).normalize();
            if (!dest.startsWith(uploadPath)) {
                throw new IllegalArgumentException("Ruta de archivo inválida");
            }
            
            // 8. Guardar archivo
            Files.copy(file.getInputStream(), dest, StandardCopyOption.REPLACE_EXISTING);
            return dest.toString();
            
        } catch (IOException e) {
            throw new RuntimeException("Error al guardar archivo: " + e.getMessage());
        }
    }
    
    public void delete(String path) {
        try {
            if (path != null) Files.deleteIfExists(Paths.get(path));
        } catch (IOException e) {
            // Log pero no propagar — el rollback de BD ya protege la consistencia
        }
    }

    private String getExtension(String filename) {
        if (filename == null || !filename.contains(".")) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.') + 1);
    }
    
    private void validateFileContent(MultipartFile file, String declaredExtension) throws IOException {
        byte[] header = new byte[8];
        try (InputStream is = file.getInputStream()) {
            int read = is.read(header);
            if (read < 4) {
                throw new IllegalArgumentException("Archivo demasiado pequeño para validar");
            }
        }
        
        String detectedType = detectMimeType(header);
        
        // Validar que el contenido coincida con la extensión declarada
        boolean valid = switch (declaredExtension) {
            case "pdf" -> "application/pdf".equals(detectedType);
            case "jpg", "jpeg" -> "image/jpeg".equals(detectedType);
            case "png" -> "image/png".equals(detectedType);
            default -> false;
        };
        
        if (!valid) {
            throw new IllegalArgumentException(
                "El contenido del archivo no coincide con su extensión. " +
                "Extensión: " + declaredExtension + ", Contenido detectado: " + detectedType
            );
        }
    }
    
    private String detectMimeType(byte[] header) {
        // PDF: %PDF (0x25 0x50 0x44 0x46)
        if (header[0] == 0x25 && header[1] == 0x50 && header[2] == 0x44 && header[3] == 0x46) {
            return "application/pdf";
        }
        // JPEG: FFD8FF
        if ((header[0] & 0xFF) == 0xFF && (header[1] & 0xFF) == 0xD8 && (header[2] & 0xFF) == 0xFF) {
            return "image/jpeg";
        }
        // PNG: 89504E47 0D0A1A0A
        if ((header[0] & 0xFF) == 0x89 && header[1] == 0x50 && header[2] == 0x4E && header[3] == 0x47) {
            return "image/png";
        }
        return "unknown";
    }
}
