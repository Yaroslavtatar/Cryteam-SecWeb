import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  updateRoleSchema,
  toggleBlockSchema,
  progressSchema,
  formatZodError,
} from "@/lib/validation";

describe("registerSchema", () => {
  it("принимает корректные данные", () => {
    const res = registerSchema.safeParse({
      fullName: "Иван Петров",
      email: "user@example.com",
      password: "Str0ng#Pass",
    });
    expect(res.success).toBe(true);
  });

  it("приводит email к нижнему регистру", () => {
    const res = registerSchema.safeParse({
      fullName: "Тест",
      email: "USER@EXAMPLE.COM",
      password: "Str0ng#Pass",
    });
    expect(res.success).toBe(true);
    if (res.success) expect(res.data.email).toBe("user@example.com");
  });

  it("отклоняет слабый пароль с сообщением на русском", () => {
    const res = registerSchema.safeParse({
      fullName: "Тест",
      email: "user@example.com",
      password: "123",
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      const fields = formatZodError(res.error);
      expect(fields.password).toMatch(/минимум 8 символов/i);
    }
  });

  it.each([
    ["без заглавной", "lower1#pass", /заглавную/i],
    ["без строчной", "UPPER1#PASS", /строчную/i],
    ["без цифры", "NoDigits#Pass", /цифру/i],
    ["без спецсимвола", "NoSpecial1Pass", /специальный/i],
  ])("проверяет сложность пароля: %s", (_label, password, re) => {
    const res = registerSchema.safeParse({
      fullName: "Тест",
      email: "user@example.com",
      password,
    });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(formatZodError(res.error).password).toMatch(re);
    }
  });

  it("отклоняет некорректный email", () => {
    const res = registerSchema.safeParse({
      fullName: "Тест",
      email: "not-an-email",
      password: "Str0ng#Pass",
    });
    expect(res.success).toBe(false);
  });
});

describe("loginSchema", () => {
  it("требует email и пароль", () => {
    const res = loginSchema.safeParse({ email: "", password: "" });
    expect(res.success).toBe(false);
  });
});

describe("updateRoleSchema", () => {
  it("принимает ADMIN и STUDENT", () => {
    expect(updateRoleSchema.safeParse({ role: "ADMIN" }).success).toBe(true);
    expect(updateRoleSchema.safeParse({ role: "STUDENT" }).success).toBe(true);
  });
  it("отклоняет неизвестную роль", () => {
    const res = updateRoleSchema.safeParse({ role: "SUPERUSER" });
    expect(res.success).toBe(false);
  });
});

describe("toggleBlockSchema", () => {
  it("требует булево значение", () => {
    expect(toggleBlockSchema.safeParse({ isBlocked: true }).success).toBe(true);
    expect(toggleBlockSchema.safeParse({ isBlocked: "yes" }).success).toBe(false);
  });
});

describe("progressSchema", () => {
  it("валидирует прогресс", () => {
    const res = progressSchema.safeParse({
      moduleId: "abc",
      lastStep: 3,
      status: "completed",
    });
    expect(res.success).toBe(true);
  });
  it("отклоняет отрицательный шаг", () => {
    const res = progressSchema.safeParse({
      moduleId: "abc",
      lastStep: -1,
      status: "in_progress",
    });
    expect(res.success).toBe(false);
  });
});

describe("formatZodError", () => {
  it("возвращает первое сообщение по каждому полю", () => {
    const res = registerSchema.safeParse({ fullName: "", email: "x", password: "1" });
    expect(res.success).toBe(false);
    if (!res.success) {
      const fields = formatZodError(res.error);
      expect(Object.keys(fields).length).toBeGreaterThan(0);
      expect(fields).toHaveProperty("email");
      expect(fields).toHaveProperty("password");
    }
  });
});
