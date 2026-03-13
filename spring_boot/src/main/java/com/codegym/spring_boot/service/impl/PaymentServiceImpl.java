package com.codegym.spring_boot.service.impl;

import com.codegym.spring_boot.config.VNPayConfig;
import com.codegym.spring_boot.entity.SubscriptionPlan;
import com.codegym.spring_boot.entity.User;
import com.codegym.spring_boot.entity.UserSubscription;
import com.codegym.spring_boot.repository.SubscriptionPlanRepository;
import com.codegym.spring_boot.repository.UserRepository;
import com.codegym.spring_boot.repository.UserSubscriptionRepository;
import com.codegym.spring_boot.service.IPaymentService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements IPaymentService {

    private final VNPayConfig vnPayConfig;
    private final SubscriptionPlanRepository planRepository;
    private final UserSubscriptionRepository userSubscriptionRepository;
    private final UserRepository userRepository;

    @Override
    public String createPaymentUrl(Integer planId, User currentUser, HttpServletRequest request) {
        SubscriptionPlan plan = planRepository.findById(planId)
                .orElseThrow(() -> new IllegalArgumentException("Gói cước không tồn tại."));

        if (!plan.getIsActive()) {
            throw new IllegalArgumentException("Gói cước đã ngừng hỗ trợ.");
        }

        long amountInt = plan.getPrice().longValue() * 100L; // VNPay expected format is multiplied by 100

        String vnp_TxnRef = vnPayConfig.getRandomNumber(8) + "_" + currentUser.getId() + "_" + plan.getId();
        
        String vnp_IpAddr = getIpAddress(request);

        Map<String, String> vnp_Params = new HashMap<>();
        vnp_Params.put("vnp_Version", vnPayConfig.getVnp_Version());
        vnp_Params.put("vnp_Command", vnPayConfig.getVnp_Command());
        vnp_Params.put("vnp_TmnCode", vnPayConfig.getVnp_TmnCode());
        vnp_Params.put("vnp_Amount", String.valueOf(amountInt));
        vnp_Params.put("vnp_CurrCode", "VND");
        vnp_Params.put("vnp_TxnRef", vnp_TxnRef);
        vnp_Params.put("vnp_OrderInfo", "Thanh toan don hang " + vnp_TxnRef);
        vnp_Params.put("vnp_OrderType", "other");
        vnp_Params.put("vnp_Locale", "vn");
        vnp_Params.put("vnp_ReturnUrl", vnPayConfig.getVnp_ReturnUrl());
        vnp_Params.put("vnp_IpAddr", vnp_IpAddr);

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
        String vnp_CreateDate = formatter.format(LocalDateTime.now());
        vnp_Params.put("vnp_CreateDate", vnp_CreateDate);

        // Build URL parameters
        List<String> fieldNames = new ArrayList<>(vnp_Params.keySet());
        Collections.sort(fieldNames);
        StringBuilder hashData = new StringBuilder();
        StringBuilder query = new StringBuilder();

        try {
            Iterator<String> itr = fieldNames.iterator();
            while (itr.hasNext()) {
                String fieldName = itr.next();
                String fieldValue = vnp_Params.get(fieldName);
                if ((fieldValue != null) && (fieldValue.length() > 0)) {
                    // Build hash data
                    hashData.append(fieldName);
                    hashData.append('=');
                    hashData.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    // Build query
                    query.append(URLEncoder.encode(fieldName, StandardCharsets.US_ASCII.toString()));
                    query.append('=');
                    query.append(URLEncoder.encode(fieldValue, StandardCharsets.US_ASCII.toString()));
                    if (itr.hasNext()) {
                        query.append('&');
                        hashData.append('&');
                    }
                }
            }
        } catch (UnsupportedEncodingException e) {
            log.error("Lỗi mã hóa tham số VNPay", e);
            throw new RuntimeException("Tạo URL thanh toán thất bại.");
        }

        String queryUrl = query.toString();
        String vnp_SecureHash = vnPayConfig.hmacSHA512(vnPayConfig.getSecretKey(), hashData.toString());
        queryUrl += "&vnp_SecureHash=" + vnp_SecureHash;

        return vnPayConfig.getVnp_PayUrl() + "?" + queryUrl;
    }

    @Override
    @Transactional
    public void handlePaymentReturn(HttpServletRequest request) throws Exception {
        Map<String, String> fields = new HashMap<>();
        for (Enumeration<String> params = request.getParameterNames(); params.hasMoreElements(); ) {
            String fieldName = params.nextElement();
            String fieldValue = request.getParameter(fieldName);
            if ((fieldValue != null) && (fieldValue.length() > 0)) {
                fields.put(fieldName, fieldValue);
            }
        }

        String vnp_SecureHash = request.getParameter("vnp_SecureHash");
        if (fields.containsKey("vnp_SecureHashType")) {
            fields.remove("vnp_SecureHashType");
        }
        if (fields.containsKey("vnp_SecureHash")) {
            fields.remove("vnp_SecureHash");
        }

        // Verify signature
        String signValue = vnPayConfig.hashAllFields(fields);
        
        if (!signValue.equals(vnp_SecureHash)) {
            log.error("Chữ ký VNPay không hợp lệ! vnp_TxnRef={}", request.getParameter("vnp_TxnRef"));
            throw new SecurityException("Chữ ký không hợp lệ!");
        }
        
        // Ensure successful code '00'
        if (!"00".equals(request.getParameter("vnp_ResponseCode"))) {
            log.warn("Thanh toán bị hủy hoặc lỗi! Response Code = {}", request.getParameter("vnp_ResponseCode"));
            throw new RuntimeException("Thanh toán VNPay không thành công hoặc bị hủy.");
        }

        String txnRef = request.getParameter("vnp_TxnRef"); // format: random_userId_planId
        String transactionId = request.getParameter("vnp_TransactionNo");

        String[] parts = txnRef.split("_");
        if (parts.length < 3) {
            throw new IllegalArgumentException("Mã đơn hàng không đúng định dạng.");
        }

        int userId = Integer.parseInt(parts[1]);
        int planId = Integer.parseInt(parts[2]);

        User user = userRepository.findById(userId).orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại"));
        SubscriptionPlan plan = planRepository.findById(planId).orElseThrow(() -> new IllegalArgumentException("Gói đăng ký không tồn tại"));

        // Disable existing active subscriptions
        List<UserSubscription> existingSubs = userSubscriptionRepository.findByUserId(userId);
        LocalDateTime now = LocalDateTime.now();
        for (UserSubscription sub : existingSubs) {
            if ("ACTIVE".equals(sub.getStatus()) && sub.getEndDate().isAfter(now)) {
                sub.setStatus("CANCELLED"); // or "OVERRIDDEN" maybe
                userSubscriptionRepository.save(sub);
            }
        }

        UserSubscription newSub = UserSubscription.builder()
                .user(user)
                .plan(plan)
                .status("ACTIVE")
                .startDate(now)
                .endDate(now.plusDays(30)) // Add 1 month exactly
                .transactionId("VNPAYNO: " + transactionId + " - TxnRef: " + txnRef)
                .build();

        userSubscriptionRepository.save(newSub);
        log.info("Cập nhật thành công Subscription [{}] cho User [{}]", plan.getName(), user.getUsername());
    }

    private String getIpAddress(HttpServletRequest request) {
        String ipAddress = request.getHeader("X-FORWARDED-FOR");
        if (ipAddress == null || ipAddress.isEmpty() || "unknown".equalsIgnoreCase(ipAddress)) {
            ipAddress = request.getRemoteAddr();
        }
        if (ipAddress != null && ipAddress.length() > 15 && ipAddress.indexOf(",") > 0) {
            ipAddress = ipAddress.substring(0, ipAddress.indexOf(","));
        }
        return ipAddress != null ? ipAddress : "127.0.0.1";
    }
}
