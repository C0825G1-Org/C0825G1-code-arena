package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ITagRepository extends JpaRepository<Tag, Integer> {
    boolean existsByName(String name);
}
