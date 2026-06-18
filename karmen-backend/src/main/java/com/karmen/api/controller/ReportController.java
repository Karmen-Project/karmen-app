package com.karmen.api.controller;

import com.karmen.api.service.ReportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.Map;

@RestController
@RequestMapping("/api/reports")
@RequiredArgsConstructor
@Tag(name = "Reportes", description = "Generación de reportes financieros y análisis")
@SecurityRequirement(name = "bearer-jwt")
public class ReportController {
    private final ReportService reportService;

    @GetMapping("/monthly")
    @Operation(summary = "Reporte mensual", description = "Retorna gráficos, totales de ingresos/egresos y análisis de IVA para los últimos 7 meses")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Reporte mensual",
            content = @Content(mediaType = "application/json")),
        @ApiResponse(responseCode = "403", description = "No tiene acceso a esta empresa")
    })
    public Map<String, Object> monthly(
            @Parameter(description = "ID de la empresa", required = true)
            @RequestParam Long companyId,
            @Parameter(description = "Año para el reporte (YYYY)")
            @RequestParam(required=false) String year) {
        return reportService.getMonthlyReport(companyId);
    }

    @GetMapping("/range")
    @Operation(summary = "Reporte por rango de fechas", description = "Retorna totales e lista de movimientos entre dos fechas")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Reporte del período",
            content = @Content(mediaType = "application/json")),
        @ApiResponse(responseCode = "403", description = "No tiene acceso a esta empresa")
    })
    public Map<String, Object> range(
            @Parameter(description = "ID de la empresa", required = true)
            @RequestParam Long companyId,
            @Parameter(description = "Fecha inicial (YYYY-MM-DD)", required = true)
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateFrom,
            @Parameter(description = "Fecha final (YYYY-MM-DD)", required = true)
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate dateTo) {
        return reportService.getRangeReport(companyId, dateFrom, dateTo);
    }

    @GetMapping("/export")
    @Operation(summary = "Exportar reporte", description = "Genera un PDF con el reporte financiero (no implementado aún)")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "PDF generado",
            content = @Content(mediaType = "application/pdf")),
        @ApiResponse(responseCode = "403", description = "No tiene acceso a esta empresa")
    })
    public Map<String, Object> export(
            @Parameter(description = "ID de la empresa", required = true)
            @RequestParam Long companyId) {
        return Map.of("message", "PDF export not yet implemented", "companyId", companyId);
    }
}
