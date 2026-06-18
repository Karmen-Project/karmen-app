package com.karmen.api.controller;

import com.karmen.api.dto.account.AccountDto;
import com.karmen.api.dto.account.AccountRequest;
import com.karmen.api.service.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
@Tag(name = "Cuentas Contables", description = "Gestión del catálogo de cuentas PUC")
@SecurityRequirement(name = "bearer-jwt")
public class AccountController {
    private final AccountService accountService;

    @GetMapping
    @Operation(summary = "Listar cuentas", description = "Retorna el catálogo de cuentas de la empresa (siembra PUC base si está vacío)")
    public List<AccountDto> getAll(@RequestParam Long companyId) {
        return accountService.getAll(companyId);
    }

    @PostMapping
    @Operation(summary = "Crear cuenta", description = "Agrega una cuenta personalizada al catálogo")
    public ResponseEntity<AccountDto> create(
            @RequestParam Long companyId,
            @RequestBody AccountRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(accountService.create(companyId, req));
    }

    @PutMapping("/{id}")
    @Operation(summary = "Editar cuenta", description = "Actualiza nombre y tipo de una cuenta (código solo editable en cuentas personalizadas)")
    public AccountDto update(@PathVariable Long id, @RequestBody AccountRequest req) {
        return accountService.update(id, req);
    }

    @PatchMapping("/{id}/toggle")
    @Operation(summary = "Activar / Desactivar cuenta", description = "Cambia el estado activo. No se puede desactivar si tiene asientos contables")
    public AccountDto toggleActive(@PathVariable Long id) {
        return accountService.toggleActive(id);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Eliminar cuenta", description = "Elimina la cuenta si no tiene asientos contables asociados")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        accountService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/suggest")
    @Operation(summary = "Sugerir cuentas", description = "Devuelve cuentas activas del tipo adecuado para el tipo de factura indicado")
    public List<AccountDto> suggest(
            @RequestParam Long companyId,
            @RequestParam String invoiceType) {
        return accountService.suggest(companyId, invoiceType);
    }
}
