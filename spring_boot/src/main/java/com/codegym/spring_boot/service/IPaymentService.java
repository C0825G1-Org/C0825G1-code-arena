package com.codegym.spring_boot.service;

import com.codegym.spring_boot.entity.User;
import jakarta.servlet.http.HttpServletRequest;

public interface IPaymentService {
    String createPaymentUrl(Integer planId, User currentUser, HttpServletRequest request);
    void handlePaymentReturn(HttpServletRequest request) throws Exception;
}
