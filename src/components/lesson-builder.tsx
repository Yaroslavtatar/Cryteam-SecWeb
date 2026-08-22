"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowUp,
  ArrowDown,
  CheckCircle2,
  XCircle,
  ShieldCheck,
  Trophy,
  PlayCircle,
  RotateCcw,
  Target,
} from "lucide-react";
import type { Scenario } from "@/lib/scenarios";
import { shuffledIndices, checkOrder } from "@/lib/lessons";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function LessonBuilder({ scenario }: { scenario: Scenario }) {
  const steps = scenario.steps;
  const n = steps.length;

  const [arrangement, setArrangement] = useState<number[]>(() =>
    shuffledIndices(n, n + scenario.title.length),
  );
  const [positions, setPositions] = useState<boolean[] | null>(null);
  const [solved, setSolved] = useState(false);

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= n) return;
    setArrangement((prev) => {
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
    setPositions(null);
  }

  function check() {
    const res = checkOrder(arrangement);
    setPositions(res.positions);
    setSolved(res.correct);
  }

  function reshuffle() {
    setArrangement(shuffledIndices(n, Math.floor(Math.random() * 1000) + 1));
    setPositions(null);
    setSolved(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <Link
          href="/lessons"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Все уроки
        </Link>
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Урок: {scenario.title}
        </h1>
        <div className="flex items-center gap-2">
          <Badge variant="data">{scenario.category}</Badge>
          <Badge variant="neutral">{scenario.difficulty}</Badge>
        </div>
      </div>

      <div className="glass rounded-xl p-4">
        <div className="flex items-center gap-2">
          <Target className="h-4 w-4 text-accent" />
          <h3 className="text-sm font-semibold">Задание</h3>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Расставьте шаги атаки в правильном хронологическом порядке. Используйте
          стрелки ↑/↓, затем нажмите «Проверить».
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Сборка порядка */}
        <div className="space-y-2">
          {arrangement.map((stepIdx, i) => {
            const step = steps[stepIdx];
            const state = positions ? positions[i] : null;
            return (
              <div
                key={stepIdx}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 transition-all",
                  state === true && "border-[hsl(var(--defense))]/50 bg-[hsl(var(--defense))]/10",
                  state === false && "border-destructive/50 bg-destructive/10",
                  state === null && "border-border bg-white/[0.02]",
                )}
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 font-mono text-sm text-primary">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="text-sm font-medium">{step.title}</div>
                  <div className="text-xs text-muted-foreground line-clamp-1">
                    {step.description}
                  </div>
                </div>
                {state === true && <CheckCircle2 className="h-4 w-4 text-[hsl(var(--defense))]" />}
                {state === false && <XCircle className="h-4 w-4 text-destructive" />}
                <div className="flex flex-col">
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30" aria-label="Вверх">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === n - 1} className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30" aria-label="Вниз">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}

          <div className="flex flex-wrap gap-2 pt-2">
            <Button onClick={check}>
              <CheckCircle2 className="h-4 w-4" />
              Проверить
            </Button>
            <Button variant="ghost" onClick={reshuffle}>
              <RotateCcw className="h-4 w-4" />
              Перемешать
            </Button>
          </div>
        </div>

        {/* Результат и защита */}
        <div className="space-y-4">
          {positions && !solved && (
            <div className="glass rounded-xl border-destructive/30 p-4">
              <div className="flex items-center gap-2 font-semibold text-destructive">
                <XCircle className="h-5 w-5" />
                Пока не верно
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Зелёным отмечены шаги на правильных местах. Поправьте порядок и
                проверьте снова.
              </p>
            </div>
          )}

          {solved && (
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="glass rounded-xl border-[hsl(var(--defense))]/40 p-4">
                <div className="flex items-center gap-2 font-semibold text-[hsl(var(--defense))]">
                  <Trophy className="h-5 w-5" />
                  Верно! Схема атаки собрана.
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{scenario.summary}</p>
              </div>

              <div className="glass rounded-xl p-4">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[hsl(var(--defense))]">
                  <ShieldCheck className="h-4 w-4" />
                  Пошаговая защита
                </div>
                <ol className="space-y-2">
                  {scenario.mitigations.map((m, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[hsl(var(--defense))]/15 text-[0.7rem] text-[hsl(var(--defense))]">
                        {i + 1}
                      </span>
                      <span>{m}</span>
                    </li>
                  ))}
                </ol>
              </div>

              <Link
                href={`/constructor?scenario=${scenario.key}`}
                className={buttonVariants({ variant: "secondary", size: "lg" })}
              >
                <PlayCircle className="h-4 w-4" />
                Посмотреть анимацию атаки
              </Link>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
