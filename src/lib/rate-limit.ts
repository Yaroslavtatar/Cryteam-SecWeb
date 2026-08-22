// Простой in-memory rate limiter (алгоритм фиксированного окна).
// Достаточен для одного инстанса / демонстрации. Для горизонтального
// масштабирования следует заменить хранилище на Redis.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

// Периодическая очистка устаревших записей, чтобы карта не росла бесконечно.
let lastSweep = Date.now();
function sweep(now: number) {
  if (now - lastSweep < 60_000) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterSec: number;
}

/**
 * @param key    Уникальный ключ (например `login:<ip>`).
 * @param limit  Максимум запросов за окно.
 * @param windowMs Длительность окна в миллисекундах.
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now();
  sweep(now);

  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, limit, retryAfterSec: 0 };
  }

  if (bucket.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      limit,
      retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000),
    };
  }

  bucket.count += 1;
  return {
    allowed: true,
    remaining: limit - bucket.count,
    limit,
    retryAfterSec: 0,
  };
}

// Предустановленные политики.
export const RATE_POLICIES = {
  login: { limit: 5, windowMs: 60_000 }, // 5 попыток входа в минуту
  register: { limit: 5, windowMs: 60 * 60_000 }, // 5 регистраций в час
  api: { limit: 100, windowMs: 60_000 }, // общий лимит API
} as const;
