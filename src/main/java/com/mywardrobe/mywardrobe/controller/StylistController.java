package com.mywardrobe.mywardrobe.controller;

import com.mywardrobe.mywardrobe.dto.StylistAdviceRequest;
import com.mywardrobe.mywardrobe.dto.StylistAdviceResponse;
import com.mywardrobe.mywardrobe.entity.Clothing;
import com.mywardrobe.mywardrobe.entity.User;
import com.mywardrobe.mywardrobe.repository.ClothingRepository;
import com.mywardrobe.mywardrobe.repository.UserRepository;
import com.mywardrobe.mywardrobe.service.GeminiStylistService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.HashSet;
import java.util.List;

@RestController
@RequestMapping("/api/stylist")
public class StylistController {
    private final ClothingRepository clothingRepository;
    private final UserRepository userRepository;
    private final GeminiStylistService geminiStylistService;

    public StylistController(
            ClothingRepository clothingRepository,
            UserRepository userRepository,
            GeminiStylistService geminiStylistService) {
        this.clothingRepository = clothingRepository;
        this.userRepository = userRepository;
        this.geminiStylistService = geminiStylistService;
    }

    @PostMapping("/advice")
    public StylistAdviceResponse getAdvice(
            @Valid @RequestBody StylistAdviceRequest request,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please log in first.");
        }
        User user = userRepository.findByEmail(authentication.getName())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found."));

        List<List<Clothing>> options = request.optionItemIds().stream().map(ids -> {
            if (new HashSet<>(ids).size() != ids.size()) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "An outfit option contains a duplicate clothing item.");
            }
            return ids.stream().map(id -> clothingRepository.findByIdAndUser(id, user)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "An outfit option contains clothing outside your wardrobe.")))
                    .toList();
        }).toList();

        return geminiStylistService.advise(request, options);
    }
}
