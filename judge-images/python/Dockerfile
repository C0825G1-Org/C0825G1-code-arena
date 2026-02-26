FROM python:3.11-slim

# Tạo user không phải root
RUN useradd -m -s /bin/bash judge

WORKDIR /app

# Copy script thực thi
COPY run.sh /app/run.sh
RUN chmod +x /app/run.sh

USER judge

ENTRYPOINT ["/app/run.sh"]
