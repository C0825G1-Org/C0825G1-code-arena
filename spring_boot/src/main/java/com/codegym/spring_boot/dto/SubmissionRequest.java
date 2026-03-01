package com.codegym.spring_boot.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class SubmissionRequest {

    @NotBlank(message = "Language must not be empty")
    @Pattern(regexp = "^(java|cpp|python|js)$", message = "Supported languages: java, cpp, python, js")
    private String language;

    @NotBlank(message = "Problem ID must not be empty")
    private String problemId;

    @Size(max = 100_000, message = "Source code too large (max 100000 characters)")
    private String sourceCode;

    // ===== Constructor rỗng (bắt buộc cho Jackson) =====
    public SubmissionRequest() {
    }

    // ===== Constructor đầy đủ =====
    public SubmissionRequest(String language, String problemId, String sourceCode) {
        this.language = language;
        this.problemId = problemId;
        this.sourceCode = sourceCode;
    }

    // ===== Getter & Setter =====

    public String getLanguage() {
        return language;
    }

    public void setLanguage(String language) {
        this.language = language;
    }

    public String getProblemId() {
        return problemId;
    }

    public void setProblemId(String problemId) {
        this.problemId = problemId;
    }

    public String getSourceCode() {
        return sourceCode;
    }

    public void setSourceCode(String sourceCode) {
        this.sourceCode = sourceCode;
    }
}