import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/roles";
import { AppHeader } from "@/components/app-header";
import { CyberBackground } from "@/components/background";
import { SchemeEditorList } from "@/components/scheme-editor-list";

export const metadata: Metadata = {
  title: "Редактор схем — CRYTEAM SecWeb",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function EditorListPage({
  params,
}: {
  params: { gate: string };
}) {
  if (params.gate !== env.adminHashRoute) notFound();
  const user = await getCurrentUser();
  if (!user || user.role !== ROLES.ADMIN) notFound();

  const schemes = await prisma.module.findMany({
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

  return (
    <>
      <CyberBackground />
      <AppHeader user={user} />
      <div className="container py-8 md:py-12">
        <SchemeEditorList
          gate={params.gate}
          initial={JSON.parse(JSON.stringify(schemes))}
        />
      </div>
    </>
  );
}
