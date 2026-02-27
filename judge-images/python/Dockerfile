FROM python:3.11-slim

# Tạo user không phải root
RUN useradd -m -s /bin/bash judge

WORKDIR /app

# Copy script thực thi
COPY run.sh /usr/local/bin/run.sh
RUN chmod +x /usr/local/bin/run.sh

USER judge

ENTRYPOINT ["/usr/local/bin/run.sh"]
