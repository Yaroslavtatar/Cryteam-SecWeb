import { redirect, notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCurrentUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { CyberBackground } from "@/components/background";
import { LessonBuilder } from "@/components/lesson-builder";
import { getAllScenarios } from "@/lib/custom-schemes";

export const metadata: Metadata = { title: "Урок — CRYTEAM SecWeb" };
export const dynamic = "force-dynamic";

export default async function LessonPage({
  params,
}: {
  params: { key: string };
}) {
  const user = await getCurrentUser();
  if (!user) redirect(`/login?next=/lessons/${params.key}`);

  const scenarios = await getAllScenarios();
  const scenario = scenarios.find((s) => s.key === params.key);
  if (!scenario) notFound();

  return (
    <>
      <CyberBackground />
      <AppHeader user={user} />
      <div className="container py-6 md:py-10">
        <LessonBuilder scenario={scenario} />
      </div>
    </>
  );
}
