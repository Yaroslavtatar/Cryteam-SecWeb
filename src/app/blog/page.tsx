import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, BookOpen, Lightbulb } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { AppHeader } from "@/components/app-header";
import { CyberBackground } from "@/components/background";
import { FadeIn } from "@/components/motion";
import { Badge } from "@/components/ui/badge";
import { blogArticles, type BlogCategory } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Рекомендации — CRYTEAM SecWeb",
  description:
    "Практические советы по цифровой гигиене, защите аккаунтов и безопасному использованию устройств.",
};

const CATEGORIES: BlogCategory[] = [
  "Цифровая гигиена",
  "Аккаунты",
  "Устройства",
  "Мессенджеры",
];

export default async function BlogPage() {
  const user = await getCurrentUser();

  return (
    <>
      <CyberBackground />
      <AppHeader user={user} />
      <div className="container py-8 md:py-12">
        <FadeIn className="mx-auto mb-10 max-w-2xl text-center">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-sm text-primary">
            <BookOpen className="h-4 w-4" />
            Рекомендации
          </div>
          <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
            Цифровая гигиена и безопасность аккаунтов
          </h1>
          <p className="mt-3 text-muted-foreground">
            Короткие практичные материалы: что проверить сегодня, как не попасться на
            фишинг и как защитить устройства всей семьи.
          </p>
        </FadeIn>

        <FadeIn className="mb-8 flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((cat) => {
            const count = blogArticles.filter((a) => a.category === cat).length;
            return (
              <Badge key={cat} variant="neutral">
                {cat} · {count}
              </Badge>
            );
          })}
        </FadeIn>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {blogArticles.map((article, i) => (
            <FadeIn key={article.slug} delay={i * 0.04}>
              <Link
                href={`/blog/${article.slug}`}
                className="glass group flex h-full flex-col rounded-xl p-6 transition-all hover:border-primary/30 hover:shadow-glow"
              >
                <div className="mb-3 flex items-center justify-between gap-2">
                  <Badge variant="data">{article.category}</Badge>
                  <span className="text-xs text-muted-foreground">
                    {article.readMin} мин
                  </span>
                </div>
                <h2 className="text-lg font-semibold leading-snug">{article.title}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-3">
                  {article.summary}
                </p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {article.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-md bg-white/5 px-2 py-0.5 text-[0.7rem] text-muted-foreground"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
                <div className="mt-4 inline-flex items-center gap-1 text-sm text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Читать <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            </FadeIn>
          ))}
        </div>

        <FadeIn className="mt-12">
          <div className="glass mx-auto max-w-2xl rounded-xl border-[hsl(var(--defense))]/30 p-6 text-center">
            <Lightbulb className="mx-auto mb-3 h-8 w-8 text-[hsl(var(--defense))]" />
            <h3 className="text-lg font-semibold">Хотите увидеть атаку наглядно?</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              В конструкторе можно пошагово разобрать типичные схемы и сразу увидеть
              рекомендации по защите.
            </p>
            <Link
              href={user ? "/constructor" : "/register"}
              className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              {user ? "Открыть конструктор" : "Зарегистрироваться и начать"}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </FadeIn>
      </div>
    </>
  );
}
