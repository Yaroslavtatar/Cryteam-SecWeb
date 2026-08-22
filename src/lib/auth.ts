import { cookies } from "next/headers";
import type { NextResponse } from "next/server";
import { env } from "./env";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  type SessionClaims,
} from "./jwt";
import { prisma } from "./db";

// Имена cookie. Access/Refresh — строго HttpOnly. CSRF-токен читаем из JS
// (паттерн double-submit), поэтому HttpOnly=false.
export const COOKIE = {
  access: "cts_at",
  refresh: "cts_rt",
  csrf: "cts_csrf",
} as const;

export interface SessionUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

function baseCookieOptions() {
  return {
    httpOnly: true as const,
    secure: env.isProduction,
    sameSite: "lax" as const,
    path: "/",
  };
}

/** Генерирует случайный CSRF-токен (для паттерна double-submit cookie). */
export function generateCsrfToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/** Выпускает пару токенов и записывает их в защищённые cookie ответа. */
export async function issueSession(
  res: NextResponse,
  user: SessionUser,
): Promise<void> {
  const payload = {
    sub: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
  const [access, refresh] = await Promise.all([
    signAccessToken(payload),
    signRefreshToken(payload),
  ]);

  res.cookies.set(COOKIE.access, access, {
    ...baseCookieOptions(),
    maxAge: env.jwtAccessTtl,
  });
  res.cookies.set(COOKIE.refresh, refresh, {
    ...baseCookieOptions(),
    maxAge: env.jwtRefreshTtl,
    path: "/api/auth",
  });
  res.cookies.set(COOKIE.csrf, generateCsrfToken(), {
    httpOnly: false,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: env.jwtRefreshTtl,
  });
}

/** Стирает все сессионные cookie. */
export function clearSession(res: NextResponse): void {
  res.cookies.set(COOKIE.access, "", { ...baseCookieOptions(), maxAge: 0 });
  res.cookies.set(COOKIE.refresh, "", {
    ...baseCookieOptions(),
    path: "/api/auth",
    maxAge: 0,
  });
  res.cookies.set(COOKIE.csrf, "", {
    httpOnly: false,
    secure: env.isProduction,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
}

/** Читает и проверяет access-токен из cookie запроса. */
export async function getSessionClaims(): Promise<SessionClaims | null> {
  const token = cookies().get(COOKIE.access)?.value;
  if (!token) return null;
  return verifyAccessToken(token);
}

/**
 * Возвращает текущего пользователя из БД (с учётом блокировки).
 * null — если сессии нет, токен невалиден или пользователь заблокирован.
 */
export async function getCurrentUser(): Promise<SessionUser | null> {
  const claims = await getSessionClaims();
  if (!claims) return null;

  const user = await prisma.user.findUnique({
    where: { id: claims.sub },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isBlocked: true,
    },
  });

  if (!user || user.isBlocked) return null;
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };
}
