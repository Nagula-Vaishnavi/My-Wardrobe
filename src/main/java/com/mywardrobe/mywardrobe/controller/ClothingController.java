package com.mywardrobe.mywardrobe.controller;

import com.mywardrobe.mywardrobe.entity.Clothing;
import com.mywardrobe.mywardrobe.service.ClothingService;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;

import java.util.List;

@RestController
@RequestMapping("api/clothes")
public class ClothingController {
    private final ClothingService clothingService;
    public ClothingController(ClothingService clothingService){
        this.clothingService = clothingService;
    }

    @PostMapping
    public Clothing addClothing(@Valid @RequestBody Clothing clothing){
        return clothingService.addClothing(clothing);
    }
    @GetMapping
    public List<Clothing> getAllClothing() {
        return clothingService.getAllClothing();
    }
    @DeleteMapping("/{id}")
    public String deleteClothing(@PathVariable Long id) {

        clothingService.deleteClothing(id);

        return "Clothing deleted successfully";
    }
    @PutMapping("/{id}")
    public Clothing updateClothing(
            @PathVariable Long id,
            @Valid @RequestBody Clothing clothing) {

        return clothingService.updateClothing(id, clothing);
    }

}
