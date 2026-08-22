import { z } from "zod";
import { ROLES } from "./roles";

// Все сообщения об ошибках валидации — на русском языке.

const emailSchema = z
  .string({ required_error: "Укажите адрес электронной почты." })
  .trim()
  .min(1, "Укажите адрес электронной почты.")
  .max(254, "Адрес электронной почты слишком длинный.")
  .email("Некорректный адрес электронной почты.")
  .toLowerCase();

// Требования к сложности пароля.
const passwordSchema = z
  .string({ required_error: "Введите пароль." })
  .min(8, "Пароль должен содержать минимум 8 символов.")
  .max(72, "Пароль не должен превышать 72 символа.")
  .regex(/[a-zа-я]/, "Пароль должен содержать хотя бы одну строчную букву.")
  .regex(/[A-ZА-Я]/, "Пароль должен содержать хотя бы одну заглавную букву.")
  .regex(/[0-9]/, "Пароль должен содержать хотя бы одну цифру.")
  .regex(
    /[^A-Za-zА-Яа-я0-9]/,
    "Пароль должен содержать хотя бы один специальный символ.",
  );

export const registerSchema = z.object({
  fullName: z
    .string({ required_error: "Укажите ФИО или никнейм." })
    .trim()
    .min(2, "ФИО/никнейм должно содержать минимум 2 символа.")
    .max(80, "ФИО/никнейм слишком длинное."),
  email: emailSchema,
  password: passwordSchema,
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string({ required_error: "Введите пароль." })
    .min(1, "Введите пароль."),
});

export const updateRoleSchema = z.object({
  role: z.enum([ROLES.ADMIN, ROLES.STUDENT], {
    errorMap: () => ({ message: "Недопустимая роль. Допустимо: ADMIN или STUDENT." }),
  }),
});

export const toggleBlockSchema = z.object({
  isBlocked: z.boolean({
    required_error: "Не передан признак блокировки.",
    invalid_type_error: "Признак блокировки должен быть логическим значением.",
  }),
});

export const progressSchema = z.object({
  moduleId: z.string({ required_error: "Не указан модуль." }).min(1, "Не указан модуль."),
  lastStep: z
    .number({ invalid_type_error: "Шаг должен быть числом." })
    .int("Шаг должен быть целым числом.")
    .min(0, "Шаг не может быть отрицательным."),
  status: z.enum(["in_progress", "completed"], {
    errorMap: () => ({ message: "Недопустимый статус прогресса." }),
  }),
});

/** Преобразует ZodError в компактный словарь {поле: сообщение} на русском. */
export function formatZodError(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
