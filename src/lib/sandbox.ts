// ============================================================
//  CRYTEAM SecWeb — движок песочницы.
//  Безопасная УЧЕБНАЯ симуляция: реальных уязвимостей нет, ответы
//  вычисляются детерминированно по шаблонам запроса. Позволяет
//  «взломать» учебный сайт через GET/POST и увидеть, как защита
//  меняет исход.
// ============================================================

export type Method = "GET" | "POST";
export type Verdict = "success" | "blocked" | "info";

export interface SandboxRequest {
  method: Method;
  path: string;
  body: string;
}

export interface SandboxResult {
  status: number;
  verdict: Verdict;
  response: string;
  explanation: string;
}

export interface Challenge {
  key: string;
  title: string;
  category: string;
  difficulty: "Базовый" | "Средний" | "Продвинутый";
  brief: string;
  goal: string;
  method: Method;
  defaultPath: string;
  defaultBody: string;
  hint: string;
  mitigations: string[];
  evaluate: (req: SandboxRequest, protectionOn: boolean) => SandboxResult;
}

// --- Вспомогательные функции ---

export function getQueryParam(path: string, name: string): string | null {
  const q = path.split("?")[1];
  if (!q) return null;
  for (const pair of q.split("&")) {
    const [k, v = ""] = pair.split("=");
    if (decodeURIComponent(k) === name) return decodeURIComponent(v);
  }
  return null;
}

function extractField(body: string, field: string): string | null {
  // Пытаемся распарсить JSON, иначе ищем field=value.
  try {
    const obj = JSON.parse(body);
    if (obj && typeof obj === "object" && field in obj) {
      return String((obj as Record<string, unknown>)[field] ?? "");
    }
  } catch {
    /* не JSON */
  }
  const m = body.match(new RegExp(`${field}\\s*[=:]\\s*"?([^"&\\n]*)`, "i"));
  return m ? m[1].trim() : null;
}

const SQLI_PATTERN = /('|%27)?\s*(or|или)\s+('?\d'?\s*=\s*'?\d|1\s*=\s*1)|--|;--|' or '|"\s*or\s*"/i;
const XSS_PATTERN = /<\s*script|onerror\s*=|<\s*img|<\s*svg|javascript:/i;

// --- Учебные задания ---

