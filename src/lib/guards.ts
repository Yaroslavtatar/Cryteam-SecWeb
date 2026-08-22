import { getCurrentUser, type SessionUser } from "./auth";
import { jsonError } from "./http";
import { ROLES } from "./roles";

// Guard-функции для route handlers. Возвращают либо пользователя,
// либо готовый ответ с ошибкой (для раннего return в обработчике).

type GuardResult =
  | { ok: true; user: SessionUser }
  | { ok: false; response: ReturnType<typeof jsonError> };

export async function requireUser(): Promise<GuardResult> {
  const user = await getCurrentUser();
  if (!user) {
    return {
      ok: false,
      response: jsonError("Требуется авторизация.", 401, { code: "UNAUTHENTICATED" }),
    };
  }
  return { ok: true, user };
}

export async function requireRole(role: string): Promise<GuardResult> {
  const result = await requireUser();
  if (!result.ok) return result;
  if (result.user.role !== role) {
    return {
      ok: false,
      response: jsonError("Недостаточно прав для выполнения действия.", 403, {
        code: "FORBIDDEN",
      }),
    };
  }
  return result;
}

export function requireAdmin() {
  return requireRole(ROLES.ADMIN);
}
