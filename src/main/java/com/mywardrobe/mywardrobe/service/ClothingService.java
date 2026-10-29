
package com.mywardrobe.mywardrobe.service;

import com.mywardrobe.mywardrobe.entity.Clothing;
import com.mywardrobe.mywardrobe.entity.User;
import com.mywardrobe.mywardrobe.repository.ClothingRepository;
import com.mywardrobe.mywardrobe.repository.UserRepository;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ClothingService {

    private final ClothingRepository clothingRepository;
    private final UserRepository userRepository;
    private final ImageStorageService imageStorageService;

    public ClothingService(
            ClothingRepository clothingRepository,
            UserRepository userRepository,
            ImageStorageService imageStorageService) {

        this.clothingRepository = clothingRepository;
        this.userRepository = userRepository;
        this.imageStorageService = imageStorageService;
    }

    // Get the currently logged-in user
    private User getLoggedInUser() {

        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        if (authentication == null || !authentication.isAuthenticated()
                || authentication.getName() == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Please sign in again.");
        }

        String email = authentication.getName();

        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Signed-in user was not found."));
    }

    // Add clothing for the logged-in user
    public Clothing addClothing(Clothing clothing) {

        User user = getLoggedInUser();

        // Never allow a client-supplied ID or image URL to turn creation into
        // an update of another row or to point at an arbitrary server path.
        clothing.setId(null);
        clothing.setUser(user);
        clothing.setImageUrl(null);

        return clothingRepository.save(clothing);
    }

    // Get only the logged-in user's clothing
    public List<Clothing> getAllClothing() {

        User user = getLoggedInUser();

        return clothingRepository.findByUser(user);
    }

    // Delete clothing belonging to the logged-in user
    public void deleteClothing(Long id) {

        User user = getLoggedInUser();

        Clothing clothing = clothingRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Clothing item was not found."));

        clothingRepository.delete(clothing);
        imageStorageService.deleteStoredImage(clothing.getImageUrl());
    }

    // Update clothing belonging to the logged-in user
    public Clothing updateClothing(
            Long id,
            Clothing updatedClothing) {

        User user = getLoggedInUser();

        Clothing clothing = clothingRepository
                .findByIdAndUser(id, user)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Clothing item was not found."));

        // Update the editable fields
        clothing.setName(updatedClothing.getName());
        clothing.setCategory(updatedClothing.getCategory());
        clothing.setBrand(updatedClothing.getBrand());
        clothing.setColor(updatedClothing.getColor());
        clothing.setSize(updatedClothing.getSize());
        clothing.setPrice(updatedClothing.getPrice());
        clothing.setNotes(updatedClothing.getNotes());
        clothing.setPattern(updatedClothing.getPattern());
        clothing.setStyle(updatedClothing.getStyle());
        clothing.setFit(updatedClothing.getFit());
        clothing.setSeason(updatedClothing.getSeason());
        clothing.setMaterial(updatedClothing.getMaterial());
        clothing.setSuitableOccasions(updatedClothing.getSuitableOccasions());


        // Save the updated entity to MySQL
        return clothingRepository.save(clothing);
    }
}
