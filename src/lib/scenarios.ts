// ============================================================
//  CRYTEAM SecWeb — интерактивные сценарии кибербезопасности.
//  Единый источник правды: используется и в seed БД, и во фронтенде
//  (интерактивный конструктор схем). Все тексты — на русском языке.
// ============================================================

export type NodeKind =
  | "attacker"
  | "client"
  | "victim"
  | "waf"
  | "server"
  | "db"
  | "store"
  | "mitm"
  | "idp"
  | "app"
  | "api"
  | "edge";

/** Исход шага влияет на цвет пакета и подсветку узла назначения. */
export type StepOutcome = "info" | "blocked" | "exploited" | "success";

export interface SchemeNode {
  id: string;
  label: string;
  kind: NodeKind;
  /** Координаты в процентах (0..100) для адаптивного размещения на полотне. */
  x: number;
  y: number;
}

export interface SchemeStepData {
  order: number;
  title: string;
  description: string;
  from: string;
  to: string;
  packetLabel: string;
  outcome: StepOutcome;
}

export interface Scenario {
  key: string;
  slug: string;
  title: string;
  category: string;
  difficulty: "Базовый" | "Средний" | "Продвинутый";
  summary: string;
  estimatedMin: number;
  order: number;
  nodes: SchemeNode[];
  steps: SchemeStepData[];
  final: {
    status: "defended" | "exploited";
    title: string;
    description: string;
  };
}

