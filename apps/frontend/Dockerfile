# ============================================================
# Frontend Dockerfile — multi-stage build for React (Vite)
# Stage 1 (builder): installs deps and runs vite build
# Stage 2 (runner): nginx serves the static output
# ============================================================

# --- Stage 1: Build ---------------------------------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace root files for npm workspaces to resolve correctly
COPY package.json package-lock.json ./
COPY apps/frontend/package.json ./apps/frontend/

RUN npm install --workspace=apps/frontend

# Copy source and build the React app
COPY apps/frontend/ ./apps/frontend/

# VITE_ env vars are baked into the bundle at build time
# Pass them via --build-arg in the CI/CD pipeline
ARG VITE_API_BASE_URL=/api
ARG VITE_COGNITO_CLIENT_ID=""
ARG VITE_COGNITO_USER_POOL_ID=""
ARG VITE_AWS_REGION=ap-southeast-1

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_COGNITO_CLIENT_ID=$VITE_COGNITO_CLIENT_ID
ENV VITE_COGNITO_USER_POOL_ID=$VITE_COGNITO_USER_POOL_ID
ENV VITE_AWS_REGION=$VITE_AWS_REGION

RUN npm run build --workspace=apps/frontend

# --- Stage 2: Serve with nginx ----------------------------------------------
FROM nginx:1.27-alpine AS runner

# Replace default nginx config with our SPA config
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

# Copy Vite build output to the nginx web root
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://localhost:80/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
