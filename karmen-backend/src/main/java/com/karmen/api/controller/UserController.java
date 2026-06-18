package com.karmen.api.controller;

import com.karmen.api.dto.user.*;
import com.karmen.api.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    public UserProfileDto getProfile() {
        return userService.getProfile();
    }

    @PatchMapping("/me")
    public UserProfileDto updateProfile(@Valid @RequestBody UserProfileUpdateRequest req) {
        return userService.updateProfile(req);
    }

    @PostMapping("/me/change-password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest req) {
        userService.changePassword(req);
        return ResponseEntity.noContent().build();
    }
}