export const scenarios: Scenario[] = [
  {
    key: "sql-injection",
    slug: "sql-inekciya",
    title: "SQL-инъекция",
    category: "Веб-атаки",
    difficulty: "Средний",
    estimatedMin: 15,
    order: 1,
    summary:
      "Как злоумышленник пытается обойти аутентификацию через подстановку SQL, и как WAF вместе с параметризованными запросами останавливают атаку.",
    nodes: [
      { id: "attacker", label: "Злоумышленник", kind: "attacker", x: 8, y: 50 },
      { id: "waf", label: "WAF", kind: "waf", x: 36, y: 50 },
      { id: "server", label: "Веб-сервер", kind: "server", x: 64, y: 50 },
      { id: "db", label: "База данных", kind: "db", x: 92, y: 50 },
    ],
    steps: [
      {
        order: 1,
        title: "Внедрение SQL-инъекции",
        description:
          "Злоумышленник вводит в поле входа полезную нагрузку ' OR '1'='1' -- , пытаясь обойти проверку пароля.",
        from: "attacker",
        to: "waf",
        packetLabel: "' OR 1=1 --",
        outcome: "info",
      },
      {
        order: 2,
        title: "WAF анализирует запрос",
        description:
          "Web Application Firewall сверяет запрос с базой сигнатур и распознаёт классический паттерн SQL-инъекции.",
        from: "waf",
        to: "attacker",
        packetLabel: "Сигнатура найдена",
        outcome: "blocked",
      },
      {
        order: 3,
        title: "Попытка обфускации",
        description:
          "Злоумышленник кодирует нагрузку в URL-encoding, пытаясь обойти сигнатурный фильтр WAF.",
        from: "attacker",
        to: "waf",
        packetLabel: "%27%20OR%201=1",
        outcome: "info",
      },
      {
        order: 4,
        title: "Запрос доходит до сервера",
        description:
          "Обфусцированная строка проходит WAF, но серверный код построен на параметризованных запросах.",
        from: "waf",
        to: "server",
        packetLabel: "нормализованный ввод",
        outcome: "info",
      },
      {
        order: 5,
        title: "Параметризованный запрос",
        description:
          "База данных получает пользовательский ввод как ДАННЫЕ (параметр ?), а не как исполняемый код — инъекция невозможна.",
        from: "server",
        to: "db",
        packetLabel: "WHERE id = ?",
        outcome: "blocked",
      },
    ],
    final: {
      status: "defended",
      title: "Атака успешно заблокирована",
      description:
        "Комбинация WAF (сигнатурный анализ) и параметризованных запросов на сервере полностью нейтрализовала SQL-инъекцию.",
    },
  },
  {
    key: "xss",
    slug: "xss-mezhsaytovyy-skripting",
    title: "XSS (межсайтовый скриптинг)",
    category: "Веб-атаки",
    difficulty: "Средний",
    estimatedMin: 15,
    order: 2,
    summary:
      "Хранимая XSS-атака: злоумышленник внедряет скрипт в контент. Экранирование вывода и Content-Security-Policy защищают браузер жертвы.",
    nodes: [
      { id: "attacker", label: "Злоумышленник", kind: "attacker", x: 8, y: 55 },
      { id: "server", label: "Веб-приложение", kind: "server", x: 42, y: 55 },
      { id: "store", label: "Хранилище", kind: "store", x: 42, y: 14 },
      { id: "victim", label: "Браузер жертвы", kind: "victim", x: 90, y: 55 },
    ],
    steps: [
      {
        order: 1,
        title: "Внедрение вредоносного скрипта",
        description:
          "Злоумышленник оставляет комментарий с полезной нагрузкой <script>steal(cookie)</script>.",
        from: "attacker",
        to: "server",
        packetLabel: "<script>…</script>",
        outcome: "info",
      },
      {
        order: 2,
        title: "Сохранение с экранированием",
        description:
          "Приложение сохраняет комментарий, экранируя спецсимволы: < превращается в &lt;.",
        from: "server",
        to: "store",
        packetLabel: "&lt;script&gt;",
        outcome: "info",
      },
      {
        order: 3,
        title: "Другой пользователь открывает страницу",
        description:
          "Жертва запрашивает страницу с комментариями, содержащими сохранённую нагрузку.",
        from: "store",
        to: "server",
        packetLabel: "GET /comments",
        outcome: "info",
      },
      {
        order: 4,
        title: "CSP блокирует исполнение",
        description:
          "Браузер получает экранированный текст, а Content-Security-Policy запрещает инлайн-скрипты — код не выполняется.",
        from: "server",
        to: "victim",
        packetLabel: "CSP: script-src 'self'",
        outcome: "blocked",
      },
    ],
    final: {
      status: "defended",
      title: "Атака успешно заблокирована",
      description:
        "Экранирование вывода и строгая политика CSP не позволили вредоносному скрипту выполниться в браузере жертвы.",
    },
  },
  {
    key: "mitm",
    slug: "man-in-the-middle",
    title: "Man-in-the-Middle",
    category: "Сеть",
    difficulty: "Продвинутый",
    estimatedMin: 20,
    order: 3,
    summary:
      "Атака «человек посередине»: перехват канала и подмена сертификата. Проверка цепочки доверия TLS и HSTS срывают перехват.",
    nodes: [
      { id: "client", label: "Клиент", kind: "client", x: 8, y: 60 },
      { id: "mitm", label: "Перехватчик", kind: "mitm", x: 48, y: 16 },
      { id: "server", label: "Сервер", kind: "server", x: 90, y: 60 },
    ],
    steps: [
      {
        order: 1,
        title: "Инициация защищённого соединения",
        description:
          "Клиент начинает TLS-рукопожатие с сервером, отправляя сообщение ClientHello.",
        from: "client",
        to: "server",
        packetLabel: "ClientHello",
        outcome: "info",
      },
      {
        order: 2,
        title: "Попытка перехвата",
        description:
          "Перехватчик в той же сети пытается вклиниться и подсунуть клиенту поддельный сертификат.",
        from: "mitm",
        to: "client",
        packetLabel: "Поддельный сертификат",
        outcome: "exploited",
      },
      {
        order: 3,
        title: "Проверка цепочки доверия",
        description:
          "Клиент проверяет сертификат по доверенным центрам сертификации (CA) и журналам Certificate Transparency.",
        from: "client",
        to: "server",
        packetLabel: "Проверка CA + CT",
        outcome: "info",
      },
      {
        order: 4,
        title: "Установлен прямой шифрованный канал",
        description:
          "Поддельный сертификат не прошёл проверку. Благодаря HSTS клиент устанавливает TLS 1.3 напрямую с сервером.",
        from: "server",
        to: "client",
        packetLabel: "🔒 TLS 1.3",
        outcome: "success",
      },
    ],
    final: {
      status: "defended",
      title: "Перехват предотвращён",
      description:
        "Строгая проверка TLS-сертификата, Certificate Transparency и HSTS не позволили злоумышленнику расшифровать трафик.",
    },
  },
  {
    key: "oauth",
    slug: "oauth-avtorizaciya",
    title: "OAuth 2.0 + PKCE",
    category: "Авторизация",
    difficulty: "Средний",
    estimatedMin: 18,
    order: 4,
    summary:
      "Безопасный поток авторизации через внешнего провайдера с защитой PKCE, которая предотвращает перехват кода авторизации.",
    nodes: [
      { id: "client", label: "Пользователь", kind: "client", x: 6, y: 50 },
      { id: "app", label: "Приложение", kind: "app", x: 34, y: 50 },
      { id: "idp", label: "Провайдер (IdP)", kind: "idp", x: 64, y: 50 },
      { id: "api", label: "API ресурса", kind: "api", x: 93, y: 50 },
    ],
    steps: [
      {
        order: 1,
        title: "Запуск входа",
        description:
          "Пользователь нажимает «Войти через провайдера». Приложение генерирует code_verifier и его хеш code_challenge (PKCE).",
        from: "client",
        to: "app",
        packetLabel: "Войти →",
        outcome: "info",
      },
      {
        order: 2,
        title: "Редирект на провайдера",
        description:
          "Приложение перенаправляет пользователя к IdP, передавая code_challenge, но не сам секрет.",
        from: "app",
        to: "idp",
        packetLabel: "authorize + code_challenge",
        outcome: "info",
      },
      {
        order: 3,
        title: "Аутентификация и согласие",
        description:
          "Пользователь входит у провайдера и подтверждает запрошенные разрешения (scope).",
        from: "idp",
        to: "client",
        packetLabel: "Логин + согласие",
        outcome: "info",
      },
      {
        order: 4,
        title: "Возврат кода авторизации",
        description:
          "IdP возвращает одноразовый authorization code. Даже при перехвате он бесполезен без code_verifier.",
        from: "idp",
        to: "app",
        packetLabel: "?code=…",
        outcome: "info",
      },
      {
        order: 5,
        title: "Обмен кода на токен",
        description:
          "Приложение обменивает код на токен, предъявляя исходный code_verifier — доказательство владения (PKCE).",
        from: "app",
        to: "idp",
        packetLabel: "code + verifier",
        outcome: "info",
      },
      {
        order: 6,
        title: "Выдача access-токена",
        description:
          "Провайдер проверяет соответствие verifier ↔ challenge и выдаёт короткоживущий access-токен.",
        from: "idp",
        to: "app",
        packetLabel: "access_token",
        outcome: "success",
      },
      {
        order: 7,
        title: "Доступ к защищённому ресурсу",
        description:
          "Приложение обращается к API, предъявляя токен в заголовке Authorization: Bearer.",
        from: "app",
        to: "api",
        packetLabel: "Bearer <token>",
        outcome: "info",
      },
    ],
    final: {
      status: "defended",
      title: "Безопасная авторизация выполнена",
      description:
        "Механизм PKCE защитил поток OAuth 2.0: перехваченный код авторизации невозможно использовать без секрета code_verifier.",
    },
  },
  {
    key: "ddos",
    slug: "ddos-ataka",
    title: "DDoS-атака",
    category: "Сеть",
    difficulty: "Продвинутый",
    estimatedMin: 20,
    order: 5,
    summary:
      "Объёмная распределённая атака от ботнета и её смягчение: rate limiting, фильтрация аномалий и поглощение трафика на границе сети.",
    nodes: [
      { id: "attacker", label: "Ботнет", kind: "attacker", x: 8, y: 50 },
      { id: "edge", label: "Anti-DDoS / CDN", kind: "edge", x: 45, y: 50 },
      { id: "server", label: "Сервер", kind: "server", x: 90, y: 50 },
    ],
    steps: [
      {
        order: 1,
        title: "Запуск объёмной атаки",
        description:
          "Тысячи заражённых устройств одновременно шлют SYN-флуд, стремясь исчерпать ресурсы сервера.",
        from: "attacker",
        to: "edge",
        packetLabel: "SYN flood ×1 000 000/с",
        outcome: "exploited",
      },
      {
        order: 2,
        title: "Rate limiting и фильтрация",
        description:
          "Пограничный узел Anti-DDoS выявляет аномальные всплески и отбрасывает вредоносные пакеты (HTTP 429).",
        from: "edge",
        to: "attacker",
        packetLabel: "429 Too Many Requests",
        outcome: "blocked",
      },
      {
        order: 3,
        title: "Усиление атаки",
        description:
          "Злоумышленник переходит к DNS-амплификации, но распределённая ёмкость CDN поглощает всплеск.",
        from: "attacker",
        to: "edge",
        packetLabel: "DNS amplification",
        outcome: "blocked",
      },
      {
        order: 4,
        title: "Легитимный трафик проходит",
        description:
          "Отфильтрованный, «чистый» трафик реальных пользователей направляется к серверу.",
        from: "edge",
        to: "server",
        packetLabel: "трафик пользователей",
        outcome: "info",
      },
      {
        order: 5,
        title: "Сервис доступен",
        description:
          "Сервер остаётся стабильным и отвечает пользователям штатно — атака не достигла цели.",
        from: "server",
        to: "edge",
        packetLabel: "200 OK",
        outcome: "success",
      },
    ],
    final: {
      status: "defended",
      title: "Атака смягчена",
      description:
        "Rate limiting, поведенческая фильтрация и распределённое поглощение трафика CDN сохранили доступность сервиса.",
    },
  },
];

export function getScenario(key: string): Scenario | undefined {
  return scenarios.find((s) => s.key === key);
}
