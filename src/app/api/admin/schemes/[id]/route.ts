import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, verifyCsrf, getClientIp } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { schemeSchema, formatZodError } from "@/lib/validation";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const module = await prisma.module.findUnique({
    where: { id: params.id },
    include: { nodes: true, steps: { orderBy: { order: "asc" } } },
  });
  if (!module || !module.isCustom) {
    return jsonError("Схема не найдена.", 404);
  }

  let mitigations: string[] = [];
  try {
    const parsed = JSON.parse(module.mitigations || "[]");
    if (Array.isArray(parsed)) mitigations = parsed;
  } catch {
    mitigations = [];
  }

  return jsonOk({
    scheme: {
      id: module.id,
      title: module.title,
      category: module.category,
      difficulty: module.difficulty,
      summary: module.summary,
      estimatedMin: module.estimatedMin,
      finalStatus: module.finalStatus,
      finalTitle: module.finalTitle,
      finalDescription: module.finalDescription,
      mitigations,
      nodes: module.nodes.map((n) => ({
        key: n.key,
        label: n.label,
        kind: n.kind,
        x: n.x,
        y: n.y,
      })),
      steps: module.steps.map((s) => ({
        title: s.title,
        description: s.description,
        from: s.fromNode,
        to: s.toNode,
        packetLabel: s.packetLabel,
        outcome: s.outcome,
      })),
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  if (!verifyCsrf(req)) {
    return jsonError("Недействительный CSRF-токен.", 403, { code: "CSRF_REJECTED" });
  }

  const existing = await prisma.module.findUnique({ where: { id: params.id } });
  if (!existing || !existing.isCustom) {
    return jsonError("Схема не найдена.", 404);
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return jsonError("Тело запроса должно быть корректным JSON.", 400);
  }

  const parsed = schemeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Проверьте данные схемы.", 422, {
      fields: formatZodError(parsed.error),
    });
  }
  const data = parsed.data;

  await prisma.$transaction([
    prisma.schemeNode.deleteMany({ where: { moduleId: existing.id } }),
    prisma.schemeStep.deleteMany({ where: { moduleId: existing.id } }),
    prisma.module.update({
      where: { id: existing.id },
      data: {
        title: data.title,
        summary: data.summary,
        category: data.category,
        difficulty: data.difficulty,
        estimatedMin: data.estimatedMin,
        finalStatus: data.finalStatus,
        finalTitle: data.finalTitle,
        finalDescription: data.finalDescription,
        mitigations: JSON.stringify(data.mitigations),
        nodes: {
          create: data.nodes.map((n) => ({
            key: n.key,
            label: n.label,
            kind: n.kind,
            x: n.x,
            y: n.y,
          })),
        },
        steps: {
          create: data.steps.map((s, i) => ({
            order: i + 1,
            title: s.title,
            description: s.description,
            fromNode: s.from,
            toNode: s.to,
            packetLabel: s.packetLabel,
            outcome: s.outcome,
          })),
        },
      },
    }),
  ]);

  await writeAudit({
    action: "SCHEME_UPDATED",
    severity: "info",
    message: `Администратор ${guard.user.email} обновил схему «${data.title}».`,
    userId: guard.user.id,
    ip: getClientIp(req),
  });

  return jsonOk({ id: existing.id });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;
  if (!verifyCsrf(req)) {
    return jsonError("Недействительный CSRF-токен.", 403, { code: "CSRF_REJECTED" });
  }

  const existing = await prisma.module.findUnique({ where: { id: params.id } });
  if (!existing || !existing.isCustom) {
    return jsonError("Схема не найдена.", 404);
  }

  await prisma.module.delete({ where: { id: existing.id } });

  await writeAudit({
    action: "SCHEME_DELETED",
    severity: "warning",
    message: `Администратор ${guard.user.email} удалил схему «${existing.title}».`,
    userId: guard.user.id,
    ip: getClientIp(req),
  });

  return jsonOk({ deleted: true });
}
