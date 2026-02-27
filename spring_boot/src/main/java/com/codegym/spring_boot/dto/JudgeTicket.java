package com.codegym.spring_boot.dto;

public record JudgeTicket(
        Integer submissionId,
        Integer problemId,
        Integer languageId) {
}
