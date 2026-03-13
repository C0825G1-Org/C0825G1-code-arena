package com.codegym.spring_boot.exception;

import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
@Slf4j
public class GlobalExceptionHandler {

    // DTO lỗi chuẩn hóa
    private Map<String, Object> buildError(HttpStatus status, String message) {
        Map<String, Object> error = new HashMap<>();
        error.put("timestamp", LocalDateTime.now());
        error.put("status", status.value());
        error.put("error", status.getReasonPhrase());
        error.put("message", message);
        return error;
    }

    // 401: Sai tên đăng nhập hoặc mật khẩu
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(BadCredentialsException ex) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(buildError(HttpStatus.UNAUTHORIZED, "Tên đăng nhập hoặc mật khẩu không chính xác"));
    }

    // 400: Dữ liệu đầu vào không hợp lệ (Business logic)
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(IllegalArgumentException ex) {
        return ResponseEntity.badRequest().body(buildError(HttpStatus.BAD_REQUEST, ex.getMessage()));
    }

    // 409: Tài khoản đang được đăng nhập ở nơi khác
    @ExceptionHandler(ConcurrentLoginException.class)
    public ResponseEntity<Map<String, Object>> handleConcurrentLogin(ConcurrentLoginException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(buildError(HttpStatus.CONFLICT, ex.getMessage()));
    }

    // 400: Vi phạm State Machine
    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(IllegalStateException ex) {
        return ResponseEntity.badRequest().body(buildError(HttpStatus.BAD_REQUEST, ex.getMessage()));
    }

    // 403: Không có quyền (Ownership check)
    @ExceptionHandler(SecurityException.class)
    public ResponseEntity<Map<String, Object>> handleSecurity(SecurityException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(buildError(HttpStatus.FORBIDDEN, ex.getMessage()));
    }

    // 403: Spring Security Access Denied
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<Map<String, Object>> handleAccessDenied(AccessDeniedException ex) {
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(buildError(HttpStatus.FORBIDDEN, ex.getMessage()));
    }

    // 400: Sai kiểu dữ liệu path variable (vd: gửi "{4}" thay vì 4)
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Map<String, Object>> handleTypeMismatch(MethodArgumentTypeMismatchException ex) {
        String message = "Tham số '" + ex.getName() + "' có giá trị không hợp lệ: " + ex.getValue();
        return ResponseEntity.badRequest().body(buildError(HttpStatus.BAD_REQUEST, message));
    }

    // 422: Validation thất bại (Bean Validation)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        String firstErrorMessage = "Dữ liệu đầu vào không hợp lệ.";
        boolean isFirst = true;

        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
            if (isFirst && fieldError.getDefaultMessage() != null) {
                firstErrorMessage = fieldError.getDefaultMessage();
                isFirst = false;
            }
        }

        Map<String, Object> body = buildError(HttpStatus.UNPROCESSABLE_ENTITY, firstErrorMessage);
        body.put("fieldErrors", fieldErrors);
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY).body(body);
    }

    // 404: Không tìm thấy NoResultException
    @ExceptionHandler(jakarta.persistence.NoResultException.class)
    public ResponseEntity<Map<String, Object>> handleNoResult(jakarta.persistence.NoResultException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(buildError(HttpStatus.NOT_FOUND, ex.getMessage()));
    }

    // 400: File quá lớn
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<Map<String, Object>> handleMaxUploadSizeExceeded(MaxUploadSizeExceededException ex) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(buildError(HttpStatus.BAD_REQUEST, "Kích thước tệp tải lên vượt quá giới hạn cho phép (tối đa 10MB)"));
    }

    // 500: Lỗi không mong đợi
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        log.error("Lỗi hệ thống không mong đợi", ex);
        String message = "Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau.";
        
        // Nếu là lỗi liên quan đến file hoặc IO thì báo lỗi cụ thể hơn
        if (ex instanceof java.io.IOException) {
            message = "Lỗi xử lý tệp tin hoặc kết nối server tải ảnh thất bại.";
        }
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(buildError(HttpStatus.INTERNAL_SERVER_ERROR, message));
    }
}
