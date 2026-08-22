import { describe, it, expect } from "vitest";
import {
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from "@/lib/jwt";

const payload = {
  sub: "user-1",
  email: "user@example.com",
  fullName: "Иван Петров",
  role: "STUDENT",
};

describe("jwt", () => {
  it("подписывает и проверяет access-токен", async () => {
    const token = await signAccessToken(payload);
    const claims = await verifyAccessToken(token);
    expect(claims).not.toBeNull();
    expect(claims?.sub).toBe("user-1");
    expect(claims?.type).toBe("access");
  });

  it("подписывает и проверяет refresh-токен", async () => {
    const token = await signRefreshToken(payload);
    const claims = await verifyRefreshToken(token);
    expect(claims?.type).toBe("refresh");
  });

  it("не принимает access-токен как refresh (разные секреты/типы)", async () => {
    const access = await signAccessToken(payload);
    expect(await verifyRefreshToken(access)).toBeNull();
  });

  it("отклоняет подделанный токен", async () => {
    const token = await signAccessToken(payload);
    const tampered = token.slice(0, -3) + "abc";
    expect(await verifyAccessToken(tampered)).toBeNull();
  });

  it("отклоняет мусорную строку", async () => {
    expect(await verifyAccessToken("не.валидный.токен")).toBeNull();
  });
});
