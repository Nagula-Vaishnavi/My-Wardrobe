package com.mywardrobe.mywardrobe.dto;

import java.util.List;

public record StylistAdviceResponse(
        boolean available,
        List<Integer> rankedOptionIndexes,
        List<OptionAdvice> options,
        String message
) {
    public record OptionAdvice(int optionIndex, String explanation) {}

    public static StylistAdviceResponse unavailable(String message) {
        return new StylistAdviceResponse(false, List.of(), List.of(), message);
    }
}
