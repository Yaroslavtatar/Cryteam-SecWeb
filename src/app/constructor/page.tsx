import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ROLES } from "@/lib/roles";
import { AppHeader } from "@/components/app-header";
import { CyberBackground } from "@/components/background";
import { SchemePlayer } from "@/components/scheme-player";
import { scenarios } from "@/lib/scenarios";
import { getCustomScenarios } from "@/lib/custom-schemes";

export const metadata: Metadata = { title: "Конструктор схем — CRYTEAM SecWeb" };
export const dynamic = "force-dynamic";

export default async function ConstructorPage({
  searchParams,
}: {
  searchParams: { scenario?: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/constructor");

  const [modules, customScenarios] = await Promise.all([
    prisma.module.findMany({ select: { id: true, scenarioKey: true } }),
    getCustomScenarios(),
  ]);
  const moduleMap: Record<string, string> = {};
  for (const m of modules) moduleMap[m.scenarioKey] = m.id;

  // Встроенные сценарии + пользовательские (созданные администратором).
  const allScenarios = [...scenarios, ...customScenarios];

  const initialKey =
    searchParams.scenario &&
    allScenarios.some((s) => s.key === searchParams.scenario)
      ? searchParams.scenario
      : allScenarios[0].key;

  return (
    <>
      <CyberBackground />
      <AppHeader user={user} />
      <div className="container py-6 md:py-10">
        <SchemePlayer
          scenarios={allScenarios}
          initialKey={initialKey}
          moduleMap={moduleMap}
          canTrackProgress={user.role === ROLES.STUDENT}
        />
      </div>
    </>
  );
}
