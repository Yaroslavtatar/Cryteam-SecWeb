"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import {
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Loader2,
  AlertTriangle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { apiFetch } from "@/lib/client";

type Mode = "login" | "register";

const PASSWORD_RULES = [
  { test: (v: string) => v.length >= 8, label: "Минимум 8 символов" },
  { test: (v: string) => /[a-zа-я]/.test(v), label: "Строчная буква" },
  { test: (v: string) => /[A-ZА-Я]/.test(v), label: "Заглавная буква" },
  { test: (v: string) => /[0-9]/.test(v), label: "Цифра" },
  { test: (v: string) => /[^A-Za-zА-Яа-я0-9]/.test(v), label: "Спецсимвол" },
];

export function AuthForm({ mode }: { mode: Mode }) {
  const router = useRouter();
  const params = useSearchParams();
  const isRegister = mode === "register";

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setFormError(null);
    setFieldErrors({});

    const url = isRegister ? "/api/auth/register" : "/api/auth/login";
    const body = isRegister
      ? { fullName, email, password }
      : { email, password };

    const res = await apiFetch<{ user: { role: string } }>(url, {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      setFieldErrors(res.fields ?? {});
      setFormError(res.error ?? "Произошла ошибка. Попробуйте ещё раз.");
      setLoading(false);
      return;
    }

    const next = params.get("next");
    router.push(next && next.startsWith("/") ? next : "/dashboard");
    router.refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="w-full max-w-md"
    >
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 grid h-12 w-12 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl">
            {isRegister ? "Создание аккаунта" : "Вход в систему"}
          </CardTitle>
          <CardDescription>
            {isRegister
              ? "Зарегистрируйтесь, чтобы получить доступ к обучающим модулям."
              : "Введите свои данные для доступа к платформе."}
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            {formError && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
              >
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {isRegister && (
              <Field
                id="fullName"
                label="ФИО или никнейм"
                icon={<UserIcon className="h-4 w-4" />}
                error={fieldErrors.fullName}
              >
                <Input
                  id="fullName"
                  className="pl-10"
                  placeholder="Иван Петров"
                  value={fullName}
                  autoComplete="name"
                  onChange={(e) => setFullName(e.target.value)}
                />
              </Field>
            )}

            <Field
              id="email"
              label="Электронная почта"
              icon={<Mail className="h-4 w-4" />}
              error={fieldErrors.email}
            >
              <Input
                id="email"
                type="email"
                className="pl-10"
                placeholder="you@example.com"
                value={email}
                autoComplete="email"
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field
              id="password"
              label="Пароль"
              icon={<Lock className="h-4 w-4" />}
              error={fieldErrors.password}
            >
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                className="pl-10 pr-10"
                placeholder="••••••••"
                value={password}
                autoComplete={isRegister ? "new-password" : "current-password"}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </Field>

            {isRegister && password.length > 0 && (
              <div className="grid grid-cols-2 gap-1.5 rounded-lg bg-white/[0.03] p-3">
                {PASSWORD_RULES.map((rule) => {
                  const ok = rule.test(password);
                  return (
                    <div
                      key={rule.label}
                      className={`flex items-center gap-1.5 text-xs ${ok ? "text-[hsl(var(--defense))]" : "text-muted-foreground"}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-[hsl(var(--defense))]" : "bg-muted-foreground/40"}`}
                      />
                      {rule.label}
                    </div>
                  );
                })}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isRegister ? "Зарегистрироваться" : "Войти"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            {isRegister ? "Уже есть аккаунт? " : "Ещё нет аккаунта? "}
            <Link
              href={isRegister ? "/login" : "/register"}
              className="font-medium text-primary hover:underline"
            >
              {isRegister ? "Войти" : "Зарегистрироваться"}
            </Link>
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function Field({
  id,
  label,
  icon,
  error,
  children,
}: {
  id: string;
  label: string;
  icon: React.ReactNode;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        {children}
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
