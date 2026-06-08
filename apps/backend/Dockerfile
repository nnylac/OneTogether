# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Install deps (workspace root + backend)
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
RUN npm ci

# Copy ALL backend source first
COPY apps/backend ./apps/backend

# Generate Prisma client AFTER source copy so it isn't overwritten
RUN cd apps/backend && npx prisma generate

# Compile TypeScript → dist/
RUN npm run build --workspace=apps/backend

# Fail fast if the build produced nothing
RUN test -f /app/apps/backend/dist/src/main.js || (echo "ERROR: nest build produced no output" && exit 1)

# ── Stage 2: Production ───────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
RUN npm ci --omit=dev

COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/generated ./apps/backend/generated

WORKDIR /app/apps/backend
EXPOSE 3001
CMD ["node", "dist/src/main"]
