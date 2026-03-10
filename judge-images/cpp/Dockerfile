FROM debian:12-slim

# Cài đặt bộ máy biên dịch C++ và các tiện ích đo tài nguyên
RUN apt-get update && apt-get install -y \
    g++ \
    bash \
    time \
    && rm -rf /var/lib/apt/lists/*

# Tạo user không phải root
RUN useradd -m -s /bin/bash judge

WORKDIR /app

# Copy script run
COPY run.sh /usr/local/bin/run.sh
RUN chmod +x /usr/local/bin/run.sh

USER judge

ENTRYPOINT ["/usr/local/bin/run.sh"]