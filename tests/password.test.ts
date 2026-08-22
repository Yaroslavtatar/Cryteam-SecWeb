import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("password", () => {
  it("хеш не совпадает с исходным паролем", async () => {
    const hash = await hashPassword("Str0ng#Pass");
    expect(hash).not.toBe("Str0ng#Pass");
    expect(hash.length).toBeGreaterThan(20);
  });

  it("verifyPassword возвращает true для верного пароля", async () => {
    const hash = await hashPassword("Str0ng#Pass");
    expect(await verifyPassword("Str0ng#Pass", hash)).toBe(true);
  });

  it("verifyPassword возвращает false для неверного пароля", async () => {
    const hash = await hashPassword("Str0ng#Pass");
    expect(await verifyPassword("wrong", hash)).toBe(false);
  });

  it("verifyPassword не бросает исключение на некорректном хеше", async () => {
    expect(await verifyPassword("x", "не-хеш")).toBe(false);
  });
});
