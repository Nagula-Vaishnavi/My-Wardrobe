package com.mywardrobe.mywardrobe.service;


import com.mywardrobe.mywardrobe.entity.User;
import com.mywardrobe.mywardrobe.repository.UserRepository;
import com.mywardrobe.mywardrobe.dto.RegisterRequest;
import com.mywardrobe.mywardrobe.dto.UpdatePreferencesRequest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;
import java.nio.charset.StandardCharsets;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final JwtService jwtService;

    private final BCryptPasswordEncoder passwordEncoder =
            new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository,JwtService jwtService) {
        this.userRepository = userRepository;
        this.jwtService = jwtService;
    }
    public User register(RegisterRequest request) {
        if (request.password().getBytes(StandardCharsets.UTF_8).length > 72) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Password must be 72 bytes or fewer."
            );
        }

        String email = request.email().trim().toLowerCase(Locale.ROOT);
        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An account with this email already exists."
            );
        }

        User user = new User();
        user.setName(request.name().trim());
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode(request.password()));

        try {
            return userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException exception) {
            // The unique database constraint also protects simultaneous sign-ups.
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "An account with this email already exists."
            );
        }
    }
    public String login(String email,String password){
        String normalizedEmail = email == null
                ? ""
                : email.trim().toLowerCase(Locale.ROOT);
        User user=  userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Email or password is incorrect."));

        if (!passwordEncoder.matches(password,user.getPassword())){
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED, "Email or password is incorrect.");
        }
        return jwtService.generateToken(user.getEmail());
    }

    public User getProfile(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "User profile was not found."));
    }

    public User updateProfile(String email, String name) {
        User user = getProfile(email);
        user.setName(name.trim());
        return userRepository.save(user);
    }

    public User updatePreferences(String email, UpdatePreferencesRequest request) {
        User user = getProfile(email);
        user.setPreferredStyle(request.style());
        user.setShowPrices(request.showPrices());
        user.setPreferencesConfigured(true);
        return userRepository.save(user);
    }
}
