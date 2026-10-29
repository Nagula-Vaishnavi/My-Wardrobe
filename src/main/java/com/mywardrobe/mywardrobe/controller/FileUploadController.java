package com.mywardrobe.mywardrobe.controller;

import com.mywardrobe.mywardrobe.entity.Clothing;
import com.mywardrobe.mywardrobe.entity.User;
import com.mywardrobe.mywardrobe.repository.ClothingRepository;
import com.mywardrobe.mywardrobe.repository.UserRepository;
import com.mywardrobe.mywardrobe.service.ImageStorageService;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

@RestController
@RequestMapping("/api/upload")
public class FileUploadController {

    private final ClothingRepository clothingRepository;
    private final UserRepository userRepository;
    private final ImageStorageService imageStorageService;

    public FileUploadController(
            ClothingRepository clothingRepository,
            UserRepository userRepository,
            ImageStorageService imageStorageService) {

        this.clothingRepository = clothingRepository;
        this.userRepository = userRepository;
        this.imageStorageService = imageStorageService;
    }

    @PostMapping("/{clothingId}")
    public String uploadImage(
            @PathVariable Long clothingId,
            @RequestParam("image") MultipartFile image)
            throws IOException {

        if (image.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose an image before uploading.");
        }
        if (image.getSize() > 10L * 1024 * 1024) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "The image is too large. Choose an image smaller than 10 MB.");
        }

        // Only accept common raster formats. Never use a client-supplied filename
        // as a filesystem path: it may contain unsafe path characters or collide.
        String contentType = image.getContentType();
        String extension = contentType == null ? null : Map.of(
                "image/jpeg", ".jpg",
                "image/png", ".png",
                "image/webp", ".webp",
                "image/gif", ".gif"
        ).get(contentType.toLowerCase(java.util.Locale.ROOT));
        if (extension == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Use a JPG, PNG, WEBP, or GIF image.");
        }

        // Get logged-in user's email from JWT
        Authentication authentication =
                SecurityContextHolder.getContext().getAuthentication();

        String email = authentication.getName();

        // Find logged-in user
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED, "Signed-in user was not found."));

        // Find clothing belonging to this user
        Clothing clothing = clothingRepository
                .findByIdAndUser(clothingId, user)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Clothing item was not found."));

        String previousImage = clothing.getImageUrl();
        String imageUrl = imageStorageService.store(image, extension);
        clothing.setImageUrl(imageUrl);
        try {
            clothingRepository.save(clothing);
        } catch (RuntimeException exception) {
            imageStorageService.deleteStoredImage(imageUrl);
            throw exception;
        }
        if (!imageUrl.equals(previousImage)) {
            imageStorageService.deleteStoredImage(previousImage);
        }

        return "Image uploaded successfully";
    }
}
