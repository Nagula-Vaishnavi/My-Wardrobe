package com.mywardrobe.mywardrobe.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdatePreferencesRequest(
        @NotBlank(message = "Choose a style preference.")
        @Pattern(regexp = "Minimal|Casual|Classic|Trendy|Elegant|Traditional|Sporty|Comfortable",
                message = "Choose a supported style preference.")
        String style,
        @NotNull(message = "Show prices must be true or false.")
        Boolean showPrices
) {}
