import Link from "next/link";
import {
  ArrowRight,
  ShieldCheck,
  Workflow,
  GraduationCap,
  Lock,
  Activity,
  KeySquare,
  ServerCog,
} from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { CyberBackground } from "@/components/background";
import { FadeIn } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { scenarios } from "@/lib/scenarios";

export default async function HomePage() {
  const user = await getCurrentUser();

  const features = [
    {
      icon: Workflow,
      title: "Интерактивный конструктор",
      text: "Пошаговая визуализация атак и защиты с анимацией движения пакетов между узлами схемы.",
    },
    {
      icon: GraduationCap,
      title: "Обучающие модули",
      text: "Курсы по веб-атакам, сетевой безопасности и авторизации с отслеживанием личного прогресса.",
    },
    {
      icon: Lock,
      title: "Защищённый API-шлюз",
      text: "JWT в HttpOnly-cookie, rate limiting, защита от CSRF/XSS и строгая валидация через Zod.",
    },
    {
      icon: Activity,
      title: "Журнал аудита",
      text: "Фиксация входов, ошибок авторизации и действий администраторов для контроля безопасности.",
    },
  ];

  const scenarioIcons: Record<string, typeof ShieldCheck> = {
    "sql-injection": ServerCog,
    xss: Workflow,
    mitm: Activity,
    oauth: KeySquare,
    ddos: ServerCog,
  };

  return (
    <>
      <CyberBackground />
      <AppHeader user={user} />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="container flex min-h-[calc(100dvh-4rem)] flex-col items-center justify-center py-20 text-center">
            <FadeIn>
              <Badge variant="default" className="mb-6">
                <ShieldCheck className="h-3 w-3" />
                Платформа обучения кибербезопасности
              </Badge>
            </FadeIn>

            <FadeIn delay={0.05}>
              <h1 className="max-w-4xl text-balance text-4xl font-bold leading-none tracking-tighter md:text-7xl">
                <span className="font-mono tracking-widest">CRYTEAM</span>{" "}
                <span className="text-gradient glow-text">SecWeb</span>
              </h1>
            </FadeIn>

            <FadeIn delay={0.1}>
              <p className="mt-6 max-w-2xl text-balance text-base text-muted-foreground md:text-lg">
                Изучайте атаки и защиту наглядно. Запускайте пошаговые
                интерактивные схемы, наблюдайте за движением данных и понимайте,
                как срабатывает каждый рубеж обороны.
              </p>
            </FadeIn>

            <FadeIn delay={0.15}>
              <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row">
                <Link
                  href={user ? "/constructor" : "/register"}
                  className={buttonVariants({ size: "lg" })}
                >
                  {user ? "Открыть конструктор" : "Начать обучение"}
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href={user ? "/dashboard" : "/login"}
                  className={buttonVariants({ variant: "secondary", size: "lg" })}
                >
                  {user ? "Личный кабинет" : "У меня есть аккаунт"}
                </Link>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div className="mt-14 grid grid-cols-3 gap-6 text-center sm:gap-12">
                {[
                  { value: scenarios.length, label: "Сценариев" },
                  { value: "5+", label: "Типов атак" },
                  { value: "2", label: "Роли доступа" },
                ].map((stat) => (
                  <div key={stat.label}>
                    <div className="font-mono text-3xl font-bold text-primary md:text-4xl">
                      {stat.value}
                    </div>
                    <div className="mt-1 text-xs uppercase tracking-widest text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </section>

        {/* Возможности */}
        <section className="container py-20">
          <FadeIn className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Всё для практической безопасности
            </h2>
            <p className="mt-3 text-muted-foreground">
              Современный стек и продуманная архитектура защиты в одном месте.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.05}>
                <div className="glass group h-full rounded-xl p-6 transition-all hover:border-primary/30 hover:shadow-glow">
                  <div className="mb-4 grid h-11 w-11 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-primary transition-transform group-hover:scale-110">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-base font-semibold">{f.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </section>

        {/* Сценарии */}
        <section className="container py-20">
          <FadeIn className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Готовые интерактивные сценарии
            </h2>
            <p className="mt-3 text-muted-foreground">
              Каждый сценарий — пошаговая анимированная схема с понятными
              пояснениями на русском языке.
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {scenarios.map((s, i) => {
              const Icon = scenarioIcons[s.key] ?? ShieldCheck;
              return (
                <FadeIn key={s.key} delay={i * 0.05}>
                  <Link
                    href={user ? `/constructor?scenario=${s.key}` : "/login"}
                    className="glass group flex h-full flex-col rounded-xl p-6 transition-all hover:border-primary/30 hover:shadow-glow"
                  >
                    <div className="mb-4 flex items-center justify-between">
                      <div className="grid h-11 w-11 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="neutral">{s.difficulty}</Badge>
                    </div>
                    <h3 className="text-lg font-semibold">{s.title}</h3>
                    <p className="mt-2 flex-1 text-sm text-muted-foreground">
                      {s.summary}
                    </p>
                    <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
                      <Badge variant="data">{s.category}</Badge>
                      <span className="inline-flex items-center gap-1 text-primary opacity-0 transition-opacity group-hover:opacity-100">
                        Открыть <ArrowRight className="h-3 w-3" />
                      </span>
                    </div>
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 py-10">
        <div className="container flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
          <span className="font-mono tracking-widest text-foreground">
            CRYTEAM <span className="text-primary">SecWeb</span>
          </span>
          <span>Образовательная платформа по кибербезопасности · {new Date().getFullYear()}</span>
        </div>
      </footer>
    </>
  );
}
