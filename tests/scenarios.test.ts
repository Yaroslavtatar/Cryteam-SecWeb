import { describe, it, expect } from "vitest";
import {
  scenarios,
  getScenario,
  CATEGORY_ORDER,
  type StepOutcome,
} from "@/lib/scenarios";

const OUTCOMES: StepOutcome[] = ["info", "blocked", "exploited", "success"];

describe("scenarios — целостность данных", () => {
  it("есть хотя бы 10 сценариев", () => {
    expect(scenarios.length).toBeGreaterThanOrEqual(10);
  });

  it("ключи и slug уникальны", () => {
    const keys = scenarios.map((s) => s.key);
    const slugs = scenarios.map((s) => s.slug);
    expect(new Set(keys).size).toBe(keys.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("присутствуют сценарии взлома аккаунтов (MAX и Telegram)", () => {
    expect(getScenario("phishing-max")).toBeDefined();
    const tg = scenarios.filter((s) => s.key.startsWith("tg-"));
    expect(tg.length).toBeGreaterThanOrEqual(4);
  });

  it("каждый сценарий корректен", () => {
    for (const s of scenarios) {
      // Категория входит в известный список
      expect(CATEGORY_ORDER).toContain(s.category);
      // Есть узлы, шаги и рекомендации
      expect(s.nodes.length).toBeGreaterThan(0);
      expect(s.steps.length).toBeGreaterThan(0);
      expect(s.mitigations.length).toBeGreaterThan(0);

      const nodeIds = new Set(s.nodes.map((n) => n.id));

      s.steps.forEach((step, i) => {
        // Порядок шагов последовательный 1..n
        expect(step.order).toBe(i + 1);
        // from/to ссылаются на существующие узлы
        expect(nodeIds.has(step.from)).toBe(true);
        expect(nodeIds.has(step.to)).toBe(true);
        // Допустимый исход
        expect(OUTCOMES).toContain(step.outcome);
        // Непустая подпись пакета и описание
        expect(step.packetLabel.length).toBeGreaterThan(0);
        expect(step.description.length).toBeGreaterThan(0);
      });

      // Координаты узлов в пределах 0..100
      for (const n of s.nodes) {
        expect(n.x).toBeGreaterThanOrEqual(0);
        expect(n.x).toBeLessThanOrEqual(100);
        expect(n.y).toBeGreaterThanOrEqual(0);
        expect(n.y).toBeLessThanOrEqual(100);
      }

      // Финальный статус валиден
      expect(["defended", "exploited"]).toContain(s.final.status);
    }
  });

  it("getScenario возвращает undefined для неизвестного ключа", () => {
    expect(getScenario("no-such-key")).toBeUndefined();
  });
});
