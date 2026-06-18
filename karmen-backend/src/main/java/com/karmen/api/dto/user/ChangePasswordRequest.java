package com.karmen.api.dto.user;

import jakarta.validation.constraints.*;

public record ChangePasswordRequest(
    @NotBlank String currentPassword,
    @NotBlank @Size(min = 8) String newPassword
) {}
