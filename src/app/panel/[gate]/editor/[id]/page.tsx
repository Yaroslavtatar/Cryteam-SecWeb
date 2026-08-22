import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/roles";
import { AppHeader } from "@/components/app-header";
import { CyberBackground } from "@/components/background";
import { SchemeEditor, type EditorScheme } from "@/components/scheme-editor";
import type { NodeKind, StepOutcome } from "@/lib/scenarios";

export const metadata: Metadata = {
  title: "Редактор схемы — CRYTEAM SecWeb",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function EditorPage({
  params,
}: {
  params: { gate: string; id: string };
}) {
  if (params.gate !== env.adminHashRoute) notFound();
  const user = await getCurrentUser();
  if (!user || user.role !== ROLES.ADMIN) notFound();

  let initial: EditorScheme | null = null;

  if (params.id !== "new") {
    const module = await prisma.module.findUnique({
      where: { id: params.id },
      include: { nodes: true, steps: { orderBy: { order: "asc" } } },
    });
    if (!module || !module.isCustom) notFound();

    let mitigations: string[] = [];
    try {
      const parsed = JSON.parse(module.mitigations || "[]");
      if (Array.isArray(parsed)) mitigations = parsed;
    } catch {
      mitigations = [];
    }

    initial = {
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
        kind: n.kind as NodeKind,
        x: n.x,
        y: n.y,
      })),
      steps: module.steps.map((s) => ({
        title: s.title,
        description: s.description,
        from: s.fromNode,
        to: s.toNode,
        packetLabel: s.packetLabel,
        outcome: s.outcome as StepOutcome,
        method: s.method,
        requestBody: s.requestBody,
        responseBody: s.responseBody,
      })),
    };
  }

  return (
    <>
      <CyberBackground />
      <AppHeader user={user} />
      <div className="container py-6 md:py-10">
        <SchemeEditor gate={params.gate} initial={initial} />
      </div>
    </>
  );
}
