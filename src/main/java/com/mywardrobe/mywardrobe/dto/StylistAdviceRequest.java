package com.mywardrobe.mywardrobe.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

import java.util.List;

public record StylistAdviceRequest(
        @NotBlank @Size(max = 40) String occasion,
        @NotBlank @Size(max = 40) String weather,
        @NotBlank @Size(max = 40) String mood,
        @Size(max = 60) String style,
        boolean prioritizeComfort,
        @Size(max = 240) String personalRequest,
        @NotEmpty @Size(max = 3)
        List<@NotEmpty @Size(max = 5) List<@NotNull @Positive Long>> optionItemIds
) {}
