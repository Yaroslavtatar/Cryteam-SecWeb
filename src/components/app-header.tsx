"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Workflow,
  ShieldCheck,
  Terminal,
  GraduationCap,
  ShieldAlert,
} from "lucide-react";
import { Brand } from "@/components/brand";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GithubStarButton } from "@/components/github-star-button";
import { apiFetch } from "@/lib/client";
import { roleLabel } from "@/lib/roles";
import { cn } from "@/lib/utils";

export interface HeaderUser {
  fullName: string;
  email: string;
  role: string;
}

const NAV = [
  { href: "/dashboard", label: "Кабинет", icon: LayoutDashboard },
  { href: "/constructor", label: "Конструктор", icon: Workflow },
  { href: "/sandbox", label: "Песочница", icon: Terminal },
  { href: "/lessons", label: "Уроки", icon: GraduationCap },
  { href: "/incidents", label: "Инциденты", icon: ShieldAlert },
];

export function AppHeader({ user }: { user: HeaderUser | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function logout() {
    setLoading(true);
    await apiFetch("/api/auth/logout", { method: "POST" });
    setLoading(false);
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-background/70 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Brand />

        <nav className="hidden items-center gap-1 md:flex">
          {user &&
            NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <GithubStarButton />
          {user ? (
            <>
              <div className="flex items-center gap-2 text-right">
                <div className="flex flex-col leading-tight">
                  <span className="text-sm font-medium text-foreground">
                    {user.fullName}
                  </span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </div>
                <Badge variant={user.role === "ADMIN" ? "data" : "default"}>
                  <ShieldCheck className="h-3 w-3" />
                  {roleLabel(user.role)}
                </Badge>
              </div>
              <Button variant="outline" size="sm" onClick={logout} disabled={loading}>
                <LogOut className="h-4 w-4" />
                Выйти
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
                Вход
              </Link>
              <Link href="/register" className={buttonVariants({ size: "sm" })}>
                Регистрация
              </Link>
            </>
          )}
        </div>

        <button
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-border md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Меню"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-white/5 md:hidden"
          >
            <div className="container flex flex-col gap-2 py-4">
              {user ? (
                <>
                  <div className="flex items-center justify-between rounded-lg bg-white/5 px-3 py-2">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium">{user.fullName}</span>
                      <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                    <Badge variant={user.role === "ADMIN" ? "data" : "default"}>
                      {roleLabel(user.role)}
                    </Badge>
                  </div>
                  {NAV.map((item) => (
                    <MobileLink key={item.href} href={item.href} onNavigate={() => setOpen(false)}>
                      <item.icon className="h-4 w-4" />
                      {item.label}
                    </MobileLink>
                  ))}
                  <Button variant="outline" onClick={logout} disabled={loading} className="mt-1">
                    <LogOut className="h-4 w-4" />
                    Выйти
                  </Button>
                </>
              ) : (
                <>
                  <MobileLink href="/incidents" onNavigate={() => setOpen(false)}>
                    <ShieldAlert className="h-4 w-4" />
                    Инциденты
                  </MobileLink>
                  <MobileLink href="/login" onNavigate={() => setOpen(false)}>
                    Вход
                  </MobileLink>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className={buttonVariants()}
                  >
                    Регистрация
                  </Link>
                </>
              )}
              <div className="pt-2">
                <GithubStarButton className="w-full justify-center" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function MobileLink({
  href,
  children,
  onNavigate,
  className,
}: {
  href: string;
  children: React.ReactNode;
  onNavigate?: () => void;
  className?: string;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "inline-flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-white/5",
        className,
      )}
    >
      {children}
    </Link>
  );
}
