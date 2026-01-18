# ============================================
# SpaceIdentity - Optimized for Vultr Deployment
# Multi-stage build for smaller image size
# ============================================

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install dependencies for canvas (native module)
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

# Stage 2: Builder
FROM node:20-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install canvas dependencies for build
RUN apk add --no-cache \
    cairo-dev \
    pango-dev \
    jpeg-dev \
    giflib-dev \
    librsvg-dev \
    pixman-dev

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build arguments for environment variables
ARG GEMINI_API_KEY
ARG VULTR_OBJECT_STORAGE_HOSTNAME
ARG VULTR_OBJECT_STORAGE_ACCESS_KEY
ARG VULTR_OBJECT_STORAGE_SECRET_KEY

ENV GEMINI_API_KEY=$GEMINI_API_KEY
ENV VULTR_OBJECT_STORAGE_HOSTNAME=$VULTR_OBJECT_STORAGE_HOSTNAME
ENV VULTR_OBJECT_STORAGE_ACCESS_KEY=$VULTR_OBJECT_STORAGE_ACCESS_KEY
ENV VULTR_OBJECT_STORAGE_SECRET_KEY=$VULTR_OBJECT_STORAGE_SECRET_KEY

# Build Next.js app
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner (Production)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Install runtime dependencies for canvas
RUN apk add --no-cache \
    cairo \
    pango \
    jpeg \
    giflib \
    librsvg \
    pixman

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public

# Set correct permissions for prerender cache
RUN mkdir .next
RUN chown nextjs:nodejs .next

# Copy built application
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Health check for Vultr Load Balancer
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "server.js"]
