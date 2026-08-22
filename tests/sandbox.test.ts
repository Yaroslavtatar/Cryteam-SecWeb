import { describe, it, expect } from "vitest";
import { getChallenge, getQueryParam, challenges } from "@/lib/sandbox";

describe("sandbox — вспомогательные", () => {
  it("getQueryParam извлекает параметр", () => {
    expect(getQueryParam("/api/account?id=1002", "id")).toBe("1002");
    expect(getQueryParam("/search?q=hello%20world", "q")).toBe("hello world");
    expect(getQueryParam("/x", "id")).toBeNull();
  });

  it("есть минимум 3 задания", () => {
    expect(challenges.length).toBeGreaterThanOrEqual(3);
  });
});

describe("sandbox — SQL-инъекция входа", () => {
  const c = getChallenge("sqli-login")!;
  const inj = { method: "POST" as const, path: "/api/login", body: '{"username":"admin","password":"\' OR \'1\'=\'1"}' };

  it("инъекция без защиты — успех (обход входа)", () => {
    const r = c.evaluate(inj, false);
    expect(r.verdict).toBe("success");
    expect(r.status).toBe(200);
  });

  it("инъекция с защитой — заблокировано", () => {
    const r = c.evaluate(inj, true);
    expect(r.verdict).toBe("blocked");
    expect(r.status).toBe(401);
  });

  it("обычный неверный пароль — info", () => {
    const r = c.evaluate(
      { method: "POST", path: "/api/login", body: '{"username":"admin","password":"123"}' },
      false,
    );
    expect(r.verdict).toBe("info");
  });
});

describe("sandbox — IDOR", () => {
  const c = getChallenge("idor-account")!;
  it("чужой id без защиты — успех", () => {
    const r = c.evaluate({ method: "GET", path: "/api/account?id=1002", body: "" }, false);
    expect(r.verdict).toBe("success");
  });
  it("чужой id с защитой — 403", () => {
    const r = c.evaluate({ method: "GET", path: "/api/account?id=1002", body: "" }, true);
    expect(r.verdict).toBe("blocked");
    expect(r.status).toBe(403);
  });
  it("свой id — info", () => {
    const r = c.evaluate({ method: "GET", path: "/api/account?id=1001", body: "" }, false);
    expect(r.verdict).toBe("info");
  });
});

describe("sandbox — XSS", () => {
  const c = getChallenge("xss-search")!;
  it("payload со <script> без защиты — успех", () => {
    const r = c.evaluate({ method: "GET", path: "/search?q=<script>alert(1)</script>", body: "" }, false);
    expect(r.verdict).toBe("success");
  });
  it("payload с защитой — экранировано", () => {
    const r = c.evaluate({ method: "GET", path: "/search?q=<script>alert(1)</script>", body: "" }, true);
    expect(r.verdict).toBe("blocked");
    expect(r.response).toContain("&lt;script&gt;");
  });
});
