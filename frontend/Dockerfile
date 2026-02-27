# ─── Stage 1: Build React ────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
ARG REACT_APP_API_URL
ENV REACT_APP_API_URL=$REACT_APP_API_URL
RUN npm run build

# ─── Stage 2: Serve with Nginx ───────────────────────
FROM nginx:1.25-alpine AS runtime

RUN addgroup -S nginxgroup && adduser -S nginxuser -G nginxgroup \
    && chown -R nginxuser:nginxgroup /var/cache/nginx \
    && chown -R nginxuser:nginxgroup /var/log/nginx \
    && chown -R nginxuser:nginxgroup /usr/share/nginx/html \
    && touch /var/run/nginx.pid \
    && chown -R nginxuser:nginxgroup /var/run/nginx.pid \
    && chown -R nginxuser:nginxgroup /etc/nginx/conf.d \
    && sed -i 's|/var/run/nginx.pid|/tmp/nginx.pid|g' /etc/nginx/nginx.conf

COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

USER nginxuser
EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s CMD wget -qO- http://localhost/health || exit 1
