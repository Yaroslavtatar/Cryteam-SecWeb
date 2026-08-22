import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, verifyCsrf } from "@/lib/http";
import { requireUser } from "@/lib/guards";
import { progressSchema, formatZodError } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const guard = await requireUser();
  if (!guard.ok) return guard.response;

  if (!verifyCsrf(req)) {
    return jsonError("Недействительный CSRF-токен.", 403, { code: "CSRF_REJECTED" });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Тело запроса должно быть корректным JSON.", 400);
  }

  const parsed = progressSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Проверьте данные запроса.", 422, {
      fields: formatZodError(parsed.error),
    });
  }

  const { moduleId, lastStep, status } = parsed.data;

  const module = await prisma.module.findUnique({ where: { id: moduleId } });
  if (!module) {
    return jsonError("Модуль не найден.", 404);
  }

  const progress = await prisma.progress.upsert({
    where: { userId_moduleId: { userId: guard.user.id, moduleId } },
    update: {
      lastStep,
      status,
      completedAt: status === "completed" ? new Date() : null,
    },
    create: {
      userId: guard.user.id,
      moduleId,
      lastStep,
      status,
      completedAt: status === "completed" ? new Date() : null,
    },
    select: { id: true, moduleId: true, status: true, lastStep: true },
  });

  return jsonOk({ progress });
}
