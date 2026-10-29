
package com.mywardrobe.mywardrobe.repository;

import com.mywardrobe.mywardrobe.entity.Outfit;
import com.mywardrobe.mywardrobe.entity.User;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface OutfitRepository extends JpaRepository<Outfit, Long> {

    List<Outfit> findByUser(User user);

    Optional<Outfit> findByIdAndUser(Long id, User user);

}
