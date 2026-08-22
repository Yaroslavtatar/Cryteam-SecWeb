import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ArrowRight, GraduationCap, Blocks } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { CyberBackground } from "@/components/background";
import { FadeIn } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { getAllScenarios } from "@/lib/custom-schemes";

export const metadata: Metadata = { title: "Уроки — CRYTEAM SecWeb" };
export const dynamic = "force-dynamic";

export default async function LessonsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/lessons");

  const scenarios = await getAllScenarios();

  return (
    <>
      <CyberBackground />
      <AppHeader user={user} />
      <div className="container py-8 md:py-12">
        <FadeIn className="mb-8">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Уроки</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Соберите схему атаки самостоятельно: восстановите порядок шагов, а затем
            изучите пошаговую защиту.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {scenarios.map((s, i) => (
            <FadeIn key={s.key} delay={i * 0.04}>
              <Link
                href={`/lessons/${s.key}`}
                className="glass group flex h-full flex-col rounded-xl p-5 transition-all hover:border-primary/30 hover:shadow-glow"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="grid h-10 w-10 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                    <Blocks className="h-5 w-5" />
                  </div>
                  <Badge variant="neutral">{s.steps.length} шагов</Badge>
                </div>
                <h3 className="text-base font-semibold">{s.title}</h3>
                <p className="mt-1 flex-1 text-sm text-muted-foreground line-clamp-2">
                  {s.summary}
                </p>
                <div className="mt-4 flex items-center justify-between text-xs">
                  <Badge variant="data">{s.category}</Badge>
                  <span className="inline-flex items-center gap-1 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                    Начать <ArrowRight className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>
      </div>
    </>
  );
}
