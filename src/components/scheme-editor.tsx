"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  Handle,
  Position,
  applyNodeChanges,
  type Node,
  type Edge,
  type Connection,
  type NodeChange,
  type NodeProps,
  type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  Plus,
  Save,
  Trash2,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  MousePointerClick,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import type { NodeKind, StepOutcome } from "@/lib/scenarios";
import { KIND_META, TONE_CLASSES, KIND_OPTIONS } from "@/components/scheme-kinds";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiFetch } from "@/lib/client";
import { cn } from "@/lib/utils";

// Логический размер полотна для конвертации координат узлов в проценты (0..100).
const PX_W = 760;
const PX_H = 400;

const OUTCOME_LABELS: Record<StepOutcome, string> = {
  info: "Передача данных",
  blocked: "Заблокировано",
  exploited: "Эксплуатация",
  success: "Успешно",
};

const DIFFICULTIES = ["Базовый", "Средний", "Продвинутый"] as const;
const CATEGORIES = ["Веб-атаки", "Сеть", "Авторизация", "Аккаунты и мессенджеры"];

export interface EditorNode {
  key: string;
  label: string;
  kind: NodeKind;
  x: number; // проценты 0..100
  y: number;
}
export interface EditorStep {
  title: string;
  description: string;
  from: string;
  to: string;
  packetLabel: string;
  outcome: StepOutcome;
}
export interface EditorScheme {
  id?: string;
  title: string;
  category: string;
  difficulty: string;
  summary: string;
  estimatedMin: number;
  finalStatus: string;
  finalTitle: string;
  finalDescription: string;
  mitigations: string[];
  nodes: EditorNode[];
  steps: EditorStep[];
}

type FlowData = { label: string; kind: NodeKind };

function SchemeFlowNode({ data, selected }: NodeProps) {
  const d = data as FlowData;
  const meta = KIND_META[d.kind] ?? KIND_META.server;
  const Icon = meta.icon;
  return (
    <div className="flex flex-col items-center gap-1">
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-background !bg-accent" />
      <div
        className={cn(
          "grid h-14 w-14 place-items-center rounded-xl border-2 transition-all",
          TONE_CLASSES[meta.tone],
          selected && "ring-2 ring-primary shadow-glow",
        )}
      >
        <Icon className="h-6 w-6" />
      </div>
      <span className="max-w-[7rem] text-center text-[0.7rem] font-medium leading-tight text-foreground/90">
        {d.label}
      </span>
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-background !bg-primary" />
    </div>
  );
}

const nodeTypes: NodeTypes = { scheme: SchemeFlowNode };

export function SchemeEditor({
  gate,
  initial,
}: {
  gate: string;
  initial: EditorScheme | null;
}) {
  return (
    <ReactFlowProvider>
      <SchemeEditorInner gate={gate} initial={initial} />
    </ReactFlowProvider>
  );
}

