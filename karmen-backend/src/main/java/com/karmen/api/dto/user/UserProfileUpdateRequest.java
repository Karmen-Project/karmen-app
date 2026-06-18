package com.karmen.api.dto.user;

import jakarta.validation.constraints.*;

public record UserProfileUpdateRequest(
    @NotBlank @Size(max = 200) String fullName
) {}
