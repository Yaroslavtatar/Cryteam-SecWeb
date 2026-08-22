import { NextResponse, type NextRequest } from "next/server";

// Глобальный middleware безопасности (аналог Helmet):
//  - выставляет защитные HTTP-заголовки на все ответы;
//  - для защищённых страниц перенаправляет на /login при отсутствии сессии
//    (полная проверка прав выполняется в серверных компонентах).

const PROTECTED_PREFIXES = ["/dashboard", "/constructor", "/panel"];
const ACCESS_COOKIE = "cts_at";

function buildCsp(isDev: boolean): string {
  // В dev-режиме Next и Framer Motion требуют inline/eval.
  const scriptSrc = isDev
    ? "'self' 'unsafe-inline' 'unsafe-eval'"
    : "'self' 'unsafe-inline'";
  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob:",
    "font-src 'self' data:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
  ].join("; ");
}

function applySecurityHeaders(res: NextResponse) {
  const isDev = process.env.NODE_ENV !== "production";
  res.headers.set("Content-Security-Policy", buildCsp(isDev));
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  );
  res.headers.set("X-DNS-Prefetch-Control", "off");
  res.headers.set("Cross-Origin-Opener-Policy", "same-origin");
  if (!isDev) {
    res.headers.set(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload",
    );
  }
  return res;
}

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );

  if (isProtected && !req.cookies.get(ACCESS_COOKIE)?.value) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return applySecurityHeaders(NextResponse.redirect(url));
  }

  return applySecurityHeaders(NextResponse.next());
}

export const config = {
  // Применяем ко всем маршрутам, кроме статики Next и служебных файлов.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt).*)"],
};
