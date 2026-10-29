
package com.mywardrobe.mywardrobe.entity;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;

@Entity
@Table(name = "outfits")
public class Outfit {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Outfit name is required.")
    @Size(max = 120, message = "Outfit name must be 120 characters or fewer.")
    private String name;

    private String occasion;

    private String weather;

    @Column(name = "worn_at")
    private LocalDateTime wornAt;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean favorite;

    @Column(columnDefinition = "TEXT")
    private String clothingItemIds;

    @Column(columnDefinition = "TEXT")
    private String clothingItemNames;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @com.fasterxml.jackson.annotation.JsonIgnore
    private User user;

    public Outfit() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getOccasion() {
        return occasion;
    }

    public void setOccasion(String occasion) {
        this.occasion = occasion;
    }

    public String getWeather() {
        return weather;
    }

    public void setWeather(String weather) {
        this.weather = weather;
    }

    public LocalDateTime getWornAt() {
        return wornAt;
    }

    public void setWornAt(LocalDateTime wornAt) {
        this.wornAt = wornAt;
    }

    public boolean isFavorite() { return favorite; }
    public void setFavorite(boolean favorite) { this.favorite = favorite; }

    public String getClothingItemIds() {
        return clothingItemIds;
    }

    public void setClothingItemIds(String clothingItemIds) {
        this.clothingItemIds = clothingItemIds;
    }

    public String getClothingItemNames() {
        return clothingItemNames;
    }

    public void setClothingItemNames(String clothingItemNames) {
        this.clothingItemNames = clothingItemNames;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
