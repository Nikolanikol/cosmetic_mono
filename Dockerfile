FROM node:20-alpine AS base

FROM base AS deps
WORKDIR /app
COPY apps/web/package.json apps/web/package-lock.json ./apps/web/
RUN cd apps/web && npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/apps/web/node_modules ./apps/web/node_modules
COPY apps/web ./apps/web
COPY packages ./packages

ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_APP_URL
ARG NEXT_PUBLIC_GA_ID
ARG NEXT_PUBLIC_YM_ID
ARG SUPABASE_SERVICE_ROLE_KEY
ARG YOOKASSA_SHOP_ID
ARG YOOKASSA_SECRET_KEY
ARG YOOKASSA_WEBHOOK_SECRET
ARG GROQ_API_KEY

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_GA_ID=$NEXT_PUBLIC_GA_ID
ENV NEXT_PUBLIC_YM_ID=$NEXT_PUBLIC_YM_ID
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV YOOKASSA_SHOP_ID=$YOOKASSA_SHOP_ID
ENV YOOKASSA_SECRET_KEY=$YOOKASSA_SECRET_KEY
ENV YOOKASSA_WEBHOOK_SECRET=$YOOKASSA_WEBHOOK_SECRET
ENV GROQ_API_KEY=$GROQ_API_KEY
ENV NEXT_TELEMETRY_DISABLED=1

RUN cd apps/web && npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder /app/apps/web/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "apps/web/server.js"]
