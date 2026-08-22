import { prisma } from "./db";
import { scenarios } from "./scenarios";
import type { Scenario, NodeKind, StepOutcome } from "./scenarios";

// Преобразование пользовательских схем (хранятся в БД) в формат Scenario,
// который понимает интерактивный плеер конструктора.

type ModuleWithGraph = {
  scenarioKey: string;
  slug: string;
  title: string;
  category: string;
  difficulty: string;
  summary: string;
  estimatedMin: number;
  order: number;
  finalStatus: string;
  finalTitle: string;
  finalDescription: string;
  mitigations: string;
  nodes: { key: string; label: string; kind: string; x: number; y: number }[];
  steps: {
    order: number;
    title: string;
    description: string;
    fromNode: string;
    toNode: string;
    packetLabel: string;
    outcome: string;
    method: string;
    requestBody: string;
    responseBody: string;
  }[];
};

export function mapModuleToScenario(m: ModuleWithGraph): Scenario {
  let mitigations: string[] = [];
  try {
    const parsed = JSON.parse(m.mitigations || "[]");
    if (Array.isArray(parsed)) mitigations = parsed.filter((x) => typeof x === "string");
  } catch {
    mitigations = [];
  }

  return {
    key: m.scenarioKey,
    slug: m.slug,
    title: m.title,
    category: m.category,
    difficulty: m.difficulty as Scenario["difficulty"],
    summary: m.summary,
    estimatedMin: m.estimatedMin,
    order: m.order,
    nodes: m.nodes.map((n) => ({
      id: n.key,
      label: n.label,
      kind: n.kind as NodeKind,
      x: n.x,
      y: n.y,
    })),
    steps: [...m.steps]
      .sort((a, b) => a.order - b.order)
      .map((s, i) => ({
        order: i + 1,
        title: s.title,
        description: s.description,
        from: s.fromNode,
        to: s.toNode,
        packetLabel: s.packetLabel,
        outcome: s.outcome as StepOutcome,
        method: s.method || undefined,
        request: s.requestBody || undefined,
        response: s.responseBody || undefined,
      })),
    final: {
      status: (m.finalStatus === "exploited" ? "exploited" : "defended"),
      title: m.finalTitle,
      description: m.finalDescription,
    },
    mitigations,
  };
}

/** Возвращает опубликованные пользовательские схемы как сценарии. */
export async function getCustomScenarios(): Promise<Scenario[]> {
  const modules = await prisma.module.findMany({
    where: { isCustom: true, isPublished: true },
    orderBy: { order: "asc" },
    include: { nodes: true, steps: true },
  });
  return modules.map(mapModuleToScenario);
}

/** Встроенные + пользовательские сценарии (для уроков и конструктора). */
export async function getAllScenarios(): Promise<Scenario[]> {
  const custom = await getCustomScenarios();
  return [...scenarios, ...custom];
}

/** Простой транслит + слаг для генерации slug/scenarioKey из названия. */
export function slugify(input: string): string {
  const map: Record<string, string> = {
    а: "a", б: "b", в: "v", г: "g", д: "d", е: "e", ё: "e", ж: "zh",
    з: "z", и: "i", й: "y", к: "k", л: "l", м: "m", н: "n", о: "o",
    п: "p", р: "r", с: "s", т: "t", у: "u", ф: "f", х: "h", ц: "ts",
    ч: "ch", ш: "sh", щ: "sch", ъ: "", ы: "y", ь: "", э: "e", ю: "yu",
    я: "ya",
  };
  return (
    input
      .toLowerCase()
      .split("")
      .map((ch) => map[ch] ?? ch)
      .join("")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "shema"
  );
}
