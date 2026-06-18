package com.karmen.api.controller;

import com.karmen.api.dto.company.*;
import com.karmen.api.service.CompanyService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api/companies")
@RequiredArgsConstructor
public class CompanyController {

    private final CompanyService companyService;

    @GetMapping("/{id}")
    public CompanyProfileDto getCompany(@PathVariable Long id) {
        return companyService.getCompany(id);
    }

    @PatchMapping("/{id}")
    public CompanyProfileDto updateCompany(@PathVariable Long id, @Valid @RequestBody CompanyProfileUpdateRequest req) {
        return companyService.updateCompany(id, req);
    }

    @PostMapping("/{id}/logo")
    public ResponseEntity<CompanyProfileDto> uploadLogo(@PathVariable Long id, @RequestParam("file") MultipartFile file) {
        return ResponseEntity.ok(companyService.uploadLogo(id, file));
    }
}
