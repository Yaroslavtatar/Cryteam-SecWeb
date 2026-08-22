import { describe, it, expect } from "vitest";
import { shuffledIndices, checkOrder } from "@/lib/lessons";

describe("lessons — shuffledIndices", () => {
  it("возвращает перестановку всех индексов", () => {
    const a = shuffledIndices(5, 3);
    expect(a.length).toBe(5);
    expect([...a].sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4]);
  });

  it("для n>1 порядок не идентичен исходному", () => {
    const a = shuffledIndices(4, 4);
    expect(a).not.toEqual([0, 1, 2, 3]);
  });
});

describe("lessons — checkOrder", () => {
  it("идентичный порядок — верно", () => {
    const res = checkOrder([0, 1, 2, 3]);
    expect(res.correct).toBe(true);
    expect(res.positions.every(Boolean)).toBe(true);
  });

  it("переставленный порядок — неверно, с поэлементной разметкой", () => {
    const res = checkOrder([1, 0, 2]);
    expect(res.correct).toBe(false);
    expect(res.positions).toEqual([false, false, true]);
  });
});
