#!/bin/sh
# ============================================================
#  CRYTEAM SecWeb — точка входа контейнера.
#  При первом запуске инициализирует SQLite-БД из шаблона,
#  собранного на этапе build (схема + демо-данные), затем
#  запускает Next.js. Файл БД хранится в томе /app/data.
# ============================================================
set -e

DB_FILE="${SQLITE_DB_PATH:-/app/data/prod.db}"
TEMPLATE_DB="/app/prisma/template.db"

mkdir -p "$(dirname "$DB_FILE")"

if [ ! -f "$DB_FILE" ]; then
  echo "[entrypoint] База данных не найдена — инициализация из шаблона: $DB_FILE"
  cp "$TEMPLATE_DB" "$DB_FILE"
else
  echo "[entrypoint] Используется существующая база данных: $DB_FILE"
fi

echo "[entrypoint] Запуск CRYTEAM SecWeb на порту ${PORT:-3000}"
exec node_modules/.bin/next start -p "${PORT:-3000}"
