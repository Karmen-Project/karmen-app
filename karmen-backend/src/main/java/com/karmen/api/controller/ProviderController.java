package com.karmen.api.controller;

import com.karmen.api.dto.provider.*;
import com.karmen.api.service.ProviderService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/providers")
@RequiredArgsConstructor
@Tag(name = "Proveedores", description = "Gestión de proveedores y clientes")
@SecurityRequirement(name = "bearer-jwt")
public class ProviderController {
    private final ProviderService providerService;

    @GetMapping
    @Operation(summary = "Listar proveedores", description = "Retorna lista de proveedores/clientes de una empresa")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Lista de proveedores",
            content = @Content(mediaType = "application/json")),
        @ApiResponse(responseCode = "403", description = "No tiene acceso a esta empresa")
    })
    public List<ProviderDto> getAll(
            @Parameter(description = "ID de la empresa", required = true)
            @RequestParam Long companyId,
            @Parameter(description = "Filtrar por tipo (PROVEEDOR, CLIENTE)")
            @RequestParam(required=false) String type) {
        return providerService.getAll(companyId, type);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Obtener proveedor por ID", description = "Retorna los detalles de un proveedor")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Datos del proveedor",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ProviderDto.class))),
        @ApiResponse(responseCode = "404", description = "Proveedor no encontrado"),
        @ApiResponse(responseCode = "403", description = "No tiene acceso a este proveedor")
    })
    public ProviderDto getById(
            @Parameter(description = "ID del proveedor", required = true)
            @PathVariable Long id) {
        return providerService.getById(id);
    }

    @PostMapping
    @Operation(summary = "Crear proveedor", description = "Crea un nuevo proveedor o cliente")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "201", description = "Proveedor creado",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ProviderDto.class))),
        @ApiResponse(responseCode = "400", description = "Datos inválidos"),
        @ApiResponse(responseCode = "403", description = "No tiene acceso a esta empresa")
    })
    public ResponseEntity<ProviderDto> create(
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Datos del proveedor", required = true)
            @Valid @RequestBody ProviderRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(providerService.create(req));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Actualizar proveedor", description = "Modifica los datos de un proveedor")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "200", description = "Proveedor actualizado",
            content = @Content(mediaType = "application/json", schema = @Schema(implementation = ProviderDto.class))),
        @ApiResponse(responseCode = "400", description = "Datos inválidos"),
        @ApiResponse(responseCode = "404", description = "Proveedor no encontrado"),
        @ApiResponse(responseCode = "403", description = "No tiene acceso a este proveedor")
    })
    public ProviderDto update(
            @Parameter(description = "ID del proveedor", required = true)
            @PathVariable Long id,
            @io.swagger.v3.oas.annotations.parameters.RequestBody(description = "Datos actualizados")
            @Valid @RequestBody ProviderRequest req) {
        return providerService.update(id, req);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar proveedor", description = "Realiza delete lógico (soft delete) de un proveedor")
    @ApiResponses(value = {
        @ApiResponse(responseCode = "204", description = "Proveedor eliminado"),
        @ApiResponse(responseCode = "404", description = "Proveedor no encontrado"),
        @ApiResponse(responseCode = "403", description = "No tiene acceso a este proveedor")
    })
    public ResponseEntity<Void> delete(
            @Parameter(description = "ID del proveedor", required = true)
            @PathVariable Long id) {
        providerService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
