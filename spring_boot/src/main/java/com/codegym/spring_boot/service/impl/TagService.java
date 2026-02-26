package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.dto.tag.TagDTO;
import com.codegym.spring_boot.entity.Tag;
import com.codegym.spring_boot.repository.ITagRepository;
import com.codegym.spring_boot.service.ITagService;
import jakarta.persistence.NoResultException;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class TagService implements ITagService {
    private final ITagRepository tagRepository;

    public TagService(ITagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    @Override
    public List<TagDTO> getAllTags() {
        return tagRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    @Override
    public TagDTO getTagById(Integer id) {
        Tag tag = tagRepository.findById(id).orElseThrow(() -> new NoResultException("Không tìm thấy Tag có id: " + id + ""));
        return mapToDTO(tag);
    }

    @Override
    public TagDTO createTag(TagDTO tagDTO) {
        if (tagRepository.existsByName(tagDTO.getName())) {
            throw new RuntimeException("Tên Tag đã tồn tại");
        }
        Tag tag = new Tag();
        tag.setName(tagDTO.getName());
        return mapToDTO(tagRepository.save(tag));
    }

    @Override
    public TagDTO updateTag(Integer id, TagDTO tagDTO) {
        Tag tag = tagRepository.findById(id).orElseThrow(() -> new NoResultException("Không tìm thấy Tag có id " + id + " để cập nhật"));
        tag.setName(tagDTO.getName());
        return mapToDTO(tagRepository.save(tag));
    }

    @Override
    public Boolean deleteTag(Integer id) {
        if (!tagRepository.existsById(id)) {
            return false;
        } else {
            tagRepository.deleteById(id);
            return true;
        }
    }

    private TagDTO mapToDTO(Tag tag) {
        return new TagDTO(tag.getId(), tag.getName());
    }
}
