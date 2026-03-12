package com.codegym.spring_boot.service;

import com.codegym.spring_boot.entity.SubscriptionPlan;

import java.util.List;

public interface ISubscriptionService {
    /**
     * Lấy danh sách tất cả các gói dịch vụ đang hoạt động
     */
    List<SubscriptionPlan> getAllActivePlans();

    /**
     * Lấy cấu hình gói dịch vụ hiện tại (đang active) của một User
     * Nếu không có gói mua nào đang active, trả về gói cấu hình Free mặc định.
     */
    SubscriptionPlan getUserActivePlan(Integer userId);
    
    /**
     * Tạo dữ liệu mẫu các gói (Free, Pro) nếu chưa có trong DB
     */
    void seedDefaultPlans();
}
