import { describe, expect, it } from "vitest";
import { blogArticles, getBlogArticle } from "@/lib/blog";
import { NODE_KINDS } from "@/lib/scenarios";

describe("blog", () => {
  it("содержит уникальные slug", () => {
    const slugs = blogArticles.map((a) => a.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("возвращает статью по slug", () => {
    const first = blogArticles[0];
    expect(getBlogArticle(first.slug)).toEqual(first);
    expect(getBlogArticle("ne-sushchestvuet")).toBeUndefined();
  });

  it("у каждой статьи есть советы и контент", () => {
    for (const article of blogArticles) {
      expect(article.tips.length).toBeGreaterThanOrEqual(3);
      expect(article.content.length).toBeGreaterThanOrEqual(3);
      expect(article.readMin).toBeGreaterThan(0);
    }
  });
});

describe("NODE_KINDS — типы устройств", () => {
  const deviceKinds = [
    "smartphone",
    "tablet",
    "laptop",
    "desktop",
    "router",
    "smartwatch",
    "iot",
    "smarttv",
    "printer",
    "nas",
  ] as const;

  it("включает расширенный набор устройств", () => {
    for (const kind of deviceKinds) {
      expect(NODE_KINDS).toContain(kind);
    }
  });
});
