import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { loginSchema, formatZodError } from "@/lib/validation";
import { issueSession } from "@/lib/auth";
import { jsonOk, jsonError, getClientIp, tooManyRequests } from "@/lib/http";
import { rateLimit, RATE_POLICIES } from "@/lib/rate-limit";
import { writeAudit, AUDIT } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const userAgent = req.headers.get("user-agent");

  const limit = rateLimit(`login:${ip}`, RATE_POLICIES.login.limit, RATE_POLICIES.login.windowMs);
  if (!limit.allowed) {
    await writeAudit({
      action: AUDIT.RATE_LIMITED,
      severity: "critical",
      message: "Превышен лимит попыток входа — возможен подбор пароля (brute-force).",
      ip,
      userAgent,
    });
    return tooManyRequests(limit.retryAfterSec);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Тело запроса должно быть корректным JSON.", 400);
  }

  const parsed = loginSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Проверьте правильность заполнения полей.", 422, {
      fields: formatZodError(parsed.error),
    });
  }

  const { email, password } = parsed.data;
  const user = await prisma.user.findUnique({ where: { email } });

  // Единое сообщение об ошибке, чтобы не раскрывать существование аккаунта.
  const invalid = () =>
    jsonError("Неверный адрес электронной почты или пароль.", 401, {
      code: "INVALID_CREDENTIALS",
    });

  if (!user) {
    await writeAudit({
      action: AUDIT.LOGIN_FAILED,
      severity: "warning",
      message: "Неудачный вход: аккаунт не найден.",
      targetEmail: email,
      ip,
      userAgent,
    });
    return invalid();
  }

  if (user.isBlocked) {
    await writeAudit({
      action: AUDIT.LOGIN_BLOCKED,
      severity: "warning",
      message: `Попытка входа в заблокированный аккаунт ${email}.`,
      userId: user.id,
      targetEmail: email,
      ip,
      userAgent,
    });
    return jsonError("Учётная запись заблокирована. Обратитесь к администратору.", 403, {
      code: "ACCOUNT_BLOCKED",
    });
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) {
    await writeAudit({
      action: AUDIT.LOGIN_FAILED,
      severity: "warning",
      message: "Неудачный вход: неверный пароль.",
      userId: user.id,
      targetEmail: email,
      ip,
      userAgent,
    });
    return invalid();
  }

  const safeUser = {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  };

  await writeAudit({
    action: AUDIT.LOGIN_SUCCESS,
    severity: "info",
    message: `Успешный вход: ${user.email}.`,
    userId: user.id,
    ip,
    userAgent,
  });

  const res = jsonOk({ user: safeUser });
  await issueSession(res, safeUser);
  return res;
}
