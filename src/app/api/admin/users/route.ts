import { prisma } from "@/lib/db";
import { jsonOk } from "@/lib/http";
import { requireAdmin } from "@/lib/guards";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const guard = await requireAdmin();
  if (!guard.ok) return guard.response;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isBlocked: true,
      createdAt: true,
      _count: { select: { progress: true } },
    },
  });

  return jsonOk({ users });
}
