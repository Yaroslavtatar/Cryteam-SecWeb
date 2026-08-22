"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Terminal,
  Send,
  Lightbulb,
  RotateCcw,
  ShieldCheck,
  ShieldOff,
  CheckCircle2,
  Ban,
  Target,
} from "lucide-react";
import { challenges, getChallenge, type Verdict } from "@/lib/sandbox";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface LogEntry {
  id: number;
  method: string;
  path: string;
  body: string;
  protectionOn: boolean;
  status: number;
  verdict: Verdict;
  response: string;
  explanation: string;
}

const VERDICT_STYLE: Record<Verdict, { badge: "attack" | "defense" | "neutral"; label: string }> = {
  success: { badge: "attack", label: "Уязвимость проэксплуатирована" },
  blocked: { badge: "defense", label: "Атака заблокирована" },
  info: { badge: "neutral", label: "Информация" },
};

export function SandboxConsole() {
  const [key, setKey] = useState(challenges[0].key);
  const challenge = useMemo(() => getChallenge(key)!, [key]);

  const [path, setPath] = useState(challenge.defaultPath);
  const [body, setBody] = useState(challenge.defaultBody);
  const [protectionOn, setProtectionOn] = useState(false);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [solved, setSolved] = useState(false);
  const counter = useRef(0);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [log]);

  function selectChallenge(k: string) {
    const c = getChallenge(k)!;
    setKey(k);
    setPath(c.defaultPath);
    setBody(c.defaultBody);
    setProtectionOn(false);
    setLog([]);
    setShowHint(false);
    setSolved(false);
  }

  function send() {
    const req = { method: challenge.method, path, body };
    const result = challenge.evaluate(req, protectionOn);
    counter.current += 1;
    setLog((prev) => [
      ...prev,
      { id: counter.current, method: challenge.method, path, body, protectionOn, ...result },
    ]);
    if (result.verdict === "success") setSolved(true);
  }

  function reset() {
    setPath(challenge.defaultPath);
    setBody(challenge.defaultBody);
    setLog([]);
    setSolved(false);
    setShowHint(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Terminal className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight md:text-3xl">Песочница</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Безопасная симуляция: атакуйте учебный сайт через GET/POST-запросы и
          посмотрите, как защита меняет исход. Реальных систем это не затрагивает.
        </p>
      </div>

      {/* Выбор задания */}
      <div className="flex flex-wrap gap-2">
        {challenges.map((c) => (
          <button
            key={c.key}
            onClick={() => selectChallenge(c.key)}
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-all",
              c.key === key
                ? "border-primary/50 bg-primary/15 text-primary shadow-glow"
                : "border-border bg-white/[0.03] text-muted-foreground hover:text-foreground",
            )}
          >
            {c.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px_1fr]">
        {/* Управление запросом */}
        <div className="space-y-4">
          <div className="glass-strong rounded-xl p-4">
            <div className="mb-2 flex items-center gap-2">
              <Target className="h-4 w-4 text-accent" />
              <h3 className="text-sm font-semibold">Задача</h3>
              <Badge variant="neutral">{challenge.difficulty}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">{challenge.brief}</p>
            <p className="mt-2 text-sm font-medium text-foreground">{challenge.goal}</p>
          </div>

          <div className="glass-strong space-y-3 rounded-xl p-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Запрос</h3>
              <Badge variant="data">{challenge.method}</Badge>
            </div>
            <div className="space-y-1.5">
              <Label>Путь</Label>
              <Input value={path} onChange={(e) => setPath(e.target.value)} className="font-mono text-xs" />
            </div>
            {challenge.method === "POST" && (
              <div className="space-y-1.5">
                <Label>Тело запроса</Label>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  className="flex w-full rounded-lg border border-input bg-background/40 px-3 py-2 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>
            )}

            {/* Переключатель защиты */}
            <button
              onClick={() => setProtectionOn((v) => !v)}
              className={cn(
                "flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all",
                protectionOn
                  ? "border-[hsl(var(--defense))]/40 bg-[hsl(var(--defense))]/10 text-[hsl(var(--defense))]"
                  : "border-destructive/40 bg-destructive/10 text-destructive",
              )}
            >
              <span className="inline-flex items-center gap-2">
                {protectionOn ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
                Защита сервера: {protectionOn ? "включена" : "выключена"}
              </span>
              <span className="text-xs opacity-70">нажмите, чтобы переключить</span>
            </button>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" onClick={send}>
                <Send className="h-4 w-4" />
                Отправить запрос
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowHint((v) => !v)}>
                <Lightbulb className="h-4 w-4" />
                Подсказка
              </Button>
              <Button variant="ghost" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
                Сброс
              </Button>
            </div>

            {showHint && (
              <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 font-mono text-xs text-amber-300">
                {challenge.hint}
              </div>
            )}
          </div>

          {solved && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl border border-destructive/40 bg-destructive/10 p-4"
            >
              <div className="flex items-center gap-2 font-semibold text-destructive">
                <CheckCircle2 className="h-5 w-5" />
                Уязвимость проэксплуатирована!
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Теперь включите «Защиту сервера» и повторите тот же запрос — атака
                перестанет срабатывать.
              </p>
              <div className="mt-3 rounded-lg border border-[hsl(var(--defense))]/25 bg-[hsl(var(--defense))]/[0.06] p-3">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[hsl(var(--defense))]">
                  <ShieldCheck className="h-4 w-4" />
                  Как защититься
                </div>
                <ul className="space-y-1.5">
                  {challenge.mitigations.map((m, i) => (
                    <li key={i} className="flex gap-2 text-sm text-muted-foreground">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[hsl(var(--defense))]" />
                      <span>{m}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          )}
        </div>

        {/* Консоль */}
        <div className="glass-strong flex flex-col overflow-hidden rounded-xl">
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5 text-xs text-muted-foreground">
            <Terminal className="h-3.5 w-3.5" />
            Консоль запросов — учебный сервер https://lab.cryteam.local
          </div>
          <div className="h-[520px] overflow-y-auto bg-[#04060c] p-4 font-mono text-xs">
            {log.length === 0 ? (
              <p className="text-muted-foreground">
                {"// Отправьте запрос, чтобы увидеть ответ учебного сервера."}
              </p>
            ) : (
              <div className="space-y-4">
                {log.map((e) => {
                  const vs = VERDICT_STYLE[e.verdict];
                  const color =
                    e.verdict === "success"
                      ? "text-destructive"
                      : e.verdict === "blocked"
                        ? "text-[hsl(var(--defense))]"
                        : "text-foreground/80";
                  return (
                    <div key={e.id} className="space-y-1">
                      <div className="text-primary">
                        <span className="text-muted-foreground">$</span> {e.method} {e.path}
                        {e.protectionOn ? "  [защита: ON]" : "  [защита: OFF]"}
                      </div>
                      {e.body && e.method === "POST" && (
                        <div className="whitespace-pre-wrap text-accent">{e.body}</div>
                      )}
                      <pre className={cn("whitespace-pre-wrap", color)}>{e.response}</pre>
                      <div className="flex items-center gap-2 pt-0.5">
                        {e.verdict === "success" ? (
                          <Ban className="h-3.5 w-3.5 text-destructive" />
                        ) : e.verdict === "blocked" ? (
                          <ShieldCheck className="h-3.5 w-3.5 text-[hsl(var(--defense))]" />
                        ) : null}
                        <Badge variant={vs.badge}>{vs.label}</Badge>
                      </div>
                      <p className="pt-0.5 text-[0.7rem] leading-relaxed text-muted-foreground">
                        {e.explanation}
                      </p>
                    </div>
                  );
                })}
                <div ref={logEndRef} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
