package com.karmen.api.service;

import org.junit.jupiter.api.*;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.util.ReflectionTestUtils;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.*;

class StorageServiceTest {

    private StorageService storageService;

    @TempDir
    Path tempDir;

    @BeforeEach
    void setUp() {
        storageService = new StorageService();
        ReflectionTestUtils.setField(storageService, "uploadDir", tempDir.toString());
    }

    @Test
    @DisplayName("store rechaza archivos vacíos")
    void store_RejectsEmptyFile() {
        MockMultipartFile emptyFile = new MockMultipartFile(
                "file", "empty.pdf", "application/pdf", new byte[0]);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> storageService.store(emptyFile));

        assertTrue(ex.getMessage().contains("vacío"));
    }

    @Test
    @DisplayName("store rechaza archivos que exceden 10MB")
    void store_RejectsOversizedFile() {
        byte[] largeContent = new byte[11 * 1024 * 1024]; // 11MB
        MockMultipartFile largeFile = new MockMultipartFile(
                "file", "large.pdf", "application/pdf", largeContent);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> storageService.store(largeFile));

        assertTrue(ex.getMessage().contains("10MB"));
    }

    @Test
    @DisplayName("store rechaza extensiones no permitidas")
    void store_RejectsDisallowedExtensions() {
        MockMultipartFile exeFile = new MockMultipartFile(
                "file", "malware.exe", "application/octet-stream", "content".getBytes());

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> storageService.store(exeFile));

        assertTrue(ex.getMessage().contains("no permitido"));
    }

    @Test
    @DisplayName("store valida contenido PDF real")
    void store_ValidatesPdfContent() {
        // PDF magic bytes: %PDF
        byte[] pdfContent = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34};
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "document.pdf", "application/pdf", pdfContent);

        String path = storageService.store(pdfFile);

        assertNotNull(path);
        assertTrue(path.endsWith(".pdf"));
        assertTrue(Files.exists(Path.of(path)));
    }

    @Test
    @DisplayName("store valida contenido JPEG real")
    void store_ValidatesJpegContent() {
        // JPEG magic bytes: FFD8FF
        byte[] jpegContent = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10};
        MockMultipartFile jpegFile = new MockMultipartFile(
                "file", "image.jpg", "image/jpeg", jpegContent);

        String path = storageService.store(jpegFile);

        assertNotNull(path);
        assertTrue(path.endsWith(".jpg"));
    }

    @Test
    @DisplayName("store valida contenido PNG real")
    void store_ValidatesPngContent() {
        // PNG magic bytes: 89504E47
        byte[] pngContent = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
        MockMultipartFile pngFile = new MockMultipartFile(
                "file", "image.png", "image/png", pngContent);

        String path = storageService.store(pngFile);

        assertNotNull(path);
        assertTrue(path.endsWith(".png"));
    }

    @Test
    @DisplayName("store rechaza archivo con extensión falsa")
    void store_RejectsFakeExtension() {
        // Archivo EXE disfrazado como PDF
        byte[] exeContent = new byte[]{0x4D, 0x5A, 0x00, 0x00}; // MZ header (EXE)
        MockMultipartFile fakeFile = new MockMultipartFile(
                "file", "malware.pdf", "application/pdf", exeContent);

        IllegalArgumentException ex = assertThrows(IllegalArgumentException.class,
                () -> storageService.store(fakeFile));

        assertTrue(ex.getMessage().contains("no coincide"));
    }

    @Test
    @DisplayName("store genera nombre de archivo seguro UUID")
    void store_GeneratesSafeFilename() {
        byte[] pdfContent = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34};
        MockMultipartFile maliciousName = new MockMultipartFile(
                "file", "../../../etc/passwd.pdf", "application/pdf", pdfContent);

        String path = storageService.store(maliciousName);

        // El nombre no debe contener el path traversal original
        assertFalse(path.contains(".."));
        assertFalse(path.contains("passwd"));
        // Debe ser un UUID
        assertTrue(path.matches(".*[a-f0-9\\-]{36}\\.pdf"));
    }

    @Test
    @DisplayName("store crea directorio si no existe")
    void store_CreatesDirectoryIfNotExists() throws IOException {
        Path newDir = tempDir.resolve("uploads/new");
        ReflectionTestUtils.setField(storageService, "uploadDir", newDir.toString());

        byte[] pdfContent = new byte[]{0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34};
        MockMultipartFile pdfFile = new MockMultipartFile(
                "file", "document.pdf", "application/pdf", pdfContent);

        String path = storageService.store(pdfFile);

        assertTrue(Files.exists(newDir));
        assertTrue(Files.exists(Path.of(path)));
    }
}
