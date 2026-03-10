package com.codegym.spring_boot.repository;

import com.codegym.spring_boot.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ITagRepository extends JpaRepository<Tag, Integer> {
    @Query("SELECT new com.codegym.spring_boot.dto.tag.TagDTO(t.id, t.name, CAST(SIZE(t.problems) AS int)) FROM Tag t")
    List<com.codegym.spring_boot.dto.tag.TagDTO> findAllTagsWithProblemCount();
    
    boolean existsByName(String name);
}
