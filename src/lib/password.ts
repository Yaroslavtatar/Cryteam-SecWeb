import bcrypt from "bcryptjs";

// Хеширование паролей.
// Примечание по безопасности: спецификация допускает Argon2id или bcrypt.
// Здесь используется bcrypt (реализация bcryptjs) — не требует нативной
// сборки и стабилен в любой среде. Cost-фактор 12 — разумный баланс
// стойкости и производительности. Для перехода на Argon2id достаточно
// заменить реализацию этих двух функций.
const BCRYPT_COST = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_COST);
}

export async function verifyPassword(
  plain: string,
  hash: string,
): Promise<boolean> {
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}
