# ============================================================
# Backend Dockerfile — multi-stage build for NestJS
# Stage 1 (builder): installs deps and compiles TypeScript
# Stage 2 (runner): copies only the compiled dist + prod deps
# ============================================================

# --- Stage 1: Build ---------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root package files first (layer cache: only re-run npm install
# when package-lock.json changes, not on every code change)
COPY package.json package-lock.json ./
COPY apps/backend/package.json ./apps/backend/

# Install ALL dependencies including dev (needed for the TypeScript build)
RUN npm install --workspace=apps/backend

# Copy source and compile TypeScript → dist/
COPY apps/backend/ ./apps/backend/
RUN npm run build --workspace=apps/backend

# --- Stage 2: Production image ----------------------------------------------
FROM node:20-alpine AS runner

# Run as non-root for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
WORKDIR /app
RUN chown appuser:appgroup /app
USER appuser

# Copy workspace root and backend package files
COPY --chown=appuser:appgroup package.json package-lock.json ./
COPY --chown=appuser:appgroup apps/backend/package.json ./apps/backend/

# Install only production dependencies (no devDependencies)
RUN npm install --workspace=apps/backend --omit=dev

# Copy compiled output from builder stage
COPY --from=builder --chown=appuser:appgroup /app/apps/backend/dist ./apps/backend/dist

WORKDIR /app/apps/backend
EXPOSE 3001

# Health check — used by ECS/EKS to determine pod readiness
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3001/api/incidents || exit 1

CMD ["node", "dist/main.js"]
