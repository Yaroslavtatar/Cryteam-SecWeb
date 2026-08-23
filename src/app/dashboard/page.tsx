import Link from "next/link";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock,
  Trophy,
  ShieldAlert,
  Settings2,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { ROLES, roleLabel } from "@/lib/roles";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { FadeIn } from "@/components/motion";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = (await getCurrentUser())!; // гарантировано лейаутом

  const [modules, progressList] = await Promise.all([
    prisma.module.findMany({
      where: { isPublished: true },
      orderBy: { order: "asc" },
    }),
    prisma.progress.findMany({ where: { userId: user.id } }),
  ]);

  const progressByModule = new Map(progressList.map((p) => [p.moduleId, p]));
  const completed = progressList.filter((p) => p.status === "completed").length;
  const inProgress = progressList.filter((p) => p.status === "in_progress").length;
  const percent = modules.length
    ? Math.round((completed / modules.length) * 100)
    : 0;

  const stats = [
    { icon: BookOpen, label: "Всего модулей", value: modules.length },
    { icon: CheckCircle2, label: "Пройдено", value: completed },
    { icon: Clock, label: "В процессе", value: inProgress },
    { icon: Trophy, label: "Прогресс", value: `${percent}%` },
  ];

  return (
    <div className="space-y-8">
      <FadeIn className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm text-muted-foreground">
            Добро пожаловать, {roleLabel(user.role)}
          </p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">
            {user.fullName}
          </h1>
        </div>
        <Link href="/constructor" className={buttonVariants()}>
          Открыть конструктор
          <ArrowRight className="h-4 w-4" />
        </Link>
      </FadeIn>

      {/* Статистика */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s, i) => (
          <FadeIn key={s.label} delay={i * 0.05}>
            <div className="glass rounded-xl p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{s.label}</span>
                <s.icon className="h-4 w-4 text-primary" />
              </div>
              <div className="mt-2 font-mono text-3xl font-bold">{s.value}</div>
            </div>
          </FadeIn>
        ))}
      </div>

      {/* Панель администратора (видна только администраторам) */}
      {user.role === ROLES.ADMIN && (
        <FadeIn>
          <Link
            href={`/panel/${env.adminHashRoute}`}
            className="glass flex items-center justify-between rounded-xl border-accent/30 p-5 transition-all hover:shadow-glow"
          >
            <div className="flex items-center gap-4">
              <div className="grid h-11 w-11 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
                <Settings2 className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Панель администратора</h3>
                  <Badge variant="data">Скрытый маршрут</Badge>
                </div>
                <p className="text-sm text-muted-foreground">
                  Управление пользователями, ролями и журналом аудита безопасности.
                </p>
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-accent" />
          </Link>
        </FadeIn>
      )}

      {/* Модули */}
      <div>
        <h2 className="mb-4 text-xl font-semibold">Курсы профилактики</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((m, i) => {
            const progress = progressByModule.get(m.id);
            const isDone = progress?.status === "completed";
            return (
              <FadeIn key={m.id} delay={i * 0.04}>
                <Link
                  href={`/constructor?scenario=${m.scenarioKey}`}
                  className="glass group flex h-full flex-col rounded-xl p-5 transition-all hover:border-primary/30 hover:shadow-glow"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <Badge variant="data">{m.category}</Badge>
                    {isDone ? (
                      <Badge variant="defense">
                        <CheckCircle2 className="h-3 w-3" />
                        Пройдено
                      </Badge>
                    ) : progress ? (
                      <Badge variant="warning">В процессе</Badge>
                    ) : (
                      <Badge variant="neutral">Не начато</Badge>
                    )}
                  </div>
                  <h3 className="text-base font-semibold">{m.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-3">
                    {m.summary}
                  </p>
                  <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {m.estimatedMin} мин · {m.difficulty}
                    </span>
                    <span className="inline-flex items-center gap-1 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                      Запустить <ArrowRight className="h-3 w-3" />
                    </span>
                  </div>
                </Link>
              </FadeIn>
            );
          })}
        </div>
      </div>

      {modules.length === 0 && (
        <div className="glass flex flex-col items-center gap-3 rounded-xl p-12 text-center">
          <ShieldAlert className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            Модули пока не добавлены. Запустите заполнение базы данных: npm run db:seed
          </p>
        </div>
      )}
    </div>
  );
}
