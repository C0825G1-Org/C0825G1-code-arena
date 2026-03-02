FROM alpine:3.19

# Cài đặt bộ máy biên dịch C++
RUN apk add --no-cache g++ libstdc++ bash

# Tạo user không phải root
RUN addgroup -S judge && adduser -S judge -G judge

WORKDIR /app

# Copy script run
COPY run.sh /usr/local/bin/run.sh
RUN chmod +x /usr/local/bin/run.sh

USER judge

ENTRYPOINT ["/usr/local/bin/run.sh"]