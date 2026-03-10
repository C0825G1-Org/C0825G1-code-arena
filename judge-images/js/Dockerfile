FROM node:20-slim

# Cài đặt các tiện ích đo tài nguyên
RUN apt-get update && apt-get install -y time && rm -rf /var/lib/apt/lists/*

# Tạo user không phải root
RUN useradd -m -s /bin/bash judge

WORKDIR /app

# Copy script thực thi
COPY run.sh /usr/local/bin/run.sh
RUN chmod +x /usr/local/bin/run.sh

USER judge

ENTRYPOINT ["/usr/local/bin/run.sh"]
