package com.codegym.spring_boot.service.judge;

import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
public class StrictStringComparator implements OutputComparator {

    @Override
    public String sanitize(String input) {
        if (!StringUtils.hasText(input)) {
            return "";
        }

        // 1. Chuyển \r\n (Windows) thành \n (Linux/Unix)
        String normalized = input.replace("\r\n", "\n");

        // 2. Chuyển về mảng từng dòng
        String[] lines = normalized.split("\n");

        // 3. Trim khoảng trắng ở CUỐI mỗi dòng (trailing spaces)
        StringBuilder builder = new StringBuilder();
        for (String line : lines) {
            // stripTrailing: xóa dấu cách/tab dư ở cuối dòng do user có thể in thừa dấu
            // cách
            builder.append(line.stripTrailing()).append("\n");
        }

        // 4. Bỏ hoàn toàn các dòng rỗng (chỉ có \n) dư lặp lại ở cuối cùng của đoạn
        // text. (Tránh user in rỗng ở cuối thì bị WA)
        return builder.toString().stripTrailing();
    }

    @Override
    public boolean compare(String actual, String expected) {
        if (actual == null && expected == null)
            return true;
        if (actual == null || expected == null)
            return false;

        String cleanActual = sanitize(actual);
        String cleanExpected = sanitize(expected);

        return cleanActual.equals(cleanExpected);
    }
}
