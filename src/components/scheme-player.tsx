"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Skull,
  Server,
  Database,
  ShieldCheck,
  Laptop,
  UserRound,
  KeyRound,
  AppWindow,
  Boxes,
  Wifi,
  CheckCircle2,
  ShieldAlert,
  CircleDot,
  Fish,
  Globe,
  Smartphone,
  Bot,
  ListChecks,
} from "lucide-react";
import type {
  NodeKind,
  Scenario,
  SchemeNode,
  StepOutcome,
} from "@/lib/scenarios";
import { CATEGORY_ORDER } from "@/lib/scenarios";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/client";
import { cn } from "@/lib/utils";

const STEP_MS = 2600;

type Tone = "attack" | "defense" | "data" | "neutral";

const KIND_META: Record<NodeKind, { icon: typeof Server; tone: Tone }> = {
  attacker: { icon: Skull, tone: "attack" },
  mitm: { icon: Wifi, tone: "attack" },
  client: { icon: Laptop, tone: "neutral" },
  victim: { icon: UserRound, tone: "neutral" },
  waf: { icon: ShieldCheck, tone: "defense" },
  edge: { icon: ShieldCheck, tone: "defense" },
  server: { icon: Server, tone: "data" },
  db: { icon: Database, tone: "data" },
  store: { icon: Database, tone: "data" },
  app: { icon: AppWindow, tone: "data" },
  api: { icon: Boxes, tone: "data" },
  idp: { icon: KeyRound, tone: "data" },
  phishing: { icon: Fish, tone: "attack" },
  bot: { icon: Bot, tone: "attack" },
  operator: { icon: Smartphone, tone: "neutral" },
  service: { icon: Globe, tone: "data" },
};

const TONE_CLASSES: Record<Tone, string> = {
  attack: "border-destructive/50 bg-destructive/10 text-destructive",
  defense:
    "border-[hsl(var(--defense))]/50 bg-[hsl(var(--defense))]/10 text-[hsl(var(--defense))]",
  data: "border-accent/50 bg-accent/10 text-accent",
  neutral: "border-border bg-white/5 text-foreground",
};

const OUTCOME_META: Record<
  StepOutcome,
  { label: string; badge: "data" | "defense" | "attack"; packet: string; ring: string }
> = {
  info: {
    label: "Передача данных",
    badge: "data",
    packet: "bg-accent text-accent-foreground shadow-[0_0_20px_hsl(var(--accent)/0.6)]",
    ring: "ring-2 ring-accent shadow-glow",
  },
  blocked: {
    label: "Заблокировано",
    badge: "defense",
    packet:
      "bg-[hsl(var(--defense))] text-black shadow-[0_0_20px_hsl(var(--defense)/0.7)]",
    ring: "ring-2 ring-[hsl(var(--defense))] shadow-glow-defense",
  },
  success: {
    label: "Успешно",
    badge: "defense",
    packet:
      "bg-[hsl(var(--defense))] text-black shadow-[0_0_20px_hsl(var(--defense)/0.7)]",
    ring: "ring-2 ring-[hsl(var(--defense))] shadow-glow-defense",
  },
  exploited: {
    label: "Эксплуатация",
    badge: "attack",
    packet:
      "bg-destructive text-white shadow-[0_0_20px_hsl(var(--destructive)/0.7)]",
    ring: "ring-2 ring-destructive shadow-glow-attack",
  },
};

