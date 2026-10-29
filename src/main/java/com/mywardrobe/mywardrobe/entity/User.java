package com.mywardrobe.mywardrobe.entity;
import jakarta.persistence.*;
@Entity
@Table(name="users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    @Column(unique = true,nullable = false)
    private String email;
    private String password;
    @Column(length = 40, nullable = false, columnDefinition = "varchar(40) default 'Casual'")
    private String preferredStyle = "Casual";
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean showPrices;
    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean preferencesConfigured;


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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
    }

    public String getPreferredStyle() { return preferredStyle; }
    public void setPreferredStyle(String preferredStyle) { this.preferredStyle = preferredStyle; }
    public boolean isShowPrices() { return showPrices; }
    public void setShowPrices(boolean showPrices) { this.showPrices = showPrices; }
    public boolean isPreferencesConfigured() { return preferencesConfigured; }
    public void setPreferencesConfigured(boolean preferencesConfigured) { this.preferencesConfigured = preferencesConfigured; }
}
