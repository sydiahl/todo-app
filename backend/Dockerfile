# ─── Stage 1: Build ──────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# ─── Stage 2: Runtime ────────────────────────────────
FROM node:20-alpine AS runtime
WORKDIR /app

# Non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

# Copy only production deps and source
COPY --from=builder /app/node_modules ./node_modules
COPY src/ ./src/
COPY package.json ./

# Security: read-only FS friendly (logs go to stdout)
USER appuser
EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost:3001/health || exit 1

CMD ["node", "src/index.js"]

