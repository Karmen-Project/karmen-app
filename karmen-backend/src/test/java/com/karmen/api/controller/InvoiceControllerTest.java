package com.karmen.api.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.karmen.api.dto.invoice.*;
import com.karmen.api.security.JwtUtils;
import com.karmen.api.security.UserDetailsServiceImpl;
import com.karmen.api.service.InvoiceService;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.data.domain.*;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Pruebas de capa HTTP: enrutamiento, códigos de respuesta y serialización JSON.
 *
 * Estrategia de seguridad en tests:
 *  - JwtFilter.doFilterInternal SIEMPRE llama chain.doFilter() cuando no hay token.
 *    Por eso se mockean sus DEPENDENCIAS (JwtUtils, UserDetailsServiceImpl) en lugar
 *    del filtro completo. Spring crea el filtro real, que pasa la cadena sin problema.
 *  - @MockBean JwtFilter rompía la cadena porque Mockito no puede sobreescribir
 *    OncePerRequestFilter.doFilter() (método final), y el mock no llama chain.doFilter().
 *  - TestSecurityConfig registra una SecurityFilterChain de máxima prioridad que
 *    permite todo, garantizando que los requests lleguen al controlador.
 */
@WebMvcTest(InvoiceController.class)
@Import(InvoiceControllerTest.TestSecurityConfig.class)
@WithMockUser
class InvoiceControllerTest {

    @TestConfiguration
    static class TestSecurityConfig {
        @Bean
        @Order(Ordered.HIGHEST_PRECEDENCE)
        SecurityFilterChain testFilterChain(HttpSecurity http) throws Exception {
            http.csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth.anyRequest().permitAll());
            return http.build();
        }
    }

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;
    @MockBean InvoiceService invoiceService;

    // Dependencias de JwtFilter: mocks para que Spring cree el filtro real.
    // jwtUtils.validate() retorna false (default mock) → el filtro no autentica,
    // pero sí llama chain.doFilter(req, res) → cadena continúa normalmente.
    @MockBean JwtUtils jwtUtils;
    @MockBean UserDetailsServiceImpl userDetailsService;

    private InvoiceDto pendingDto;
    private InvoiceDto contabilizedDto;

    @BeforeEach
    void setUp() {
        pendingDto = new InvoiceDto(
                10L, "FAC-0010", null, "EGRESO", "PENDIENTE",
                new BigDecimal("100000"), new BigDecimal("19000"),
                new BigDecimal("119000"), "COP", "Proveedor X",
                "Test Company", 1L, null, LocalDateTime.now(), null,
                null, null);

        contabilizedDto = new InvoiceDto(
                10L, "FAC-0010", null, "EGRESO", "CONTABILIZADA",
                new BigDecimal("100000"), new BigDecimal("19000"),
                new BigDecimal("119000"), "COP", "Proveedor X",
                "Test Company", 1L, null, LocalDateTime.now(), null,
                null, null);
    }

    @Test
    @DisplayName("GET /api/invoices → 200 con lista paginada")
    void getAll_Returns200WithPagedContent() throws Exception {
        Page<InvoiceDto> page = new PageImpl<>(List.of(pendingDto));
        when(invoiceService.getAll(eq(1L), isNull(), eq(0), eq(20))).thenReturn(page);

        mockMvc.perform(get("/api/invoices").param("companyId", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[0].id").value(10))
                .andExpect(jsonPath("$.content[0].status").value("PENDIENTE"))
                .andExpect(jsonPath("$.content[0].invoiceNumber").value("FAC-0010"));
    }

    @Test
    @DisplayName("GET /api/invoices/{id} → 200 con detalle de la factura")
    void getById_Returns200WithInvoiceDetail() throws Exception {
        when(invoiceService.getById(10L)).thenReturn(pendingDto);

        mockMvc.perform(get("/api/invoices/10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.invoiceNumber").value("FAC-0010"))
                .andExpect(jsonPath("$.type").value("EGRESO"))
                .andExpect(jsonPath("$.total").value(119000));
    }

    @Test
    @DisplayName("POST /api/invoices/upload → 201 al subir archivo PDF válido")
    void upload_Returns201WithCreatedInvoice() throws Exception {
        byte[] pdfBytes = {0x25, 0x50, 0x44, 0x46, 0x2D, 0x31, 0x2E, 0x34}; // %PDF-1.4
        MockMultipartFile file = new MockMultipartFile(
                "file", "factura.pdf", MediaType.APPLICATION_PDF_VALUE, pdfBytes);

        when(invoiceService.upload(eq(1L), eq("EGRESO"), any())).thenReturn(pendingDto);

        mockMvc.perform(multipart("/api/invoices/upload")
                        .file(file)
                        .param("companyId", "1")
                        .param("type", "EGRESO"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(10))
                .andExpect(jsonPath("$.status").value("PENDIENTE"));
    }

    @Test
    @DisplayName("POST /api/invoices/{id}/contabilizar → 200 con estado CONTABILIZADA")
    void contabilizar_Returns200WithContabilizadaStatus() throws Exception {
        when(invoiceService.contabilizar(10L)).thenReturn(contabilizedDto);

        mockMvc.perform(post("/api/invoices/10/contabilizar"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONTABILIZADA"))
                .andExpect(jsonPath("$.id").value(10));

        verify(invoiceService).contabilizar(10L);
    }

    @Test
    @DisplayName("DELETE /api/invoices/{id} → 204 sin cuerpo de respuesta")
    void delete_Returns204NoContent() throws Exception {
        doNothing().when(invoiceService).delete(10L);

        mockMvc.perform(delete("/api/invoices/10"))
                .andExpect(status().isNoContent());

        verify(invoiceService).delete(10L);
    }

    @Test
    @DisplayName("GET /api/invoices/{id}/history → 200 con lista de eventos de auditoría")
    void getHistory_Returns200WithAuditEvents() throws Exception {
        AuditLogDto dto = new AuditLogDto(1L, "CREACION", "Test User",
                "test@karmen.com", LocalDateTime.now(),
                Map.of("fileName", "factura.pdf"));

        when(invoiceService.getHistory(10L)).thenReturn(List.of(dto));

        mockMvc.perform(get("/api/invoices/10/history"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].action").value("CREACION"))
                .andExpect(jsonPath("$[0].userName").value("Test User"))
                .andExpect(jsonPath("$[0].userEmail").value("test@karmen.com"));
    }

    // ── PATCH /api/invoices/{id}/confirm ─────────────────────────

    @Test
    @DisplayName("PATCH /api/invoices/{id}/confirm → 200 con factura confirmada")
    void confirm_Returns200WithConfirmedInvoice() throws Exception {
        InvoiceUploadRequest req = new InvoiceUploadRequest(
                "FAC-0010", null, null, null, null, null,
                new BigDecimal("100000"), new BigDecimal("19000"),
                new BigDecimal("119000"), null, null, null);

        when(invoiceService.confirm(eq(10L), any())).thenReturn(contabilizedDto);

        mockMvc.perform(patch("/api/invoices/10/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONTABILIZADA"));

        verify(invoiceService).confirm(eq(10L), any());
    }

}
