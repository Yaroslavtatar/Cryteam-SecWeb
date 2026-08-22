// Роли пользователей. SQLite в Prisma не поддерживает enum, поэтому
// значения контролируются здесь и в Zod-схемах.

export const ROLES = {
  ADMIN: "ADMIN",
  STUDENT: "STUDENT",
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_LABELS: Record<Role, string> = {
  ADMIN: "Администратор",
  STUDENT: "Ученик",
};

export function isRole(value: string): value is Role {
  return value === ROLES.ADMIN || value === ROLES.STUDENT;
}

export function roleLabel(value: string): string {
  return isRole(value) ? ROLE_LABELS[value] : value;
}
