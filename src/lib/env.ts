// Централизованный доступ к переменным окружения с проверкой наличия.
// Бросает понятную ошибку на русском, если критичный секрет не задан.

function required(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value || value.length === 0) {
    throw new Error(
      `Не задана обязательная переменная окружения «${name}». Скопируйте .env.example в .env и заполните значения.`,
    );
  }
  return value;
}

function optionalNumber(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export const env = {
  databaseUrl: required("DATABASE_URL", "file:./dev.db"),
  jwtAccessSecret: required(
    "JWT_ACCESS_SECRET",
    "dev-access-secret-change-me-please-0123456789",
  ),
  jwtRefreshSecret: required(
    "JWT_REFRESH_SECRET",
    "dev-refresh-secret-change-me-please-0123456789",
  ),
  jwtAccessTtl: optionalNumber("JWT_ACCESS_TTL", 900),
  jwtRefreshTtl: optionalNumber("JWT_REFRESH_TTL", 60 * 60 * 24 * 14),
  adminHashRoute: required("ADMIN_HASH_ROUTE", "admin-gateway-local-dev"),
  corsAllowedOrigins: (process.env.CORS_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  isProduction: process.env.NODE_ENV === "production",
};

// Значения admin по умолчанию нужны только для seed.
export const seedAdmin = {
  email: process.env.ADMIN_EMAIL ?? "admin@cryteam.local",
  password: process.env.ADMIN_PASSWORD ?? "Admin#SecWeb2026",
  name: process.env.ADMIN_NAME ?? "Главный администратор",
};
