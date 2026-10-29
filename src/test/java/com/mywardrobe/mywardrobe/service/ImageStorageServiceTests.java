package com.mywardrobe.mywardrobe.service;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class ImageStorageServiceTests {
    @TempDir
    Path temporaryDirectory;

    @Test
    void deletesOnlyGeneratedImageNamesInsideUploadDirectory() throws Exception {
        Path uploads = Files.createDirectory(temporaryDirectory.resolve("uploads"));
        String filename = UUID.randomUUID() + ".jpg";
        Path generatedImage = Files.writeString(uploads.resolve(filename), "test image");
        Path unrelatedFile = Files.writeString(temporaryDirectory.resolve("keep.txt"), "keep");
        ImageStorageService storage = new ImageStorageService(uploads);

        storage.deleteStoredImage("uploads/" + filename);
        storage.deleteStoredImage("uploads/../keep.txt");

        assertFalse(Files.exists(generatedImage));
        assertTrue(Files.exists(unrelatedFile));
    }
}
