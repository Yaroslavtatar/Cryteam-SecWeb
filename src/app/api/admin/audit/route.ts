import { type NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const severity = req.nextUrl.searchParams.get("severity");
  const where = severity && ["info", "warning", "critical"].includes(severity)
    ? { severity }
    : {};

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      createdAt: true,
      action: true,
      severity: true,
      message: true,
      ip: true,
      targetEmail: true,
      user: { select: { email: true } },
    },
  });

  return jsonOk({ logs });
}
