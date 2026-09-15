# syntax=docker/dockerfile:1

FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci

FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .

# Public values are embedded in the browser bundle. DATABASE_URL is a BuildKit
# secret because this application prerenders database-backed routes at build
# time; the value is available only to this RUN instruction and is not stored
# in an image layer.
ARG NEXT_PUBLIC_SITE_URL=https://cultcodex.me
ARG NEXT_PUBLIC_SENTRY_DSN
ARG NEXT_PUBLIC_DEPLOY_ENV=production
ARG SOURCE_COMMIT=unknown
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL
ENV NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN
ENV NEXT_PUBLIC_DEPLOY_ENV=$NEXT_PUBLIC_DEPLOY_ENV
ENV SOURCE_COMMIT=$SOURCE_COMMIT
RUN --mount=type=secret,id=DATABASE_URL,required=true \
    DATABASE_URL="$(cat /run/secrets/DATABASE_URL)" npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
