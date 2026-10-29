package com.mywardrobe.mywardrobe.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class ImageStorageService {
    private static final Logger logger = LoggerFactory.getLogger(ImageStorageService.class);
    private static final String STORED_IMAGE_PATTERN =
            "uploads/[0-9a-fA-F-]{36}\\.(jpg|png|webp|gif)";
    private final Path uploadFolder;

    public ImageStorageService() {
        this(Paths.get("uploads"));
    }

    ImageStorageService(Path uploadFolder) {
        this.uploadFolder = uploadFolder.toAbsolutePath().normalize();
    }

    public String store(MultipartFile image, String extension) throws IOException {
        Files.createDirectories(uploadFolder);
        String filename = UUID.randomUUID() + extension;
        Path target = uploadFolder.resolve(filename).normalize();
        if (!target.startsWith(uploadFolder)) throw new IOException("Invalid upload location.");
        image.transferTo(target);
        return "uploads/" + filename;
    }

    /** Delete only generated upload names; a database value is never used as an arbitrary path. */
    public void deleteStoredImage(String imageUrl) {
        if (imageUrl == null || !imageUrl.matches(STORED_IMAGE_PATTERN)) return;
        Path target = uploadFolder.resolve(imageUrl.substring("uploads/".length())).normalize();
        if (!target.startsWith(uploadFolder)) return;
        try {
            Files.deleteIfExists(target);
        } catch (IOException exception) {
            logger.warn("Could not remove an unused wardrobe image file.");
        }
    }
}