export function SchemePlayer({
  scenarios,
  initialKey,
  moduleMap,
  canTrackProgress,
}: {
  scenarios: Scenario[];
  initialKey: string;
  moduleMap: Record<string, string>;
  canTrackProgress: boolean;
}) {
  const [key, setKey] = useState(initialKey);
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(false);
  const completedKeys = useRef<Set<string>>(new Set());

  const scenario = useMemo(
    () => scenarios.find((s) => s.key === key) ?? scenarios[0],
    [scenarios, key],
  );

  // Категории для меню: сначала известный порядок, затем прочие.
  const categories = useMemo(() => {
    const present = Array.from(new Set(scenarios.map((s) => s.category)));
    const ordered = CATEGORY_ORDER.filter((c) => present.includes(c));
    const rest = present.filter((c) => !ordered.includes(c));
    return [...ordered, ...rest];
  }, [scenarios]);
  const steps = scenario.steps;
  const total = steps.length;
  const nodeById = useMemo(() => {
    const map = new Map<string, SchemeNode>();
    for (const n of scenario.nodes) map.set(n.id, n);
    return map;
  }, [scenario]);

  const edges = useMemo(() => {
    const seen = new Set<string>();
    const list: { from: string; to: string }[] = [];
    for (const s of steps) {
      const id = `${s.from}->${s.to}`;
      const rev = `${s.to}->${s.from}`;
      if (!seen.has(id) && !seen.has(rev)) {
        seen.add(id);
        list.push({ from: s.from, to: s.to });
      }
    }
    return list;
  }, [steps]);

  const activeStep = step > 0 ? steps[step - 1] : null;
  const isFinished = step >= total;

  // Автовоспроизведение.
  useEffect(() => {
    if (!playing) return;
    if (step >= total) {
      setPlaying(false);
      return;
    }
    const timer = setTimeout(() => setStep((s) => Math.min(s + 1, total)), STEP_MS);
    return () => clearTimeout(timer);
  }, [playing, step, total]);

  // Смена сценария сбрасывает состояние.
  const selectScenario = useCallback((newKey: string) => {
    setKey(newKey);
    setStep(0);
    setPlaying(false);
  }, []);

  // Отметка прохождения по достижении финала.
  useEffect(() => {
    if (
      isFinished &&
      canTrackProgress &&
      moduleMap[key] &&
      !completedKeys.current.has(key)
    ) {
      completedKeys.current.add(key);
      void apiFetch("/api/progress", {
        method: "POST",
        body: JSON.stringify({
          moduleId: moduleMap[key],
          lastStep: total,
          status: "completed",
        }),
      });
    }
  }, [isFinished, canTrackProgress, moduleMap, key, total]);

  const play = () => {
    if (step >= total) setStep(0);
    setPlaying(true);
  };
  const pause = () => setPlaying(false);
  const next = () => {
    setPlaying(false);
    setStep((s) => Math.min(s + 1, total));
  };
  const prev = () => {
    setPlaying(false);
    setStep((s) => Math.max(s - 1, 0));
  };
  const reset = () => {
    setPlaying(false);
    setStep(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight md:text-3xl">
          Конструктор схем: {scenario.title}
        </h1>
        <p className="text-sm text-muted-foreground">
          Пошаговая визуализация. Управляйте воспроизведением и следите за
          движением данных между узлами.
        </p>
      </div>

      {/* Меню выбора модели атаки (сгруппировано по категориям) */}
      <div className="glass-strong rounded-xl p-4">
        <div className="mb-3 flex items-center gap-2">
          <ListChecks className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">Меню: выберите модель атаки</h2>
        </div>
        <div className="space-y-3">
          {categories.map((cat) => (
            <div key={cat}>
              <div className="mb-1.5 text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
                {cat}
              </div>
              <div className="flex flex-wrap gap-2">
                {scenarios
                  .filter((s) => s.category === cat)
                  .map((s) => (
                    <button
                      key={s.key}
                      onClick={() => selectScenario(s.key)}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
                        s.key === key
                          ? "border-primary/50 bg-primary/15 text-primary shadow-glow"
                          : "border-border bg-white/[0.03] text-muted-foreground hover:bg-white/[0.06] hover:text-foreground",
                      )}
                    >
                      {s.title}
                    </button>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
        {/* Полотно схемы */}
        <div className="glass-strong overflow-hidden rounded-xl">
          <div className="flex items-center justify-between border-b border-white/5 px-4 py-3">
            <div className="flex items-center gap-2">
              <Badge variant="data">{scenario.category}</Badge>
              <Badge variant="neutral">{scenario.difficulty}</Badge>
            </div>
            <span className="font-mono text-xs text-muted-foreground">
              Шаг {step} / {total}
            </span>
          </div>

          <SchemeCanvas
            nodes={scenario.nodes}
            nodeById={nodeById}
            edges={edges}
            activeStep={activeStep}
            step={step}
            scenarioKey={key}
          />

          {/* Управление */}
          <div className="flex flex-wrap items-center justify-center gap-2 border-t border-white/5 p-4">
            <Button variant="outline" size="sm" onClick={prev} disabled={step === 0}>
              <SkipBack className="h-4 w-4" />
              Назад
            </Button>
            {playing ? (
              <Button size="sm" onClick={pause}>
                <Pause className="h-4 w-4" />
                Пауза
              </Button>
            ) : (
              <Button size="sm" onClick={play}>
                <Play className="h-4 w-4" />
                {isFinished ? "Заново" : "Запуск"}
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={next}
              disabled={step >= total}
            >
              Вперёд
              <SkipForward className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={reset}>
              <RotateCcw className="h-4 w-4" />
              Сброс
            </Button>
          </div>

          {/* Индикатор шагов */}
          <div className="flex items-center gap-1.5 px-4 pb-4">
            {steps.map((s, i) => (
              <button
                key={s.order}
                onClick={() => {
                  setPlaying(false);
                  setStep(i + 1);
                }}
                className={cn(
                  "h-1.5 flex-1 rounded-full transition-all",
                  step >= i + 1
                    ? OUTCOME_BAR[s.outcome]
                    : "bg-white/10",
                )}
                aria-label={`Перейти к шагу ${i + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Боковая панель описания */}
        <StepPanel scenario={scenario} step={step} activeStep={activeStep} />
      </div>
    </div>
  );
}

const OUTCOME_BAR: Record<StepOutcome, string> = {
  info: "bg-accent",
  blocked: "bg-[hsl(var(--defense))]",
  success: "bg-[hsl(var(--defense))]",
  exploited: "bg-destructive",
};

function SchemeCanvas({
  nodes,
  nodeById,
  edges,
  activeStep,
  step,
  scenarioKey,
}: {
  nodes: SchemeNode[];
  nodeById: Map<string, SchemeNode>;
  edges: { from: string; to: string }[];
  activeStep:
    | { from: string; to: string; outcome: StepOutcome; packetLabel: string }
    | null;
  step: number;
  scenarioKey: string;
}) {
  const from = activeStep ? nodeById.get(activeStep.from) : null;
  const to = activeStep ? nodeById.get(activeStep.to) : null;

  return (
    <div className="relative h-[360px] w-full cyber-grid sm:h-[420px]">
      {/* Связи */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {edges.map((e) => {
          const a = nodeById.get(e.from);
          const b = nodeById.get(e.to);
          if (!a || !b) return null;
          const isActive =
            activeStep &&
            ((activeStep.from === e.from && activeStep.to === e.to) ||
              (activeStep.from === e.to && activeStep.to === e.from));
          return (
            <line
              key={`${e.from}-${e.to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke={
                isActive ? "hsl(var(--primary))" : "hsl(var(--border))"
              }
              strokeWidth={isActive ? 1 : 0.6}
              strokeDasharray={isActive ? "0" : "2 2"}
              vectorEffect="non-scaling-stroke"
              className="transition-all"
            />
          );
        })}
      </svg>

      {/* Узлы */}
      {nodes.map((node) => {
        const meta = KIND_META[node.kind];
        const Icon = meta.icon;
        const isTarget = activeStep?.to === node.id;
        const isSource = activeStep?.from === node.id;
        const outcomeMeta = activeStep ? OUTCOME_META[activeStep.outcome] : null;
        return (
          <div
            key={node.id}
            className="absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center gap-2"
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
          >
            <div
              className={cn(
                "grid h-14 w-14 place-items-center rounded-xl border-2 backdrop-blur-sm transition-all duration-300 sm:h-16 sm:w-16",
                TONE_CLASSES[meta.tone],
                isTarget && outcomeMeta ? outcomeMeta.ring : "",
                isSource ? "scale-105" : "",
              )}
            >
              <Icon className="h-6 w-6 sm:h-7 sm:w-7" />
            </div>
            <span className="max-w-[6.5rem] text-center text-[0.7rem] font-medium leading-tight text-foreground/90">
              {node.label}
            </span>
          </div>
        );
      })}

      {/* Анимированный пакет */}
      <AnimatePresence mode="wait">
        {activeStep && from && to && (
          <motion.div
            key={`${scenarioKey}-${step}`}
            initial={{ left: `${from.x}%`, top: `${from.y}%`, opacity: 0, scale: 0.6 }}
            animate={{
              left: `${to.x}%`,
              top: `${to.y}%`,
              opacity: [0, 1, 1, 1],
              scale: [0.6, 1, 1, 0.9],
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: [0.4, 0, 0.2, 1] }}
            className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-1/2"
          >
            <span
              className={cn(
                "whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[0.7rem] font-semibold",
                OUTCOME_META[activeStep.outcome].packet,
              )}
            >
              {activeStep.packetLabel}
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StepPanel({
  scenario,
  step,
  activeStep,
}: {
  scenario: Scenario;
  step: number;
  activeStep: Scenario["steps"][number] | null;
}) {
  const isFinished = step >= scenario.steps.length;
  const finalDefended = scenario.final.status === "defended";

  return (
    <div className="glass-strong flex flex-col rounded-xl p-5">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div
            key="intro"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3"
          >
            <div className="flex items-center gap-2">
              <CircleDot className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">Готово к запуску</h3>
            </div>
            <p className="text-sm text-muted-foreground">{scenario.summary}</p>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3 text-sm text-muted-foreground">
              Нажмите «Запуск», чтобы увидеть пошаговую анимацию, либо
              используйте «Шаг вперёд» для ручного разбора.
            </div>
            <Mitigations items={scenario.mitigations} />
          </motion.div>
        )}

        {step > 0 && !isFinished && activeStep && (
          <motion.div
            key={`step-${step}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-muted-foreground">
                Шаг {step} из {scenario.steps.length}
              </span>
              <Badge variant={OUTCOME_META[activeStep.outcome].badge}>
                {OUTCOME_META[activeStep.outcome].label}
              </Badge>
            </div>
            <h3 className="text-lg font-semibold leading-snug">
              {activeStep.title}
            </h3>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {activeStep.description}
            </p>
            <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                Передаётся
              </div>
              <div className="mt-1 font-mono text-sm text-foreground">
                {activeStep.packetLabel}
              </div>
            </div>
          </motion.div>
        )}

        {isFinished && (
          <motion.div
            key="final"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            <div
              className={cn(
                "grid h-14 w-14 place-items-center rounded-xl border-2",
                finalDefended
                  ? "border-[hsl(var(--defense))]/50 bg-[hsl(var(--defense))]/10 text-[hsl(var(--defense))]"
                  : "border-destructive/50 bg-destructive/10 text-destructive",
              )}
            >
              {finalDefended ? (
                <CheckCircle2 className="h-7 w-7" />
              ) : (
                <ShieldAlert className="h-7 w-7" />
              )}
            </div>
            <div>
              <Badge variant={finalDefended ? "defense" : "attack"}>
                Итог
              </Badge>
              <h3 className="mt-2 text-lg font-semibold">
                {scenario.final.title}
              </h3>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {scenario.final.description}
            </p>
            <Mitigations items={scenario.mitigations} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Mitigations({ items }: { items: string[] }) {
  if (!items?.length) return null;
  return (
    <div className="rounded-lg border border-[hsl(var(--defense))]/25 bg-[hsl(var(--defense))]/[0.06] p-3">
      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[hsl(var(--defense))]">
        <ShieldCheck className="h-4 w-4" />
        Как защититься
      </div>
      <ul className="space-y-1.5">
        {items.map((tip, i) => (
          <li key={i} className="flex gap-2 text-sm text-muted-foreground">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--defense))]" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
