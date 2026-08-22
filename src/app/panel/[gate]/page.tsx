import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/roles";
import { writeAudit, AUDIT } from "@/lib/audit";
import { AppHeader } from "@/components/app-header";
import { CyberBackground } from "@/components/background";
import { AdminPanel } from "@/components/admin-panel";

export const metadata: Metadata = {
  title: "Панель администратора — CRYTEAM SecWeb",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AdminGatePage({
  params,
}: {
  params: { gate: string };
}) {
  // 1) Секретный маршрут: сегмент должен совпасть с ADMIN_HASH_ROUTE.
  //    Иначе — 404 (страница «не существует»).
  if (params.gate !== env.adminHashRoute) {
    notFound();
  }

  // 2) Дополнительная проверка прав: только администратор.
  const user = await getCurrentUser();
  if (!user || user.role !== ROLES.ADMIN) {
    notFound();
  }

  await writeAudit({
    action: AUDIT.ADMIN_GATE_HIT,
    severity: "info",
    message: `Администратор ${user.email} открыл панель управления.`,
    userId: user.id,
  });

  const [users, logs] = await Promise.all([
    prisma.user.findMany({
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
    }),
    prisma.auditLog.findMany({
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
    }),
  ]);

  return (
    <>
      <CyberBackground />
      <AppHeader user={user} />
      <div className="container py-8 md:py-12">
        <AdminPanel
          gate={params.gate}
          currentUserId={user.id}
          initialUsers={JSON.parse(JSON.stringify(users))}
          initialLogs={JSON.parse(JSON.stringify(logs))}
        />
      </div>
    </>
  );
}
