"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Pencil, Trash2, Loader2, Workflow, PlayCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/client";
import { formatDateTime } from "@/lib/utils";

interface SchemeRow {
  id: string;
  title: string;
  category: string;
  difficulty: string;
  scenarioKey: string;
  isPublished: boolean;
  updatedAt: string;
  _count: { nodes: number; steps: number };
}

export function SchemeEditorList({
  gate,
  initial,
}: {
  gate: string;
  initial: SchemeRow[];
}) {
  const router = useRouter();
  const [rows, setRows] = useState<SchemeRow[]>(initial);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function remove(id: string, title: string) {
    if (!confirm(`Удалить схему «${title}»? Это действие необратимо.`)) return;
    setBusyId(id);
    const res = await apiFetch(`/api/admin/schemes/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (res.ok) {
      setRows((prev) => prev.filter((r) => r.id !== id));
      router.refresh();
    } else {
      alert(res.error ?? "Не удалось удалить схему.");
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <Workflow className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Конструктор схем — редактор</h1>
            <p className="text-sm text-muted-foreground">
              Создавайте собственные схемы атак и защиты в стиле n8n.
            </p>
          </div>
        </div>
        <Link href={`/panel/${gate}/editor/new`} className={buttonVariants()}>
          <Plus className="h-4 w-4" />
          Создать схему
        </Link>
      </div>

      {rows.length === 0 ? (
        <div className="glass-strong flex flex-col items-center gap-3 rounded-xl p-12 text-center">
          <Workflow className="h-10 w-10 text-muted-foreground" />
          <p className="text-muted-foreground">
            Пользовательских схем пока нет. Нажмите «Создать схему», чтобы построить первую.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rows.map((r) => (
            <div key={r.id} className="glass-strong flex flex-col rounded-xl p-5">
              <div className="mb-2 flex items-center justify-between">
                <Badge variant="data">{r.category}</Badge>
                <Badge variant="neutral">{r.difficulty}</Badge>
              </div>
              <h3 className="text-base font-semibold">{r.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Узлов: {r._count.nodes} · Шагов: {r._count.steps}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Изменено: {formatDateTime(r.updatedAt)}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Link
                  href={`/panel/${gate}/editor/${r.id}`}
                  className={buttonVariants({ variant: "secondary", size: "sm" })}
                >
                  <Pencil className="h-4 w-4" />
                  Редактировать
                </Link>
                <Link
                  href={`/constructor?scenario=${r.scenarioKey}`}
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <PlayCircle className="h-4 w-4" />
                  Открыть
                </Link>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => remove(r.id, r.title)}
                  disabled={busyId === r.id}
                >
                  {busyId === r.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
