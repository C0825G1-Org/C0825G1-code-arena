FROM alpine:3.19

# Cài đặt bộ máy biên dịch C++
RUN apk add --no-cache g++ libstdc++

# Tạo user không phải root
RUN addgroup -S judge && adduser -S judge -G judge

WORKDIR /app

# Copy script run
COPY run.sh /app/run.sh
RUN chmod +x /app/run.sh

USER judge

ENTRYPOINT ["/app/run.sh"]