function SchemeEditorInner({
  gate,
  initial,
}: {
  gate: string;
  initial: EditorScheme | null;
}) {
  const router = useRouter();
  const isEdit = Boolean(initial?.id);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [category, setCategory] = useState(initial?.category ?? CATEGORIES[0]);
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "Средний");
  const [summary, setSummary] = useState(initial?.summary ?? "");
  const [estimatedMin, setEstimatedMin] = useState(initial?.estimatedMin ?? 10);
  const [finalStatus, setFinalStatus] = useState(initial?.finalStatus ?? "defended");
  const [finalTitle, setFinalTitle] = useState(initial?.finalTitle ?? "Атака заблокирована");
  const [finalDescription, setFinalDescription] = useState(initial?.finalDescription ?? "");
  const [mitigationsText, setMitigationsText] = useState(
    (initial?.mitigations ?? []).join("\n"),
  );

  // Узлы React Flow (позиции в px), из начальных процентов.
  const [rfNodes, setRfNodes] = useState<Node[]>(() =>
    (initial?.nodes ?? []).map((n) => ({
      id: n.key,
      type: "scheme",
      position: { x: (n.x / 100) * PX_W, y: (n.y / 100) * PX_H },
      data: { label: n.label, kind: n.kind } as FlowData,
    })),
  );
  const [steps, setSteps] = useState<EditorStep[]>(initial?.steps ?? []);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [selectedStep, setSelectedStep] = useState<number | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const nodeCounter = useRef(rfNodes.length);

  // Рёбра выводятся из шагов (шаги — источник правды анимации).
  const edges: Edge[] = useMemo(
    () =>
      steps.map((s, i) => ({
        id: `e-${i}`,
        source: s.from,
        target: s.to,
        label: String(i + 1),
        animated: true,
        style: { stroke: "hsl(var(--primary))" },
        labelStyle: { fill: "hsl(var(--foreground))", fontSize: 11 },
        labelBgStyle: { fill: "hsl(var(--card))" },
      })),
    [steps],
  );

  const onNodesChange = useCallback(
    (changes: NodeChange[]) => setRfNodes((nds) => applyNodeChanges(changes, nds)),
    [],
  );

  const onConnect = useCallback((conn: Connection) => {
    if (!conn.source || !conn.target) return;
    setSteps((prev) => [
      ...prev,
      {
        title: `Шаг ${prev.length + 1}`,
        description: "",
        from: conn.source as string,
        to: conn.target as string,
        packetLabel: "данные",
        outcome: "info",
      },
    ]);
  }, []);

  function addNode() {
    nodeCounter.current += 1;
    const key = `node-${nodeCounter.current}-${Math.random().toString(36).slice(2, 5)}`;
    const idx = rfNodes.length;
    setRfNodes((nds) => [
      ...nds,
      {
        id: key,
        type: "scheme",
        position: { x: 80 + (idx % 4) * 160, y: 80 + Math.floor(idx / 4) * 140 },
        data: { label: "Новый узел", kind: "server" } as FlowData,
      },
    ]);
    setSelectedNode(key);
    setSelectedStep(null);
  }

  function updateNode(key: string, patch: Partial<FlowData>) {
    setRfNodes((nds) =>
      nds.map((n) =>
        n.id === key ? { ...n, data: { ...(n.data as FlowData), ...patch } } : n,
      ),
    );
  }

  function deleteNode(key: string) {
    setRfNodes((nds) => nds.filter((n) => n.id !== key));
    setSteps((prev) => prev.filter((s) => s.from !== key && s.to !== key));
    setSelectedNode(null);
  }

  function addStep() {
    if (rfNodes.length === 0) return;
    const first = rfNodes[0].id;
    const second = rfNodes[1]?.id ?? first;
    setSteps((prev) => {
      const next = [
        ...prev,
        {
          title: `Шаг ${prev.length + 1}`,
          description: "",
          from: first,
          to: second,
          packetLabel: "данные",
          outcome: "info" as StepOutcome,
        },
      ];
      return next;
    });
    setSelectedStep(steps.length);
    setSelectedNode(null);
  }

  function updateStep(i: number, patch: Partial<EditorStep>) {
    setSteps((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  }
  function deleteStep(i: number) {
    setSteps((prev) => prev.filter((_, idx) => idx !== i));
    setSelectedStep(null);
  }
  function moveStep(i: number, dir: -1 | 1) {
    setSteps((prev) => {
      const j = i + dir;
      if (j < 0 || j >= prev.length) return prev;
      const copy = [...prev];
      [copy[i], copy[j]] = [copy[j], copy[i]];
      return copy;
    });
    setSelectedStep(null);
  }

  const nodeOptions = rfNodes.map((n) => ({
    key: n.id,
    label: (n.data as FlowData).label,
  }));

  async function save() {
    setSaving(true);
    setError(null);

    const payloadNodes: EditorNode[] = rfNodes.map((n) => ({
      key: n.id,
      label: (n.data as FlowData).label,
      kind: (n.data as FlowData).kind,
      x: Math.max(0, Math.min(100, Math.round((n.position.x / PX_W) * 100))),
      y: Math.max(0, Math.min(100, Math.round((n.position.y / PX_H) * 100))),
    }));

    const payload = {
      title,
      category,
      difficulty,
      summary,
      estimatedMin: Number(estimatedMin),
      finalStatus,
      finalTitle,
      finalDescription,
      mitigations: mitigationsText
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean),
      nodes: payloadNodes,
      steps,
    };

    const res = isEdit
      ? await apiFetch(`/api/admin/schemes/${initial!.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        })
      : await apiFetch("/api/admin/schemes", {
          method: "POST",
          body: JSON.stringify(payload),
        });

    setSaving(false);
    if (!res.ok) {
      const firstField = res.fields ? Object.values(res.fields)[0] : undefined;
      setError(firstField ?? res.error ?? "Не удалось сохранить схему.");
      return;
    }
    router.push(`/panel/${gate}/editor`);
    router.refresh();
  }

  const selectedNodeData =
    selectedNode != null
      ? (rfNodes.find((n) => n.id === selectedNode)?.data as FlowData | undefined)
      : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/panel/${gate}/editor`)}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            К списку
          </button>
          <h1 className="text-xl font-bold tracking-tight md:text-2xl">
            {isEdit ? "Редактирование схемы" : "Новая схема"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={addNode}>
            <Plus className="h-4 w-4" />
            Добавить узел
          </Button>
          <Button size="sm" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Сохранить
          </Button>
        </div>
      </div>

      {error && (
        <div role="alert" className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_360px]">
        {/* Полотно */}
        <div className="glass-strong overflow-hidden rounded-xl">
          <div className="flex items-center gap-2 border-b border-white/5 px-4 py-2.5 text-xs text-muted-foreground">
            <MousePointerClick className="h-3.5 w-3.5" />
            Перетаскивайте узлы. Соедините узлы: потяните от правой точки одного узла к левой точке другого — создастся шаг.
          </div>
          <div className="h-[460px] w-full cyber-grid">
            <ReactFlow
              nodes={rfNodes}
              edges={edges}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onConnect={onConnect}
              onNodeClick={(_, n) => {
                setSelectedNode(n.id);
                setSelectedStep(null);
              }}
              onEdgeClick={(_, e) => {
                const idx = Number(e.id.replace("e-", ""));
                setSelectedStep(Number.isFinite(idx) ? idx : null);
                setSelectedNode(null);
              }}
              deleteKeyCode={null}
              fitView
              proOptions={{ hideAttribution: true }}
            >
              <Background color="hsl(var(--border))" gap={20} />
              <Controls className="!bg-card !border-border" />
            </ReactFlow>
          </div>
        </div>

        {/* Правая панель: инспектор */}
        <div className="space-y-4">
          {/* Инспектор выбранного узла */}
          {selectedNodeData && (
            <div className="glass-strong space-y-3 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Узел</h3>
                <Button variant="destructive" size="sm" onClick={() => deleteNode(selectedNode!)}>
                  <Trash2 className="h-4 w-4" />
                  Удалить
                </Button>
              </div>
              <div className="space-y-1.5">
                <Label>Название узла</Label>
                <Input
                  value={selectedNodeData.label}
                  onChange={(e) => updateNode(selectedNode!, { label: e.target.value })}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Тип узла</Label>
                <Select
                  value={selectedNodeData.kind}
                  onChange={(v) => updateNode(selectedNode!, { kind: v as NodeKind })}
                  options={KIND_OPTIONS}
                />
              </div>
            </div>
          )}

          {/* Инспектор выбранного шага */}
          {selectedStep != null && steps[selectedStep] && (
            <div className="glass-strong space-y-3 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Шаг {selectedStep + 1}</h3>
                <Button variant="destructive" size="sm" onClick={() => deleteStep(selectedStep)}>
                  <Trash2 className="h-4 w-4" />
                  Удалить
                </Button>
              </div>
              <StepFields
                step={steps[selectedStep]}
                nodeOptions={nodeOptions}
                onChange={(patch) => updateStep(selectedStep, patch)}
              />
            </div>
          )}

          {/* Параметры схемы */}
          <div className="glass-strong space-y-3 rounded-xl p-4">
            <h3 className="text-sm font-semibold">Параметры схемы</h3>
            <div className="space-y-1.5">
              <Label>Название</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Напр.: Кража cookie через XSS" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label>Категория</Label>
                <Select value={category} onChange={setCategory} options={CATEGORIES.map((c) => ({ value: c, label: c }))} allowCustom />
              </div>
              <div className="space-y-1.5">
                <Label>Сложность</Label>
                <Select value={difficulty} onChange={setDifficulty} options={DIFFICULTIES.map((d) => ({ value: d, label: d }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Краткое описание</Label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={2}
                className="flex w-full rounded-lg border border-input bg-background/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Длительность, мин</Label>
              <Input
                type="number"
                min={1}
                value={estimatedMin}
                onChange={(e) => setEstimatedMin(Number(e.target.value))}
              />
            </div>
          </div>

          {/* Итог и защита */}
          <div className="glass-strong space-y-3 rounded-xl p-4">
            <h3 className="text-sm font-semibold">Итог и защита</h3>
            <div className="space-y-1.5">
              <Label>Итоговый статус</Label>
              <Select
                value={finalStatus}
                onChange={setFinalStatus}
                options={[
                  { value: "defended", label: "Атака отражена" },
                  { value: "exploited", label: "Атака удалась" },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Заголовок итога</Label>
              <Input value={finalTitle} onChange={(e) => setFinalTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Описание итога</Label>
              <textarea
                value={finalDescription}
                onChange={(e) => setFinalDescription(e.target.value)}
                rows={2}
                className="flex w-full rounded-lg border border-input bg-background/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Как защититься (по одному пункту на строку)</Label>
              <textarea
                value={mitigationsText}
                onChange={(e) => setMitigationsText(e.target.value)}
                rows={4}
                className="flex w-full rounded-lg border border-input bg-background/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Список шагов */}
      <div className="glass-strong rounded-xl p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Шаги анимации ({steps.length})</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              Создать шаг: соедините узлы на схеме или кнопкой →
            </span>
            <Button variant="secondary" size="sm" onClick={addStep} disabled={rfNodes.length === 0}>
              <Plus className="h-4 w-4" />
              Добавить шаг
            </Button>
          </div>
        </div>
        {steps.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Пока нет шагов. Добавьте узлы и соедините их на полотне.
          </p>
        ) : (
          <div className="space-y-2">
            {steps.map((s, i) => (
              <div
                key={i}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3 py-2",
                  selectedStep === i
                    ? "border-primary/50 bg-primary/10"
                    : "border-border bg-white/[0.02]",
                )}
              >
                <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary/15 font-mono text-xs text-primary">
                  {i + 1}
                </span>
                <button className="flex-1 text-left" onClick={() => { setSelectedStep(i); setSelectedNode(null); }}>
                  <div className="text-sm font-medium">{s.title || "(без названия)"}</div>
                  <div className="text-xs text-muted-foreground">
                    {nodeLabel(nodeOptions, s.from)} → {nodeLabel(nodeOptions, s.to)} · {OUTCOME_LABELS[s.outcome]}
                  </div>
                </button>
                <div className="flex items-center gap-1">
                  <button onClick={() => moveStep(i, -1)} className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground" aria-label="Вверх">
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button onClick={() => moveStep(i, 1)} className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground" aria-label="Вниз">
                    <ArrowDown className="h-4 w-4" />
                  </button>
                  <button onClick={() => deleteStep(i)} className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive" aria-label="Удалить">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function nodeLabel(options: { key: string; label: string }[], key: string) {
  return options.find((o) => o.key === key)?.label ?? key;
}

function StepFields({
  step,
  nodeOptions,
  onChange,
}: {
  step: EditorStep;
  nodeOptions: { key: string; label: string }[];
  onChange: (patch: Partial<EditorStep>) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="space-y-1.5">
        <Label>Название шага</Label>
        <Input value={step.title} onChange={(e) => onChange({ title: e.target.value })} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1.5">
          <Label>От узла</Label>
          <Select
            value={step.from}
            onChange={(v) => onChange({ from: v })}
            options={nodeOptions.map((o) => ({ value: o.key, label: o.label }))}
          />
        </div>
        <div className="space-y-1.5">
          <Label>К узлу</Label>
          <Select
            value={step.to}
            onChange={(v) => onChange({ to: v })}
            options={nodeOptions.map((o) => ({ value: o.key, label: o.label }))}
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Подпись пакета</Label>
        <Input value={step.packetLabel} onChange={(e) => onChange({ packetLabel: e.target.value })} />
      </div>
      <div className="space-y-1.5">
        <Label>Исход</Label>
        <Select
          value={step.outcome}
          onChange={(v) => onChange({ outcome: v as StepOutcome })}
          options={(Object.keys(OUTCOME_LABELS) as StepOutcome[]).map((o) => ({
            value: o,
            label: OUTCOME_LABELS[o],
          }))}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Описание шага</Label>
        <textarea
          value={step.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={3}
          className="flex w-full rounded-lg border border-input bg-background/40 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
    </div>
  );
}

function Select({
  value,
  onChange,
  options,
  allowCustom,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  allowCustom?: boolean;
}) {
  const hasValue = options.some((o) => o.value === value);
  return (
    <select
      value={hasValue || !allowCustom ? value : "__custom__"}
      onChange={(e) => onChange(e.target.value === "__custom__" ? value : e.target.value)}
      className="h-10 w-full rounded-lg border border-input bg-background/40 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      {options.map((o) => (
        <option key={o.value} value={o.value} className="bg-card">
          {o.label}
        </option>
      ))}
    </select>
  );
}
