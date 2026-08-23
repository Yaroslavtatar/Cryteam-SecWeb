"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ShieldAlert, Github, ExternalLink, ArrowUpRight } from "lucide-react";
import { newIssueUrl, GITHUB_LINKS } from "@/lib/github";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

const SEVERITIES = ["Низкая", "Средняя", "Высокая", "Критическая"] as const;
const CATEGORIES = [
  "Веб-атака",
  "Сеть",
  "Авторизация",
  "Аккаунт / мессенджер",
  "Другое",
] as const;

export function IncidentReporter() {
  const [title, setTitle] = useState("");
  const [severity, setSeverity] = useState<string>("Средняя");
  const [category, setCategory] = useState<string>("Веб-атака");
  const [description, setDescription] = useState("");
  const [steps, setSteps] = useState("");

  const issueUrl = useMemo(() => {
    const body = [
      `**Серьёзность:** ${severity}`,
      `**Категория:** ${category}`,
      "",
      "### Описание",
      description || "_—_",
      "",
      "### Шаги воспроизведения",
      steps || "_—_",
      "",
      "---",
      "Создано через форму инцидентов CRYTEAM SecWeb.",
    ].join("\n");
    return newIssueUrl({
      title: title ? `[Инцидент] ${title}` : "[Инцидент] ",
      body,
      labels: ["incident"],
    });
  }, [title, severity, category, description, steps]);

  const canSubmit = title.trim().length > 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl border border-destructive/30 bg-destructive/10 text-destructive">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Сообщить об инциденте</h1>
          <p className="text-sm text-muted-foreground">
            Инцидент создаётся как issue в GitHub — форма откроет заполненную
            страницу в новой вкладке.
          </p>
        </div>
      </div>

      <div className="glass-strong space-y-4 rounded-xl p-5">
        <div className="space-y-1.5">
          <Label>Заголовок инцидента *</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Напр.: Подозрительная активность на странице входа"
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Серьёзность</Label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background/40 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {SEVERITIES.map((s) => (
                <option key={s} value={s} className="bg-card">
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label>Категория</Label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="h-10 w-full rounded-lg border border-input bg-background/40 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c} className="bg-card">
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Описание</Label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Что произошло, где и когда замечено."
            className="flex w-full rounded-lg border border-input bg-background/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Шаги воспроизведения (необязательно)</Label>
          <textarea
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            rows={3}
            placeholder="1. …&#10;2. …"
            className="flex w-full rounded-lg border border-input bg-background/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-1">
          <a
            href={canSubmit ? issueUrl : undefined}
            target="_blank"
            rel="noopener noreferrer"
            aria-disabled={!canSubmit}
            className={buttonVariants({
              variant: "destructive",
              className: canSubmit ? "" : "pointer-events-none opacity-50",
            })}
          >
            <Github className="h-4 w-4" />
            Создать инцидент на GitHub
            <ArrowUpRight className="h-4 w-4" />
          </a>
          <a
            href={GITHUB_LINKS.issues}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonVariants({ variant: "outline" })}
          >
            <ExternalLink className="h-4 w-4" />
            Все инциденты
          </a>
          {!canSubmit && (
            <span className="text-xs text-muted-foreground">
              Укажите заголовок, чтобы продолжить.
            </span>
          )}
        </div>
      </div>

      {canSubmit && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-xl p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="attack">Предпросмотр</Badge>
            <span className="text-xs text-muted-foreground">
              так инцидент будет выглядеть на GitHub
            </span>
          </div>
          <div className="text-sm font-semibold">[Инцидент] {title}</div>
          <pre className="mt-2 whitespace-pre-wrap rounded-lg bg-[#04060c] p-3 font-mono text-xs text-foreground/80">
{`**Серьёзность:** ${severity}
**Категория:** ${category}

### Описание
${description || "—"}

### Шаги воспроизведения
${steps || "—"}`}
          </pre>
        </motion.div>
      )}
    </div>
  );
}
