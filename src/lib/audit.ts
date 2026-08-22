import { prisma } from "./db";

// Запись событий в журнал аудита безопасности.

export type AuditSeverity = "info" | "warning" | "critical";

export interface AuditInput {
  action: string;
  message: string;
  severity?: AuditSeverity;
  userId?: string | null;
  targetEmail?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}

export async function writeAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        action: input.action,
        message: input.message,
        severity: input.severity ?? "info",
        userId: input.userId ?? null,
        targetEmail: input.targetEmail ?? null,
        ip: input.ip ?? null,
        userAgent: input.userAgent ?? null,
      },
    });
  } catch (error) {
    // Журналирование не должно ломать основной поток запроса.
    console.error("Не удалось записать событие аудита:", error);
  }
}

// Стабильные коды действий для журнала.
export const AUDIT = {
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGIN_FAILED: "LOGIN_FAILED",
  LOGIN_BLOCKED: "LOGIN_BLOCKED",
  REGISTER: "REGISTER",
  LOGOUT: "LOGOUT",
  TOKEN_REFRESH: "TOKEN_REFRESH",
  ROLE_CHANGED: "ROLE_CHANGED",
  USER_BLOCKED: "USER_BLOCKED",
  USER_UNBLOCKED: "USER_UNBLOCKED",
  RATE_LIMITED: "RATE_LIMITED",
  CSRF_REJECTED: "CSRF_REJECTED",
  ACCESS_DENIED: "ACCESS_DENIED",
  ADMIN_GATE_HIT: "ADMIN_GATE_HIT",
} as const;
