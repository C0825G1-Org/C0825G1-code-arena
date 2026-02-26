package com.codegym.spring_boot.dto.contest.request;

import lombok.Data;

@Data
public class UnfreezeProblemRequest {
    private boolean triggerRejudge = false;
}
