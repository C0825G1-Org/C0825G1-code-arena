package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.util.PracticeEloMigration;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/migration")
@RequiredArgsConstructor
public class MigrationController {

    private final PracticeEloMigration practiceEloMigration;

    @PostMapping("/practice-elo")
    public ResponseEntity<String> migratePracticeElo() {
        try {
            practiceEloMigration.migrate();
            return ResponseEntity.ok("Practice Elo Migration completed successfully");
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Migration failed: " + e.getMessage());
        }
    }
}
