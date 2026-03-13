package com.codegym.spring_boot.exception;

public class ConcurrentLoginException extends RuntimeException {
    public ConcurrentLoginException(String message) {
        super(message);
    }
}
