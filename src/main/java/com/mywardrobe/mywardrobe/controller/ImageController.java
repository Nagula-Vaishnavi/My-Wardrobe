package com.mywardrobe.mywardrobe.controller;

import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/uploads")
public class ImageController {

    @GetMapping("/{filename}")
    public ResponseEntity<Resource> getImage(
            @PathVariable String filename)
            throws MalformedURLException, IOException {

        if (filename == null
                || filename.length() > 200
                || filename.contains("..")
                || !filename.matches("[A-Za-z0-9 _.-]+\\.(?i:jpg|jpeg|png|webp|gif)")) {
            return ResponseEntity.notFound().build();
        }

        Path uploadFolder = Paths.get("uploads").toAbsolutePath().normalize();
        Path filePath = uploadFolder.resolve(filename).normalize();
        if (!filePath.startsWith(uploadFolder)) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new UrlResource(filePath.toUri());

        if (!resource.exists() || !resource.isReadable()) {
            return ResponseEntity.notFound().build();
        }

        String contentType = Files.probeContentType(filePath);

        if (contentType == null) {
            contentType = MediaType.APPLICATION_OCTET_STREAM_VALUE;
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .body(resource);
    }
}
