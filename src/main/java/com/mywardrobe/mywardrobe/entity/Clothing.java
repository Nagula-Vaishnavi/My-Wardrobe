package com.mywardrobe.mywardrobe.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "clothes")
public class Clothing {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Clothing name is required.")
    @Size(max = 120, message = "Clothing name must be 120 characters or fewer.")
    private String name;
    @NotBlank(message = "Choose a clothing category.")
    @Size(max = 80, message = "Category must be 80 characters or fewer.")
    private String category;
    private String brand;
    @DecimalMin(value = "0.0", message = "Price cannot be negative.")
    private Double price;
    private String tags;
    private String imageUrl;
    private String color;
    private String size;
    private String notes;
    @Column(length = 80)
    private String pattern;
    @Column(length = 120)
    private String style;
    @Column(length = 40)
    private String fit;
    @Column(length = 80)
    private String season;
    @Column(length = 120)
    private String material;
    @Column(length = 300)
    private String suitableOccasions;

    @ManyToOne
    @JoinColumn(name = "user_id")
    @JsonIgnore
    private User user;

    // Getters

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public String getCategory() {
        return category;
    }

    public String getBrand() {
        return brand;
    }

    public Double getPrice() {
        return price;
    }

    public String getTags() {
        return tags;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public String getColor() {
        return color;
    }

    public String getSize() {
        return size;
    }

    public String getNotes() {
        return notes;
    }

    public String getPattern() { return pattern; }
    public String getStyle() { return style; }
    public String getFit() { return fit; }
    public String getSeason() { return season; }
    public String getMaterial() { return material; }
    public String getSuitableOccasions() { return suitableOccasions; }

    public User getUser() {
        return user;
    }

    // Setters

    public void setId(Long id) {
        this.id = id;
    }

    public void setName(String name) {
        this.name = name;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public void setBrand(String brand) {
        this.brand = brand;
    }

    public void setPrice(Double price) {
        this.price = price;
    }

    public void setTags(String tags) {
        this.tags = tags;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public void setSize(String size) {
        this.size = size;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public void setPattern(String pattern) { this.pattern = pattern; }
    public void setStyle(String style) { this.style = style; }
    public void setFit(String fit) { this.fit = fit; }
    public void setSeason(String season) { this.season = season; }
    public void setMaterial(String material) { this.material = material; }
    public void setSuitableOccasions(String suitableOccasions) { this.suitableOccasions = suitableOccasions; }

    public void setUser(User user) {
        this.user = user;
    }
}
