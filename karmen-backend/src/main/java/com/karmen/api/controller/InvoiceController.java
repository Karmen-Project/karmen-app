package com.karmen.api.controller;

import com.karmen.api.domain.constant.InvoiceType;
import com.karmen.api.dto.invoice.*;
import java.util.List;
import java.util.Map;
import com.karmen.api.service.InvoiceService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/invoices")
@RequiredArgsConstructor
@Tag(name = "Facturas", description = "Gestión de facturas: carga, listado, confirmación y eliminación")
@SecurityRequirement(name = "bearer-jwt")
public class InvoiceController {
    private final InvoiceService invoiceService;

    @GetMapping
    @Operation(summary = "Listar facturas", description = "Retorna un listado paginado de facturas de una empresa")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Listado de facturas",
            content = @Content(mediaType = "application/json")),
        @ApiResponse(responseCode = "403", description = "No tiene acceso a esta empresa")
    })
    public Page<InvoiceDto> getAll(
            @Parameter(description = "ID de la empresa", required = true)
            @RequestParam Long companyId,
            @Parameter(description = "Filtrar por estado (PENDIENTE, CONFIRMADA, RECHAZADA)")
            @RequestParam(required = false) String status,
            @Parameter(description = "Número de página (0-indexed)")
            @RequestParam(defaultValue = "0") int page,
            @Parameter(description = "Cantidad de registros por página")
            @RequestParam(defaultValue = "20") int size) {
        return invoiceService.getAll(companyId, status, page, size);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener factura por ID", description = "Retorna los detalles de una factura específica")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Datos de la factura",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = InvoiceDto.class))),
        @ApiResponse(responseCode = "404", description = "Factura no encontrada"),
        @ApiResponse(responseCode = "403", description = "No tiene acceso a esta factura")
    })
    public InvoiceDto getById(
            @Parameter(description = "ID de la factura", required = true)
            @PathVariable Long id) {
        return invoiceService.getById(id);
    }

    @PostMapping("/upload")
    @Operation(summary = "Subir factura", description = "Carga un archivo PDF/JPG/PNG e inicia procesamiento OCR")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Factura creada, OCR iniciado",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = InvoiceDto.class))),
        @ApiResponse(responseCode = "400", description = "Formato de archivo inválido o datos faltantes"),
        @ApiResponse(responseCode = "413", description = "Archivo excede tamaño máximo (10MB)"),
        @ApiResponse(responseCode = "403", description = "No tiene acceso a esta empresa")
    })
    public ResponseEntity<InvoiceDto> upload(
            @Parameter(description = "ID de la empresa", required = true)
            @RequestParam Long companyId,
            @Parameter(description = "Tipo de factura: INGRESO o EGRESO")
            @RequestParam(defaultValue = InvoiceType.INGRESO) String type,
            @Parameter(description = "Archivo PDF, JPG o PNG (máx 10MB)", required = true)
            @RequestParam("file") MultipartFile file) {
        return ResponseEntity.status(HttpStatus.CREATED).body(invoiceService.upload(companyId, type, file));
    }

    @PatchMapping("/{id}/confirm")
    @Operation(summary = "Confirmar factura", description = "Valida datos OCR, genera asientos contables automáticos")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Factura confirmada",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = InvoiceDto.class))),
        @ApiResponse(responseCode = "400", description = "Datos inválidos"),
        @ApiResponse(responseCode = "404", description = "Factura no encontrada"),
        @ApiResponse(responseCode = "403", description = "No tiene acceso a esta factura")
    })
    public InvoiceDto confirm(
            @Parameter(description = "ID de la factura", required = true)
            @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Datos confirmados de la factura")
            @RequestBody InvoiceUploadRequest req) {
        return invoiceService.confirm(id, req);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Editar factura", description = "Actualiza los datos de una factura y regenera sus asientos contables")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Factura actualizada",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = InvoiceDto.class))),
        @ApiResponse(responseCode = "404", description = "Factura no encontrada"),
        @ApiResponse(responseCode = "403", description = "No tiene acceso a esta factura")
    })
    public InvoiceDto update(
            @Parameter(description = "ID de la factura", required = true)
            @PathVariable Long id,
            @RequestBody InvoiceUploadRequest req) {
        return invoiceService.update(id, req);
    }

    @PostMapping("/{id}/contabilizar")
    @Operation(summary = "Contabilizar factura pendiente", description = "Genera asientos contables para una factura en estado PENDIENTE usando sus datos actuales")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Factura contabilizada"),
        @ApiResponse(responseCode = "400", description = "La factura no está en estado PENDIENTE"),
        @ApiResponse(responseCode = "403", description = "No tiene acceso a esta factura"),
        @ApiResponse(responseCode = "404", description = "Factura no encontrada")
    })
    public InvoiceDto contabilizar(
            @Parameter(description = "ID de la factura", required = true)
            @PathVariable Long id) {
        return invoiceService.contabilizar(id);
    }

    @GetMapping("/{id}/image")
    @Operation(summary = "URL de imagen de la factura", description = "Retorna la URL pública de la imagen/PDF almacenado en Supabase")
    public ResponseEntity<Map<String, String>> getImageUrl(@PathVariable Long id) {
        String url = invoiceService.getImageUrl(id);
        if (url == null) return ResponseEntity.noContent().build();
        return ResponseEntity.ok(Map.of("url", url));
    }

    @GetMapping("/{id}/history")
    @Operation(summary = "Historial de la factura", description = "Retorna todos los eventos de auditoría de una factura")
    public List<AuditLogDto> getHistory(@PathVariable Long id) {
        return invoiceService.getHistory(id);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar factura", description = "Elimina una factura (solo usuarios ADMIN)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Factura eliminada"),
        @ApiResponse(responseCode = "404", description = "Factura no encontrada"),
        @ApiResponse(responseCode = "403", description = "No tiene permisos para eliminar")
    })
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID de la factura", required = true)
            @PathVariable Long id) {
        invoiceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
