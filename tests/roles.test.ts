import { describe, it, expect } from "vitest";
import { ROLES, isRole, roleLabel } from "@/lib/roles";

describe("roles", () => {
  it("распознаёт валидные роли", () => {
    expect(isRole(ROLES.ADMIN)).toBe(true);
    expect(isRole(ROLES.STUDENT)).toBe(true);
    expect(isRole("UNKNOWN")).toBe(false);
  });

  it("возвращает русские названия ролей", () => {
    expect(roleLabel("ADMIN")).toBe("Администратор");
    expect(roleLabel("STUDENT")).toBe("Ученик");
  });

  it("возвращает исходное значение для неизвестной роли", () => {
    expect(roleLabel("XYZ")).toBe("XYZ");
  });
});
