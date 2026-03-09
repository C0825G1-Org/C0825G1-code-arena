package com.codegym.spring_boot.service;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class CloudinaryService {

    private final Cloudinary cloudinary;

    public Map<String, Object> upload(MultipartFile file, String folderName, String publicId) throws IOException {
        try {
            return cloudinary.uploader().upload(file.getBytes(),
                    ObjectUtils.asMap(
                            "folder", folderName,
                            "public_id", publicId,
                            "resource_type", "image"));
        } catch (IOException e) {
            log.error("Lỗi khi tải ảnh lên Cloudinary", e);
            throw e;
        }
    }

    public Map<String, Object> delete(String publicId) throws IOException {
        try {
            return cloudinary.uploader().destroy(publicId, ObjectUtils.emptyMap());
        } catch (IOException e) {
            log.error("Lỗi khi xóa ảnh trên Cloudinary: {}", publicId, e);
            throw e;
        }
    }
}
