# Сборка под Intel (linux/amd64)
FROM --platform=linux/amd64 node:22 AS build
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM --platform=linux/amd64 nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html

RUN rm -f /etc/nginx/conf.d/default.conf && \
    printf '%s\n' "\
server { \
    listen 80; \
    server_name _; \
    root /usr/share/nginx/html; \
    index index.html; \
    add_header X-Content-Type-Options nosniff always; \
    add_header X-Frame-Options DENY always; \
    add_header Referrer-Policy no-referrer-when-downgrade always; \
    gzip on; \
    gzip_comp_level 6; \
    gzip_min_length 1024; \
    gzip_types text/plain text/css text/javascript application/javascript application/json application/xml image/svg+xml font/ttf font/otf application/vnd.ms-fontobject; \
    location ~* \.(?:js|mjs|css|png|jpg|jpeg|gif|webp|ico|svg|woff2?|ttf)$ { \
        try_files \$uri =404; \
        access_log off; \
        add_header Cache-Control \"public, max-age=31536000, immutable\"; \
    } \
    location = /index.html { \
        try_files /index.html =404; \
        add_header Cache-Control \"no-store\"; \
    } \
    location / { \
        try_files \$uri \$uri/ /index.html; \
    } \
    error_page 500 502 503 504 /index.html; \
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
