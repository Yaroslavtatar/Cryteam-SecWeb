"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Users,
  ScrollText,
  Ban,
  CheckCircle2,
  RefreshCw,
  Crown,
  GraduationCap,
  Loader2,
  AlertTriangle,
  ShieldQuestion,
  Workflow,
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { apiFetch } from "@/lib/client";
import { formatDateTime } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  isBlocked: boolean;
  createdAt: string;
  _count: { progress: number };
}

interface AdminLog {
  id: string;
  createdAt: string;
  action: string;
  severity: string;
  message: string;
  ip: string | null;
  targetEmail: string | null;
  user: { email: string } | null;
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN_SUCCESS: "Успешный вход",
  LOGIN_FAILED: "Неудачный вход",
  LOGIN_BLOCKED: "Вход в заблокированный аккаунт",
  REGISTER: "Регистрация",
  LOGOUT: "Выход",
  TOKEN_REFRESH: "Обновление сессии",
  ROLE_CHANGED: "Изменение роли",
  USER_BLOCKED: "Блокировка пользователя",
  USER_UNBLOCKED: "Разблокировка пользователя",
  RATE_LIMITED: "Превышение лимита запросов",
  CSRF_REJECTED: "Отклонён CSRF-токен",
  ACCESS_DENIED: "Отказано в доступе",
  ADMIN_GATE_HIT: "Открыта админ-панель",
};

const SEVERITY_VARIANT: Record<string, "neutral" | "warning" | "attack"> = {
  info: "neutral",
  warning: "warning",
  critical: "attack",
};

const SEVERITY_LABEL: Record<string, string> = {
  info: "Инфо",
  warning: "Внимание",
  critical: "Критично",
};

type Tab = "users" | "audit";

