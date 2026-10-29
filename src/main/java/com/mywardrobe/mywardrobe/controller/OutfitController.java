package com.mywardrobe.mywardrobe.controller;

import com.mywardrobe.mywardrobe.entity.Outfit;
import com.mywardrobe.mywardrobe.entity.Clothing;
import com.mywardrobe.mywardrobe.entity.User;
import com.mywardrobe.mywardrobe.repository.OutfitRepository;
import com.mywardrobe.mywardrobe.repository.ClothingRepository;
import com.mywardrobe.mywardrobe.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.time.LocalDateTime;
import java.util.stream.Collectors;
import jakarta.validation.Valid;

@RestController
@RequestMapping("/api/outfits")
public class OutfitController {

    private final OutfitRepository outfitRepository;
    private final ClothingRepository clothingRepository;
    private final UserRepository userRepository;

    public OutfitController(
            OutfitRepository outfitRepository,
            ClothingRepository clothingRepository,
            UserRepository userRepository) {

        this.outfitRepository = outfitRepository;
        this.clothingRepository = clothingRepository;
        this.userRepository = userRepository;
    }

    // Get the currently logged-in user
    private User getLoggedInUser(Authentication authentication) {

        if (authentication == null ||
                !authentication.isAuthenticated() ||
                authentication.getPrincipal() == null) {

            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "Please log in first"
            );
        }

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "User not found"
                ));
    }

    // Save a new outfit
    @PostMapping
    public Outfit saveOutfit(
            @Valid @RequestBody Outfit outfit,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        if (outfit.getName() == null ||
                outfit.getName().isBlank()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Outfit name is required"
            );
        }

        if (outfit.getClothingItemIds() == null || outfit.getClothingItemIds().isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "An outfit must include at least one saved clothing item.");
        }

        List<Long> itemIds;
        try {
            itemIds = java.util.Arrays.stream(outfit.getClothingItemIds().split(","))
                    .map(String::trim)
                    .map(Long::parseLong)
                    .distinct()
                    .toList();
        } catch (NumberFormatException exception) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The outfit contains an invalid clothing item ID.");
        }

        var clothingItems = itemIds.stream()
                .map(id -> clothingRepository.findByIdAndUser(id, user)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "One or more outfit pieces are not in your wardrobe.")))
                .toList();

        // Create a new outfit instead of updating an existing one
        outfit.setId(null);
        outfit.setWornAt(null);
        outfit.setClothingItemIds(itemIds.stream().map(String::valueOf)
                .collect(Collectors.joining(",")));
        outfit.setClothingItemNames(clothingItems.stream()
                .map(Clothing::getName).collect(Collectors.joining(", ")));

        // Associate the outfit with the logged-in user
        outfit.setUser(user);

        return outfitRepository.save(outfit);
    }

    // Get all outfits belonging to the logged-in user
    @GetMapping
    public List<Outfit> getAllOutfits(
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        return outfitRepository.findByUser(user);
    }

    // Record or undo when the logged-in user wore a saved outfit.
    @PatchMapping("/{id}/worn")
    public Outfit markOutfitWorn(
            @PathVariable Long id,
            @RequestParam(defaultValue = "true") boolean worn,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);
        Outfit outfit = outfitRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Saved outfit not found"
                ));

        outfit.setWornAt(worn ? LocalDateTime.now() : null);
        return outfitRepository.save(outfit);
    }

    @PatchMapping("/{id}/favorite")
    public Outfit markOutfitFavorite(
            @PathVariable Long id,
            @RequestParam boolean favorite,
            Authentication authentication) {
        User user = getLoggedInUser(authentication);
        Outfit outfit = outfitRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Saved outfit was not found."));
        outfit.setFavorite(favorite);
        return outfitRepository.save(outfit);
    }

    // Delete a saved outfit
    @DeleteMapping("/{id}")
    public void deleteOutfit(
            @PathVariable Long id,
            Authentication authentication) {

        User user = getLoggedInUser(authentication);

        Outfit outfit = outfitRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Saved outfit not found."
                ));

        outfitRepository.delete(outfit);
    }
}
