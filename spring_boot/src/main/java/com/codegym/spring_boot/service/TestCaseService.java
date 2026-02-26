package com.codegym.spring_boot.service;

import com.codegym.spring_boot.dto.TestCaseResult;
import org.springframework.stereotype.Service;

import java.io.IOException;
import java.nio.file.*;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class TestCaseService {

    private static final String PROBLEM_DIR = "problems";

    /**
     * Lấy danh sách input files của 1 bài toán từ thư mục problems
     */
    public List<Path> getInputFiles(String problemId) {
        Path problemPath = Paths.get(PROBLEM_DIR, problemId);

        if (!Files.exists(problemPath)) {
            return List.of();
        }

        try (Stream<Path> stream = Files.list(problemPath)) {
            return stream
                    .filter(path -> path.getFileName().toString().startsWith("input"))
                    .sorted(Comparator.comparing(Path::toString))
                    .collect(Collectors.toList());
        } catch (IOException e) {
            return List.of();
        }
    }
}