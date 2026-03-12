package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.entity.SubscriptionPlan;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.service.ISubscriptionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final ISubscriptionService subscriptionService;

    @GetMapping("/plans")
    public ResponseEntity<List<SubscriptionPlan>> getActivePlans() {
        return ResponseEntity.ok(subscriptionService.getAllActivePlans());
    }

    @GetMapping("/my-plan")
    public ResponseEntity<SubscriptionPlan> getMyPlan(@AuthenticationPrincipal User currentUser) {
        SubscriptionPlan plan = subscriptionService.getUserActivePlan(currentUser.getId());
        return ResponseEntity.ok(plan);
    }
}

