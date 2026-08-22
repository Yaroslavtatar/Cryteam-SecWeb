# ============================================================
#  CRYTEAM SecWeb — Dockerfile (готов для Coolify)
#  Многоступенчатая сборка Next.js + Prisma (SQLite).
# ============================================================

# ---------- 1) Builder ----------
FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# openssl нужен движку запросов Prisma
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Установка зависимостей (кэшируемый слой)
COPY package.json package-lock.json ./
RUN npm ci

# Исходники и сборка
COPY . .
ENV DATABASE_URL="file:/app/prisma/template.db"
RUN npx prisma generate \
  && npm run build

# Шаблон БД (схема + демо-данные), копируется в том при первом старте
RUN npx prisma db push --skip-generate \
  && npm run db:seed

# ---------- 2) Runner ----------
FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
# Путь к файлу БД внутри тома (переопределяется через окружение)
ENV DATABASE_URL="file:/app/data/prod.db"
ENV SQLITE_DB_PATH="/app/data/prod.db"

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Непривилегированный пользователь
RUN groupadd -r nodejs && useradd -r -g nodejs nextjs

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.mjs ./next.config.mjs
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh \
  && mkdir -p /app/data \
  && chown -R nextjs:nodejs /app

USER nextjs
EXPOSE 3000

# Том для персистентности SQLite
VOLUME ["/app/data"]

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
