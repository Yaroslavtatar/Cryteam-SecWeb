import { NextResponse, type NextRequest } from "next/server";
import { COOKIE } from "./auth";

// Единый формат ответов API и вспомогательные функции безопасности.

export function jsonOk<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(
  message: string,
  status = 400,
  extra?: { fields?: Record<string, string>; code?: string },
): NextResponse {
  return NextResponse.json(
    { ok: false, error: message, ...extra },
    { status },
  );
}

/** Извлекает IP-адрес клиента из заголовков прокси. */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return req.headers.get("x-real-ip") ?? "неизвестно";
}

/**
 * Проверка CSRF по схеме double-submit cookie: значение из cookie должно
 * совпасть с заголовком X-CSRF-Token. Применяется к изменяющим запросам.
 */
export function verifyCsrf(req: NextRequest): boolean {
  const cookieToken = req.cookies.get(COOKIE.csrf)?.value;
  const headerToken = req.headers.get("x-csrf-token");
  if (!cookieToken || !headerToken) return false;
  // Постоянное по времени сравнение.
  if (cookieToken.length !== headerToken.length) return false;
  let diff = 0;
  for (let i = 0; i < cookieToken.length; i++) {
    diff |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i);
  }
  return diff === 0;
}

/** Ответ при превышении лимита запросов. */
export function tooManyRequests(retryAfterSec: number): NextResponse {
  const res = jsonError(
    `Слишком много запросов. Повторите попытку через ${retryAfterSec} сек.`,
    429,
    { code: "RATE_LIMITED" },
  );
  res.headers.set("Retry-After", String(retryAfterSec));
  return res;
}
