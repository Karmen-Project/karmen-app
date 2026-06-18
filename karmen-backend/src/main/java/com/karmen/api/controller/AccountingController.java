package com.karmen.api.controller;

import com.karmen.api.dto.accounting.AccountingEntryDto;
import com.karmen.api.service.AccountingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/accounting-entries")
@RequiredArgsConstructor
@Tag(name = "Contabilidad", description = "Gestión de asientos contables y registros")
@SecurityRequirement(name = "bearer-jwt")
public class AccountingController {
    private final AccountingService accountingService;

    @GetMapping
    @Operation(summary = "Listar asientos contables", description = "Retorna los asientos Debe/Haber de una empresa")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de asientos contables",
            content = @Content(mediaType = "application/json")),
        @ApiResponse(responseCode = "403", description = "No tiene acceso a esta empresa")
    })
    public List<AccountingEntryDto> getAll(
            @Parameter(description = "ID de la empresa", required = true)
            @RequestParam Long companyId) {
        return accountingService.getEntries(companyId);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar asiento contable", description = "Elimina un asiento contable por su ID")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Asiento eliminado"),
        @ApiResponse(responseCode = "404", description = "Asiento no encontrado"),
        @ApiResponse(responseCode = "403", description = "No tiene acceso a este asiento")
    })
    public ResponseEntity<Void> deleteEntry(
            @Parameter(description = "ID del asiento contable", required = true)
            @PathVariable Long id) {
        accountingService.deleteEntry(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    @Operation(summary = "Eliminar todos los asientos de una empresa",
               description = "Borra todos los registros contables de la empresa. Operación irreversible.")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Asientos eliminados"),
        @ApiResponse(responseCode = "403", description = "No tiene acceso a esta empresa")
    })
    public ResponseEntity<Void> deleteAll(
            @Parameter(description = "ID de la empresa", required = true)
            @RequestParam Long companyId) {
        accountingService.deleteAllEntriesByCompany(companyId);
        return ResponseEntity.noContent().build();
    }

}
