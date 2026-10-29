package com.mywardrobe.mywardrobe.controller;

import com.mywardrobe.mywardrobe.entity.LoginRequest;
import com.mywardrobe.mywardrobe.entity.User;
import com.mywardrobe.mywardrobe.dto.RegisterRequest;
import com.mywardrobe.mywardrobe.dto.RegisterResponse;
import com.mywardrobe.mywardrobe.dto.ProfileResponse;
import com.mywardrobe.mywardrobe.dto.UpdateProfileRequest;
import com.mywardrobe.mywardrobe.dto.UpdatePreferencesRequest;
import com.mywardrobe.mywardrobe.dto.PreferencesResponse;
import com.mywardrobe.mywardrobe.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.security.core.Authentication;


@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    public AuthController(AuthService authService) {
        this.authService = authService;
    }
    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(
            @Valid @RequestBody RegisterRequest request) {
        User user = authService.register(request);
        RegisterResponse response = new RegisterResponse(
                user.getId(),
                user.getName(),
                user.getEmail()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public String login(@Valid @RequestBody LoginRequest request) {
        return authService.login(
                request.getEmail(),
                request.getPassword()
        );
    }

    @GetMapping("/me")
    public ProfileResponse getProfile(Authentication authentication) {
        return toProfileResponse(authService.getProfile(authentication.getName()));
    }

    @PutMapping("/me")
    public ProfileResponse updateProfile(
            Authentication authentication,
            @Valid @RequestBody UpdateProfileRequest request) {
        User user = authService.updateProfile(authentication.getName(), request.name());
        return toProfileResponse(user);
    }

    @GetMapping("/preferences")
    public PreferencesResponse getPreferences(Authentication authentication) {
        User user = authService.getProfile(authentication.getName());
        return toPreferencesResponse(user);
    }

    @PutMapping("/preferences")
    public PreferencesResponse updatePreferences(
            Authentication authentication,
            @Valid @RequestBody UpdatePreferencesRequest request) {
        User user = authService.updatePreferences(authentication.getName(), request);
        return toPreferencesResponse(user);
    }

    private ProfileResponse toProfileResponse(User user) {
        return new ProfileResponse(user.getId(), user.getName(), user.getEmail());
    }

    private PreferencesResponse toPreferencesResponse(User user) {
        return new PreferencesResponse(
                user.getPreferredStyle(), user.isShowPrices(), user.isPreferencesConfigured());
    }
    }