export const challenges: Challenge[] = [
  {
    key: "sqli-login",
    title: "Обход входа через SQL-инъекцию",
    category: "Веб-атаки",
    difficulty: "Средний",
    brief:
      "Учебная форма входа отправляет логин и пароль на /api/login. Поле пароля подставляется в SQL-запрос напрямую.",
    goal: "Войдите как admin, НЕ зная пароля — с помощью SQL-инъекции в поле password.",
    method: "POST",
    defaultPath: "/api/login",
    defaultBody: '{"username":"admin","password":"123456"}',
    hint: "Попробуйте значение пароля:  ' OR '1'='1",
    mitigations: [
      "Используйте параметризованные запросы / подготовленные выражения.",
      "Валидируйте и экранируйте пользовательский ввод.",
      "Ограничьте права учётной записи БД.",
    ],
    evaluate: (req, protectionOn) => {
      const password = extractField(req.body, "password") ?? "";
      const username = extractField(req.body, "username") ?? "";
      const isInjection = SQLI_PATTERN.test(password) || SQLI_PATTERN.test(username);

      if (isInjection && !protectionOn) {
        return {
          status: 200,
          verdict: "success",
          response:
            'HTTP 200 OK\n{"ok":true,"user":"admin","token":"eyJhbGciOi..."}',
          explanation:
            "Инъекция сработала: условие ' OR '1'='1' сделало WHERE всегда истинным, и сервер вернул первую учётную запись (admin). Аутентификация обойдена.",
        };
      }
      if (isInjection && protectionOn) {
        return {
          status: 401,
          verdict: "blocked",
          response: 'HTTP 401 Unauthorized\n{"ok":false,"error":"Неверные учётные данные"}',
          explanation:
            "Защита включена: пароль передан как ПАРАМЕТР (?), а не как часть SQL. Строка воспринята как данные — инъекция невозможна.",
        };
      }
      return {
        status: 401,
        verdict: "info",
        response: 'HTTP 401 Unauthorized\n{"ok":false,"error":"Неверные учётные данные"}',
        explanation: "Обычная неудачная попытка входа. Попробуйте инъекцию в поле password.",
      };
    },
  },
  {
    key: "idor-account",
    title: "Доступ к чужому аккаунту (IDOR)",
    category: "Авторизация",
    difficulty: "Базовый",
    brief:
      "Эндпоинт /api/account?id=… возвращает данные аккаунта по идентификатору. Ваш id = 1001.",
    goal: "Получите данные ЧУЖОГО аккаунта, изменив параметр id (например, 1002).",
    method: "GET",
    defaultPath: "/api/account?id=1001",
    defaultBody: "",
    hint: "Измените id в пути на 1002 и отправьте GET-запрос.",
    mitigations: [
      "Проверяйте владельца ресурса на сервере (id из сессии, а не из запроса).",
      "Используйте непредсказуемые идентификаторы (UUID) вместо последовательных.",
      "Применяйте политику доступа на уровне объектов.",
    ],
    evaluate: (req, protectionOn) => {
      const id = getQueryParam(req.path, "id") ?? "1001";
      const isOther = id !== "1001";
      if (isOther && !protectionOn) {
        return {
          status: 200,
          verdict: "success",
          response: `HTTP 200 OK\n{"id":${id},"name":"Мария Соколова","balance":"142 300 ₽","email":"maria@corp.local"}`,
          explanation:
            "IDOR: сервер вернул данные чужого аккаунта, потому что не проверил, что запрошенный id принадлежит вам.",
        };
      }
      if (isOther && protectionOn) {
        return {
          status: 403,
          verdict: "blocked",
          response: 'HTTP 403 Forbidden\n{"error":"Доступ к чужому ресурсу запрещён"}',
          explanation:
            "Защита: сервер сверил id из запроса с id из сессии. Чужой аккаунт недоступен.",
        };
      }
      return {
        status: 200,
        verdict: "info",
        response: `HTTP 200 OK\n{"id":1001,"name":"Иван Петров","balance":"5 400 ₽"}`,
        explanation: "Это ваш собственный аккаунт. Попробуйте запросить чужой id.",
      };
    },
  },
  {
    key: "xss-search",
    title: "Отражённый XSS в поиске",
    category: "Веб-атаки",
    difficulty: "Средний",
    brief:
      "Страница поиска /search?q=… выводит запрос обратно на страницу без обработки.",
    goal: "Добейтесь «выполнения» скрипта, передав XSS-нагрузку в параметр q.",
    method: "GET",
    defaultPath: "/search?q=телефон",
    defaultBody: "",
    hint: "Попробуйте q=<script>alert(1)</script>",
    mitigations: [
      "Экранируйте вывод по контексту (HTML/JS/атрибут).",
      "Внедрите Content-Security-Policy (script-src 'self').",
      "Санитизируйте пользовательский ввод доверенной библиотекой.",
    ],
    evaluate: (req, protectionOn) => {
      const q = getQueryParam(req.path, "q") ?? "";
      const isXss = XSS_PATTERN.test(q);
      if (isXss && !protectionOn) {
        return {
          status: 200,
          verdict: "success",
          response: `HTTP 200 OK\n<div class="results">Вы искали: ${q}</div>\n⚠ Браузер выполнил внедрённый скрипт (alert).`,
          explanation:
            "Отражённый XSS: сервер вставил ваш ввод в HTML без экранирования, и браузер исполнил <script>.",
        };
      }
      if (isXss && protectionOn) {
        const escaped = q
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        return {
          status: 200,
          verdict: "blocked",
          response: `HTTP 200 OK\n<div class="results">Вы искали: ${escaped}</div>\nСкрипт не выполнен (экранировано + CSP).`,
          explanation:
            "Защита: спецсимволы экранированы (< → &lt;), а CSP запрещает инлайн-скрипты. XSS не срабатывает.",
        };
      }
      return {
        status: 200,
        verdict: "info",
        response: `HTTP 200 OK\n<div class="results">Вы искали: ${q}</div>`,
        explanation: "Обычный поиск. Попробуйте передать <script> в параметр q.",
      };
    },
  },
];

export function getChallenge(key: string): Challenge | undefined {
  return challenges.find((c) => c.key === key);
}
