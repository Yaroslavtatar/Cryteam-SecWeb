import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonOk, jsonError, verifyCsrf, getClientIp } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";
import { schemeSchema, formatZodError } from "@/lib/validation";
import { slugify } from "@/lib/custom-schemes";
import { writeAudit } from "@/lib/audit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const modules = await prisma.module.findMany({
    where: { isCustom: true },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      title: true,
      category: true,
      difficulty: true,
      scenarioKey: true,
      isPublished: true,
      updatedAt: true,
      _count: { select: { nodes: true, steps: true } },
    },
  });

  return jsonOk({ schemes: modules });
}

export async function POST(req: NextRequest) {
  const guard = await requireAdmin();
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

  const parsed = schemeSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("Проверьте данные схемы.", 422, {
      fields: formatZodError(parsed.error),
    });
  }
  const data = parsed.data;

  const rand = Math.random().toString(36).slice(2, 8);
  const scenarioKey = `custom-${rand}`;
  const slug = `${slugify(data.title)}-${rand}`;

  const nextOrder =
    ((await prisma.module.aggregate({ _max: { order: true } }))._max.order ?? 0) + 1;

  const created = await prisma.module.create({
    data: {
      slug,
      scenarioKey,
      title: data.title,
      summary: data.summary,
      category: data.category,
      difficulty: data.difficulty,
      estimatedMin: data.estimatedMin,
      order: nextOrder,
      isCustom: true,
      isPublished: true,
      authorId: guard.user.id,
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
    select: { id: true, scenarioKey: true, title: true },
  });

  await writeAudit({
    action: "SCHEME_CREATED",
    severity: "info",
    message: `Администратор ${guard.user.email} создал схему «${created.title}».`,
    userId: guard.user.id,
    ip: getClientIp(req),
  });

  return jsonOk({ scheme: created });
}
