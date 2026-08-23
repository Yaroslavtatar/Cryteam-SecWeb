import { describe, it, expect } from "vitest";
import { parseRepo, newIssueUrl, GITHUB_REPO_URL } from "@/lib/github";

describe("github — parseRepo", () => {
  it("разбирает owner/name", () => {
    expect(parseRepo("acme/widgets")).toEqual({ owner: "acme", name: "widgets" });
  });
  it("разбирает полный URL и .git", () => {
    expect(parseRepo("https://github.com/acme/widgets.git")).toEqual({
      owner: "acme",
      name: "widgets",
    });
  });
  it("возвращает null для некорректного ввода", () => {
    expect(parseRepo("broken")).toBeNull();
  });
});

describe("github — newIssueUrl", () => {
  it("строит URL создания issue с параметрами", () => {
    const url = newIssueUrl({
      title: "[Инцидент] Тест",
      body: "Описание",
      labels: ["incident", "security"],
    });
    expect(url.startsWith(`${GITHUB_REPO_URL}/issues/new?`)).toBe(true);
    const qs = new URL(url).searchParams;
    expect(qs.get("title")).toBe("[Инцидент] Тест");
    expect(qs.get("body")).toBe("Описание");
    expect(qs.get("labels")).toBe("incident,security");
  });

  it("без параметров возвращает базовый путь", () => {
    expect(newIssueUrl()).toBe(`${GITHUB_REPO_URL}/issues/new`);
  });
});
