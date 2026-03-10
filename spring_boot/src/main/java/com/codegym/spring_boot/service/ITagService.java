package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.tag.TagDTO;

import java.util.List;

public interface ITagService {
    List<TagDTO> getAllTags();
    TagDTO getTagById(Integer id);
    TagDTO createTag(TagDTO tagDTO);
    TagDTO updateTag(Integer id, TagDTO tagDTO);
    Boolean deleteTag(Integer id);

}
