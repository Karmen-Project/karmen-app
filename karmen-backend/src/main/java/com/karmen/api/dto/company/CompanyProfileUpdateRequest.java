package com.karmen.api.dto.company;

import jakarta.validation.constraints.*;

public record CompanyProfileUpdateRequest(
    @NotBlank @Size(max = 200) String name,
    @Size(max = 30) String nit,
    @Size(max = 300) String address,
    @Size(max = 20) String phone,
    @Email @Size(max = 150) String email
) {}
