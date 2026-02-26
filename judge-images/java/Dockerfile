# Sử dụng image ổn định từ Eclipse Temurin
FROM eclipse-temurin:21-jdk-jammy

# Tạo user không phải root
RUN useradd -m -s /bin/bash judge

# Tạo thư mục làm việc
WORKDIR /app

# Copy script thực thi
COPY run.sh /app/run.sh

# Cấp quyền execute
RUN chmod +x /app/run.sh

# Chuyển sang user không phải root
USER judge

# Entry point
ENTRYPOINT ["/app/run.sh"]