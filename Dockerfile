FROM node:24-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# Cài dependencies (gồm cả devDependencies để build)
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# Build Next.js ở chế độ standalone
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV STANDALONE=1
RUN npm run build

# Image chạy thật, chỉ chứa phần cần thiết
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public

# RSVP & lời chúc được ghi vào đây (mount volume trong docker-compose.yml)
RUN mkdir -p /app/data && chown node:node /app/data

USER node
EXPOSE 3000
CMD ["node", "server.js"]
