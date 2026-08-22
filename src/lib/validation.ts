import { z } from "zod";
import { ROLES } from "./roles";
import { NODE_KINDS, STEP_OUTCOMES } from "./scenarios";

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

// --- Редактор схем (пользовательский конструктор администратора) ---

const schemeNodeSchema = z.object({
  key: z.string().min(1, "Пустой идентификатор узла.").max(40),
  label: z
    .string()
    .trim()
    .min(1, "Укажите название узла.")
    .max(60, "Название узла слишком длинное."),
  kind: z.enum(NODE_KINDS as [string, ...string[]], {
    errorMap: () => ({ message: "Недопустимый тип узла." }),
  }),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
});

const schemeStepSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Укажите название шага.")
    .max(120, "Название шага слишком длинное."),
  description: z.string().max(1000, "Описание шага слишком длинное.").default(""),
  from: z.string().min(1, "Не выбран узел-источник."),
  to: z.string().min(1, "Не выбран узел-приёмник."),
  packetLabel: z
    .string()
    .trim()
    .min(1, "Укажите подпись пакета.")
    .max(60, "Подпись пакета слишком длинная."),
  outcome: z.enum(STEP_OUTCOMES as [string, ...string[]], {
    errorMap: () => ({ message: "Недопустимый исход шага." }),
  }),
  method: z.string().trim().max(10, "Слишком длинный метод.").default(""),
  requestBody: z.string().max(2000, "Тело запроса слишком длинное.").default(""),
  responseBody: z.string().max(2000, "Ответ слишком длинный.").default(""),
});

export const schemeSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(2, "Название схемы должно содержать минимум 2 символа.")
      .max(80, "Название схемы слишком длинное."),
    category: z
      .string()
      .trim()
      .min(2, "Укажите категорию.")
      .max(40, "Название категории слишком длинное."),
    difficulty: z.enum(["Базовый", "Средний", "Продвинутый"], {
      errorMap: () => ({ message: "Недопустимый уровень сложности." }),
    }),
    summary: z
      .string()
      .trim()
      .min(2, "Добавьте краткое описание схемы.")
      .max(400, "Описание слишком длинное."),
    estimatedMin: z
      .number({ invalid_type_error: "Длительность должна быть числом." })
      .int()
      .min(1, "Длительность должна быть не меньше 1 минуты.")
      .max(600, "Слишком большая длительность."),
    finalStatus: z.enum(["defended", "exploited"], {
      errorMap: () => ({ message: "Недопустимый итоговый статус." }),
    }),
    finalTitle: z.string().trim().min(1, "Укажите заголовок итога.").max(120),
    finalDescription: z.string().max(1000, "Итоговое описание слишком длинное.").default(""),
    mitigations: z
      .array(z.string().trim().min(1).max(200))
      .max(20, "Слишком много рекомендаций.")
      .default([]),
    nodes: z
      .array(schemeNodeSchema)
      .min(1, "Добавьте хотя бы один узел.")
      .max(24, "Слишком много узлов (максимум 24)."),
    steps: z
      .array(schemeStepSchema)
      .min(1, "Добавьте хотя бы один шаг.")
      .max(40, "Слишком много шагов (максимум 40)."),
  })
  .superRefine((data, ctx) => {
    const keys = data.nodes.map((n) => n.key);
    if (new Set(keys).size !== keys.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["nodes"],
        message: "Идентификаторы узлов должны быть уникальными.",
      });
    }
    const keySet = new Set(keys);
    data.steps.forEach((step, i) => {
      if (!keySet.has(step.from)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["steps", i, "from"],
          message: "Шаг ссылается на несуществующий узел-источник.",
        });
      }
      if (!keySet.has(step.to)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["steps", i, "to"],
          message: "Шаг ссылается на несуществующий узел-приёмник.",
        });
      }
    });
  });

export type SchemeInput = z.infer<typeof schemeSchema>;

/** Преобразует ZodError в компактный словарь {поле: сообщение} на русском. */
export function formatZodError(error: z.ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    if (!fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fieldErrors;
}
