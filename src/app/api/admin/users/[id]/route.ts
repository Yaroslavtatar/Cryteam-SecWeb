import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, verifyCsrf, getClientIp } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { updateRoleSchema, toggleBlockSchema, formatZodError } from "@/lib/validation";
import { writeAudit, AUDIT } from "@/lib/audit";
import { roleLabel } from "@/lib/roles";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  if (!verifyCsrf(req)) {
    await writeAudit({
      action: AUDIT.CSRF_REJECTED,
      severity: "warning",
      message: "Отклонён запрос администратора без валидного CSRF-токена.",
      userId: guard.user.id,
      ip: getClientIp(req),
    });
    return jsonError("Недействительный CSRF-токен.", 403, { code: "CSRF_REJECTED" });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) {
    return jsonError("Пользователь не найден.", 404);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Тело запроса должно быть корректным JSON.", 400);
  }

  const ip = getClientIp(req);

  // Изменение роли.
  if (body && typeof body === "object" && "role" in body) {
    const parsed = updateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Проверьте данные запроса.", 422, {
        fields: formatZodError(parsed.error),
      });
    }
    if (target.id === guard.user.id && parsed.data.role !== "ADMIN") {
      return jsonError("Нельзя понизить собственную роль администратора.", 400);
    }
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { role: parsed.data.role },
      select: { id: true, email: true, role: true },
    });
    await writeAudit({
      action: AUDIT.ROLE_CHANGED,
      severity: "warning",
      message: `Администратор ${guard.user.email} изменил роль пользователя ${target.email} на «${roleLabel(parsed.data.role)}».`,
      userId: guard.user.id,
      targetEmail: target.email,
      ip,
    });
    return jsonOk({ user: updated });
  }

  // Блокировка / разблокировка.
  if (body && typeof body === "object" && "isBlocked" in body) {
    const parsed = toggleBlockSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Проверьте данные запроса.", 422, {
        fields: formatZodError(parsed.error),
      });
    }
    if (target.id === guard.user.id && parsed.data.isBlocked) {
      return jsonError("Нельзя заблокировать собственную учётную запись.", 400);
    }
    const updated = await prisma.user.update({
      where: { id: target.id },
      data: { isBlocked: parsed.data.isBlocked },
      select: { id: true, email: true, isBlocked: true },
    });
    await writeAudit({
      action: parsed.data.isBlocked ? AUDIT.USER_BLOCKED : AUDIT.USER_UNBLOCKED,
      severity: "warning",
      message: `Администратор ${guard.user.email} ${parsed.data.isBlocked ? "заблокировал" : "разблокировал"} пользователя ${target.email}.`,
      userId: guard.user.id,
      targetEmail: target.email,
      ip,
    });
    return jsonOk({ user: updated });
  }

  return jsonError("Не передано ни одного поддерживаемого поля (role или isBlocked).", 400);
}
