"use client";

// Клиентский помощник для обращения к API с автоматической подстановкой
// CSRF-токена (double-submit) для изменяющих запросов.

function readCookie(name: string): string | null {
  const match = document.cookie.match(
    new RegExp(`(?:^|; )${name}=([^;]*)`),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

export interface ApiResult<T> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  fields?: Record<string, string>;
  code?: string;
}

export async function apiFetch<T = unknown>(
  url: string,
  options: RequestInit = {},
): Promise<ApiResult<T>> {
  const method = (options.method ?? "GET").toUpperCase();
  const headers = new Headers(options.headers);

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (method !== "GET" && method !== "HEAD") {
    const csrf = readCookie("cts_csrf");
    if (csrf) headers.set("X-CSRF-Token", csrf);
  }

  const res = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: "same-origin",
  });

  let payload: Record<string, unknown> = {};
  try {
    payload = await res.json();
  } catch {
    // Ответ без тела — оставляем пустой объект.
  }

  return {
    ok: res.ok && payload.ok !== false,
    status: res.status,
    data: payload.data as T | undefined,
    error: payload.error as string | undefined,
    fields: payload.fields as Record<string, string> | undefined,
    code: payload.code as string | undefined,
  };
}
