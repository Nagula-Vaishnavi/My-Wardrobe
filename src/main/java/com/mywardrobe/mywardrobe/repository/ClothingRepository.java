package com.mywardrobe.mywardrobe.repository;

import com.mywardrobe.mywardrobe.entity.Clothing;
import com.mywardrobe.mywardrobe.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ClothingRepository extends JpaRepository<Clothing,Long>{

    List<Clothing> findByUser(User user);

    Optional<Clothing> findByIdAndUser(Long id, User user);

}
