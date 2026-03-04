package com.codegym.spring_boot.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Path;
import java.nio.file.Paths;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Value("${app.upload.dir:uploads/recordings}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(@org.springframework.lang.NonNull ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get("uploads");
        String absolutePath = uploadPath.toFile().getAbsolutePath();

        // Map /uploads/** to the physical directory
        registry.addResourceHandler("/uploads/**")
                .addResourceLocations("file:/" + absolutePath + "/");
    }
}
