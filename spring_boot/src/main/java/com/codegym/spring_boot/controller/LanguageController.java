package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.entity.Language;
import com.codegym.spring_boot.repository.LanguageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/languages")
@RequiredArgsConstructor
public class LanguageController {
    private final LanguageRepository languageRepository;

    @GetMapping
    public ResponseEntity<List<Language>> getAllLanguages() {
        return ResponseEntity.ok(languageRepository.findAllByIsActiveTrue());
    }
}
