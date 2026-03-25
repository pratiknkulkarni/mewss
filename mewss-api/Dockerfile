# mewss-api/Dockerfile

# ── Stage 1: Production dependencies ─────────────────────────────────────────
FROM oven/bun:1-alpine AS deps

WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production

# ── Stage 2: Type-check and compile ──────────────────────────────────────────
FROM oven/bun:1-alpine AS build

WORKDIR /app
COPY package.json bun.lock tsconfig.json ./
RUN bun install --frozen-lockfile

COPY src ./src

# Fail the build on type errors
RUN bun run tsc --noEmit
# Compile TypeScript to dist/
RUN bun run build

# ── Stage 3: Runtime ──────────────────────────────────────────────────────────
FROM oven/bun:1-alpine AS runtime

WORKDIR /app

# Non-root user
RUN addgroup -S mewss && adduser -S mewss -G mewss

COPY --from=deps  /app/node_modules ./node_modules
COPY --from=build /app/dist         ./dist

USER mewss

EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/api/health || exit 1

CMD ["bun", "dist/index.js"]
