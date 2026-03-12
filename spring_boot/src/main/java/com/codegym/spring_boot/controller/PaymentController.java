package com.codegym.spring_boot.controller;

import com.codegym.spring_boot.config.VNPayConfig;
import com.codegym.spring_boot.dto.response.PaymentUrlResponse;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.service.IPaymentService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
@Slf4j
public class PaymentController {

    private final IPaymentService paymentService;
    private final VNPayConfig vnPayConfig;

    @GetMapping("/create-payment-url")
    public ResponseEntity<PaymentUrlResponse> createPaymentUrl(
            @RequestParam Integer planId,
            @AuthenticationPrincipal User currentUser,
            HttpServletRequest request) {
        String paymentUrl = paymentService.createPaymentUrl(planId, currentUser, request);
        return ResponseEntity.ok(PaymentUrlResponse.builder().paymentUrl(paymentUrl).build());
    }

    @GetMapping("/vnpay-return")
    public void vnpayReturn(HttpServletRequest request, HttpServletResponse response) throws IOException {
        // Use the configured frontend URL for final redirection
        String frontendResultUrl = vnPayConfig.getVnp_FrontendUrl();

        try {
            paymentService.handlePaymentReturn(request);
            String txnRef = request.getParameter("vnp_TxnRef");
            String encoded = URLEncoder.encode(txnRef != null ? txnRef : "", StandardCharsets.UTF_8);
            response.sendRedirect(frontendResultUrl + "?status=success&txnRef=" + encoded);
        } catch (Exception e) {
            log.error("Lỗi khi xử lý callback từ VNPay", e);
            String msg = e.getMessage() != null ? e.getMessage() : "Thanh toan that bai";
            String encodedMsg = URLEncoder.encode(msg, StandardCharsets.UTF_8);
            response.sendRedirect(frontendResultUrl + "?status=error&message=" + encodedMsg);
        }
    }
}
