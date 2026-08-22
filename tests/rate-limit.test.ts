import { describe, it, expect } from "vitest";
import { rateLimit, RATE_POLICIES } from "@/lib/rate-limit";

describe("rateLimit", () => {
  it("разрешает запросы до лимита и блокирует после", () => {
    const key = `test-${Math.random()}`;
    const limit = 3;
    const window = 10_000;

    const r1 = rateLimit(key, limit, window);
    expect(r1.allowed).toBe(true);
    expect(r1.remaining).toBe(2);

    rateLimit(key, limit, window); // 2
    const r3 = rateLimit(key, limit, window); // 3
    expect(r3.allowed).toBe(true);
    expect(r3.remaining).toBe(0);

    const r4 = rateLimit(key, limit, window); // 4 -> блок
    expect(r4.allowed).toBe(false);
    expect(r4.retryAfterSec).toBeGreaterThan(0);
  });

  it("отдельные ключи не влияют друг на друга", () => {
    const a = rateLimit("key-a", 1, 10_000);
    const b = rateLimit("key-b", 1, 10_000);
    expect(a.allowed).toBe(true);
    expect(b.allowed).toBe(true);
  });

  it("сбрасывает окно по истечении времени", async () => {
    const key = `expire-${Math.random()}`;
    expect(rateLimit(key, 1, 30).allowed).toBe(true);
    expect(rateLimit(key, 1, 30).allowed).toBe(false);
    await new Promise((r) => setTimeout(r, 40));
    expect(rateLimit(key, 1, 30).allowed).toBe(true);
  });

  it("политики заданы разумно", () => {
    expect(RATE_POLICIES.login.limit).toBeGreaterThan(0);
    expect(RATE_POLICIES.register.limit).toBeGreaterThan(0);
    expect(RATE_POLICIES.api.limit).toBeGreaterThan(0);
  });
});
