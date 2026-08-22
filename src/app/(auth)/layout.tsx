import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CyberBackground } from "@/components/background";
import { Brand } from "@/components/brand";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CyberBackground />
      <div className="flex min-h-[100dvh] flex-col">
        <header className="container flex h-16 items-center justify-between">
          <Brand />
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
        </header>
        <main className="flex flex-1 items-center justify-center px-4 py-10">
          {children}
        </main>
      </div>
    </>
  );
}