export function AdminPanel({
  gate,
  currentUserId,
  initialUsers,
  initialLogs,
}: {
  gate: string;
  currentUserId: string;
  initialUsers: AdminUser[];
  initialLogs: AdminLog[];
}) {
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminUser[]>(initialUsers);
  const [logs, setLogs] = useState<AdminLog[]>(initialLogs);
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refreshUsers = useCallback(async () => {
    const res = await apiFetch<{ users: AdminUser[] }>("/api/admin/users");
    if (res.ok && res.data) setUsers(res.data.users);
  }, []);

  const refreshLogs = useCallback(
    async (severity = severityFilter) => {
      setRefreshing(true);
      const query = severity !== "all" ? `?severity=${severity}` : "";
      const res = await apiFetch<{ logs: AdminLog[] }>(`/api/admin/audit${query}`);
      if (res.ok && res.data) setLogs(res.data.logs);
      setRefreshing(false);
    },
    [severityFilter],
  );

  async function changeRole(user: AdminUser, role: string) {
    if (user.role === role) return;
    setBusyId(user.id);
    setError(null);
    const res = await apiFetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    });
    if (!res.ok) setError(res.error ?? "Не удалось изменить роль.");
    else await refreshUsers();
    setBusyId(null);
  }

  async function toggleBlock(user: AdminUser) {
    setBusyId(user.id);
    setError(null);
    const res = await apiFetch(`/api/admin/users/${user.id}`, {
      method: "PATCH",
      body: JSON.stringify({ isBlocked: !user.isBlocked }),
    });
    if (!res.ok) setError(res.error ?? "Не удалось изменить статус блокировки.");
    else await refreshUsers();
    setBusyId(null);
  }

  const filteredLogs =
    severityFilter === "all"
      ? logs
      : logs.filter((l) => l.severity === severityFilter);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
            <ShieldQuestion className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight">
                Панель администратора
              </h1>
              <Badge variant="data">Скрытый маршрут</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Управление пользователями и мониторинг событий безопасности.
            </p>
          </div>
        </div>
        <Link href={`/panel/${gate}/editor`} className={buttonVariants({ variant: "secondary" })}>
          <Workflow className="h-4 w-4" />
          Конструктор схем (редактор)
        </Link>
      </div>

      {/* Вкладки */}
      <div className="flex gap-2 border-b border-white/5">
        <TabButton active={tab === "users"} onClick={() => setTab("users")} icon={Users}>
          Пользователи ({users.length})
        </TabButton>
        <TabButton active={tab === "audit"} onClick={() => setTab("audit")} icon={ScrollText}>
          Журнал аудита
        </TabButton>
      </div>

      {error && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {tab === "users" ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong overflow-hidden rounded-xl"
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Пользователь</th>
                  <th className="px-4 py-3 font-medium">Роль</th>
                  <th className="px-4 py-3 font-medium">Статус</th>
                  <th className="px-4 py-3 font-medium">Прогресс</th>
                  <th className="px-4 py-3 font-medium">Регистрация</th>
                  <th className="px-4 py-3 text-right font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => {
                  const isSelf = u.id === currentUserId;
                  const busy = busyId === u.id;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">
                          {u.fullName}
                          {isSelf && (
                            <span className="ml-2 text-xs text-muted-foreground">
                              (вы)
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {u.email}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex overflow-hidden rounded-lg border border-border">
                          <RolePill
                            active={u.role === "ADMIN"}
                            onClick={() => changeRole(u, "ADMIN")}
                            disabled={busy}
                            icon={Crown}
                            label="Админ"
                          />
                          <RolePill
                            active={u.role === "STUDENT"}
                            onClick={() => changeRole(u, "STUDENT")}
                            disabled={busy || isSelf}
                            icon={GraduationCap}
                            label="Ученик"
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {u.isBlocked ? (
                          <Badge variant="attack">
                            <Ban className="h-3 w-3" />
                            Заблокирован
                          </Badge>
                        ) : (
                          <Badge variant="defense">
                            <CheckCircle2 className="h-3 w-3" />
                            Активен
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-muted-foreground">
                        {u._count.progress}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateTime(u.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant={u.isBlocked ? "outline" : "destructive"}
                          size="sm"
                          onClick={() => toggleBlock(u)}
                          disabled={busy || isSelf}
                        >
                          {busy ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : u.isBlocked ? (
                            <CheckCircle2 className="h-4 w-4" />
                          ) : (
                            <Ban className="h-4 w-4" />
                          )}
                          {u.isBlocked ? "Разблокировать" : "Заблокировать"}
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {["all", "info", "warning", "critical"].map((sev) => (
                <button
                  key={sev}
                  onClick={() => {
                    setSeverityFilter(sev);
                    void refreshLogs(sev);
                  }}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-xs font-medium transition-all",
                    severityFilter === sev
                      ? "border-primary/50 bg-primary/15 text-primary"
                      : "border-border bg-white/[0.03] text-muted-foreground hover:text-foreground",
                  )}
                >
                  {sev === "all" ? "Все" : SEVERITY_LABEL[sev]}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={() => refreshLogs()} disabled={refreshing}>
              <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
              Обновить
            </Button>
          </div>

          <div className="glass-strong overflow-hidden rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-sm">
                <thead>
                  <tr className="border-b border-white/5 text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Время</th>
                    <th className="px-4 py-3 font-medium">Событие</th>
                    <th className="px-4 py-3 font-medium">Уровень</th>
                    <th className="px-4 py-3 font-medium">Описание</th>
                    <th className="px-4 py-3 font-medium">IP</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => (
                    <tr
                      key={log.id}
                      className="border-b border-white/5 last:border-0 hover:bg-white/[0.02]"
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                        {formatDateTime(log.createdAt)}
                      </td>
                      <td className="px-4 py-3 font-medium">
                        {ACTION_LABELS[log.action] ?? log.action}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={SEVERITY_VARIANT[log.severity] ?? "neutral"}>
                          {SEVERITY_LABEL[log.severity] ?? log.severity}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {log.message}
                        {log.targetEmail && (
                          <span className="ml-1 font-mono text-xs">
                            [{log.targetEmail}]
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-muted-foreground">
                        {log.ip ?? "—"}
                      </td>
                    </tr>
                  ))}
                  {filteredLogs.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
                        Событий не найдено.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Users;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition-colors",
        active
          ? "border-primary text-primary"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
      {children}
    </button>
  );
}

function RolePill({
  active,
  onClick,
  disabled,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
  icon: typeof Crown;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-primary/20 text-primary"
          : "bg-transparent text-muted-foreground hover:bg-white/5",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}
