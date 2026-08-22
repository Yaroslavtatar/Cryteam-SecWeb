import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { registerSchema, formatZodError } from "@/lib/validation";
import { issueSession } from "@/lib/auth";
import { jsonOk, jsonError, getClientIp, tooManyRequests } from "@/lib/http";
import { rateLimit, RATE_POLICIES } from "@/lib/rate-limit";
import { writeAudit, AUDIT } from "@/lib/audit";
import { ROLES } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const limit = rateLimit(`register:${ip}`, RATE_POLICIES.register.limit, RATE_POLICIES.register.windowMs);
  if (!limit.allowed) {
    await writeAudit({
      action: AUDIT.RATE_LIMITED,
      severity: "warning",
      message: "Превышен лимит регистраций с одного адреса.",
      ip,
    });
    return tooManyRequests(limit.retryAfterSec);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Тело запроса должно быть корректным JSON.", 400);
  }

  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Проверьте правильность заполнения полей.", 422, {
      fields: formatZodError(parsed.error),
    });
  }

  const { fullName, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return jsonError("Пользователь с таким адресом уже зарегистрирован.", 409, {
      fields: { email: "Этот адрес электронной почты уже занят." },
    });
  }

  const user = await prisma.user.create({
    data: {
      fullName,
      email,
      passwordHash: await hashPassword(password),
      role: ROLES.STUDENT,
    },
    select: { id: true, email: true, fullName: true, role: true },
  });

  await writeAudit({
    action: AUDIT.REGISTER,
    severity: "info",
    message: `Зарегистрирован новый ученик: ${user.email}.`,
    userId: user.id,
    ip,
    userAgent: req.headers.get("user-agent"),
  });

  const res = jsonOk({ user });
  await issueSession(res, user);
  return res;
}
