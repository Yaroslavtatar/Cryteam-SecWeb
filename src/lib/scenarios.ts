// ============================================================
//  CRYTEAM SecWeb — интерактивные сценарии профилактики.
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
  | "edge"
  | "phishing"
  | "service"
  | "operator"
  | "bot"
  | "smartphone"
  | "tablet"
  | "laptop"
  | "desktop"
  | "router"
  | "smartwatch"
  | "iot"
  | "smarttv"
  | "printer"
  | "nas";

/** Исход шага влияет на цвет пакета и подсветку узла назначения. */
export type StepOutcome = "info" | "blocked" | "exploited" | "success";

/** Все допустимые типы узлов (для валидации и выпадающих списков). */
export const NODE_KINDS: NodeKind[] = [
  "attacker",
  "client",
  "victim",
  "waf",
  "server",
  "db",
  "store",
  "mitm",
  "idp",
  "app",
  "api",
  "edge",
  "phishing",
  "service",
  "operator",
  "bot",
  "smartphone",
  "tablet",
  "laptop",
  "desktop",
  "router",
  "smartwatch",
  "iot",
  "smarttv",
  "printer",
  "nas",
];

export const STEP_OUTCOMES: StepOutcome[] = [
  "info",
  "blocked",
  "exploited",
  "success",
];

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
  // Детализация уровня запроса (необязательно): показывается в плеере.
  method?: string;
  request?: string;
  response?: string;
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
  /** Практические рекомендации «как избегать / как защититься». */
  mitigations: string[];
}

export const CATEGORY_ORDER = [
  "Веб-атаки",
  "Сеть",
  "Авторизация",
  "Аккаунты и мессенджеры",
];

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
        method: "POST",
        request: 'POST /api/login\n{"username":"admin","password":"\' OR \'1\'=\'1"}',
        response: "HTTP 403 — WAF: запрос отклонён по сигнатуре",
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
        method: "SQL",
        request: "SELECT * FROM users WHERE login = ? AND pass = ?\n-- params: [\"admin\", \"' OR '1'='1\"]",
        response: "0 строк — учётные данные неверны (инъекция как данные)",
      },
    ],
    final: {
      status: "defended",
      title: "Атака успешно заблокирована",
      description:
        "Комбинация WAF (сигнатурный анализ) и параметризованных запросов на сервере полностью нейтрализовала SQL-инъекцию.",
    },
    mitigations: [
      "Используйте параметризованные запросы или ORM вместо конкатенации строк.",
      "Валидируйте и типизируйте пользовательский ввод.",
      "Ограничьте права учётной записи БД (принцип наименьших привилегий).",
      "Включите WAF с актуальными сигнатурами.",
      "Логируйте и отслеживайте аномальные запросы.",
    ],
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
    mitigations: [
      "Экранируйте вывод по контексту (HTML, атрибут, JS, URL).",
      "Внедрите строгую Content-Security-Policy.",
      "Ставьте флаги HttpOnly и SameSite на cookie.",
      "Санитизируйте пользовательский HTML доверенной библиотекой.",
      "Избегайте innerHTML и eval с недоверенными данными.",
    ],
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
    mitigations: [
      "Используйте только HTTPS/TLS и включите HSTS.",
      "Проверяйте сертификаты и цепочку доверия (при необходимости — пиннинг).",
      "Избегайте публичных Wi-Fi для важных операций или используйте VPN.",
      "Не игнорируйте предупреждения браузера о сертификатах.",
      "Применяйте мониторинг Certificate Transparency.",
    ],
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
    mitigations: [
      "Используйте PKCE для публичных клиентов.",
      "Строго проверяйте redirect_uri по белому списку.",
      "Применяйте параметр state против CSRF.",
      "Выдавайте короткоживущие access-токены и ротацию refresh.",
      "Храните токены безопасно (HttpOnly-cookie или защищённое хранилище).",
    ],
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
    mitigations: [
      "Подключите Anti-DDoS / CDN с фильтрацией трафика.",
      "Настройте rate limiting и лимиты соединений.",
      "Используйте автомасштабирование и запас ёмкости.",
      "Включите поведенческий анализ и гео-фильтрацию.",
      "Подготовьте план реагирования на инциденты.",
    ],
  },

  // ---------------------------------------------------------
  //  Аккаунты и мессенджеры — методы кражи аккаунтов
  // ---------------------------------------------------------
  {
    key: "phishing-max",
    slug: "fishing-max",
    title: "Фишинг сайта MAX",
    category: "Аккаунты и мессенджеры",
    difficulty: "Средний",
    estimatedMin: 12,
    order: 6,
    summary:
      "Кража аккаунта через поддельный сайт-двойник мессенджера MAX: жертва вводит логин и пароль на фишинговой странице, и данные утекают злоумышленнику.",
    nodes: [
      { id: "attacker", label: "Злоумышленник", kind: "attacker", x: 10, y: 18 },
      { id: "victim", label: "Жертва", kind: "victim", x: 10, y: 80 },
      { id: "fake", label: "Фишинг-сайт «MAX»", kind: "phishing", x: 48, y: 50 },
      { id: "real", label: "Настоящий MAX", kind: "service", x: 90, y: 50 },
    ],
    steps: [
      {
        order: 1,
        title: "Рассылка фишинговой ссылки",
        description:
          "Под видом акции или уведомления безопасности жертве присылают ссылку на сайт, визуально копирующий MAX (например max-login.ru вместо официального домена).",
        from: "attacker",
        to: "victim",
        packetLabel: "max-vhod-akcia.ru",
        outcome: "exploited",
      },
      {
        order: 2,
        title: "Ввод данных на поддельной странице",
        description:
          "Жертва переходит по ссылке и вводит логин и пароль, не заметив подмену доменного имени.",
        from: "victim",
        to: "fake",
        packetLabel: "логин + пароль",
        outcome: "exploited",
      },
      {
        order: 3,
        title: "Кража учётных данных",
        description:
          "Введённые данные мгновенно уходят на сервер злоумышленника.",
        from: "fake",
        to: "attacker",
        packetLabel: "credentials",
        outcome: "exploited",
      },
      {
        order: 4,
        title: "Вход в настоящий аккаунт",
        description:
          "Злоумышленник использует украденные данные для входа в реальный аккаунт MAX и получает контроль над перепиской.",
        from: "attacker",
        to: "real",
        packetLabel: "вход по паролю",
        outcome: "exploited",
      },
    ],
    final: {
      status: "exploited",
      title: "Аккаунт скомпрометирован",
      description:
        "Жертва ввела данные на поддельном сайте — это классический фишинг. Атаку можно было предотвратить простой проверкой домена и двухфакторной аутентификацией.",
    },
    mitigations: [
      "Проверяйте доменное имя в адресной строке перед вводом данных.",
      "Не переходите по ссылкам из писем и сообщений — открывайте сайт вручную или из закладок.",
      "Включите двухфакторную аутентификацию (2FA).",
      "Используйте менеджер паролей: он не подставит пароль на поддельном домене.",
      "Обращайте внимание на HTTPS и предупреждения браузера.",
    ],
  },
  {
    key: "tg-phishing",
    slug: "telegram-fishingovaya-stranica",
    title: "Telegram: фишинговая страница входа",
    category: "Аккаунты и мессенджеры",
    difficulty: "Средний",
    estimatedMin: 12,
    order: 7,
    summary:
      "Поддельная страница «входа в Telegram» (фейковое голосование, подарок, премиум) выманивает номер телефона и код подтверждения, после чего злоумышленник авторизуется в аккаунте.",
    nodes: [
      { id: "attacker", label: "Злоумышленник", kind: "attacker", x: 10, y: 18 },
      { id: "victim", label: "Жертва", kind: "victim", x: 10, y: 80 },
      { id: "fake", label: "Фейк «Telegram»", kind: "phishing", x: 48, y: 50 },
      { id: "tg", label: "Серверы Telegram", kind: "service", x: 90, y: 50 },
    ],
    steps: [
      {
        order: 1,
        title: "Ссылка на «вход в Telegram»",
        description:
          "Под предлогом голосования за ребёнка, подарка или премиума жертве присылают ссылку на поддельную страницу авторизации.",
        from: "attacker",
        to: "victim",
        packetLabel: "telegram-vote.fake",
        outcome: "exploited",
      },
      {
        order: 2,
        title: "Ввод номера и кода",
        description:
          "Жертва вводит номер телефона и пришедший код подтверждения на поддельной странице.",
        from: "victim",
        to: "fake",
        packetLabel: "номер + код",
        outcome: "exploited",
      },
      {
        order: 3,
        title: "Перехват кода",
        description:
          "Код мгновенно передаётся злоумышленнику, пока он ещё действителен.",
        from: "fake",
        to: "attacker",
        packetLabel: "OTP-код",
        outcome: "exploited",
      },
      {
        order: 4,
        title: "Авторизация чужой сессии",
        description:
          "Злоумышленник вводит перехваченный код и добавляет своё устройство в аккаунт жертвы.",
        from: "attacker",
        to: "tg",
        packetLabel: "новая сессия",
        outcome: "exploited",
      },
    ],
    final: {
      status: "exploited",
      title: "Аккаунт захвачен",
      description:
        "Код подтверждения был введён на стороннем сайте. Облачный пароль (2FA) и внимательность к домену полностью предотвратили бы захват.",
    },
    mitigations: [
      "Никому и никуда, кроме официального приложения, не вводите код из Telegram.",
      "Включите облачный пароль (2FA) в «Настройки → Конфиденциальность».",
      "Официальный веб-вход — только на web.telegram.org / telegram.org.",
      "Регулярно проверяйте «Устройства» и завершайте лишние сессии.",
      "Не доверяйте «голосованиям» и «подаркам» со срочным входом.",
    ],
  },
  {
    key: "tg-otp-social",
    slug: "telegram-krazha-koda",
    title: "Telegram: выманивание кода (соц. инженерия)",
    category: "Аккаунты и мессенджеры",
    difficulty: "Базовый",
    estimatedMin: 10,
    order: 8,
    summary:
      "Злоумышленник инициирует вход в чужой аккаунт, а затем под видом друга или «техподдержки» просит жертву продиктовать пришедший код подтверждения.",
    nodes: [
      { id: "attacker", label: "Лже-друг / «поддержка»", kind: "attacker", x: 12, y: 50 },
      { id: "victim", label: "Жертва", kind: "victim", x: 50, y: 50 },
      { id: "tg", label: "Telegram", kind: "service", x: 90, y: 50 },
    ],
    steps: [
      {
        order: 1,
        title: "Запрос кода на номер жертвы",
        description:
          "Злоумышленник инициирует вход в аккаунт жертвы — Telegram отправляет код подтверждения самой жертве.",
        from: "attacker",
        to: "tg",
        packetLabel: "Отправить код",
        outcome: "exploited",
      },
      {
        order: 2,
        title: "Просьба продиктовать код",
        description:
          "Под видом друга или сотрудника поддержки просит переслать «случайно пришедший» код.",
        from: "attacker",
        to: "victim",
        packetLabel: "«скинь код»",
        outcome: "exploited",
      },
      {
        order: 3,
        title: "Жертва пересылает код",
        description:
          "Доверяя собеседнику, жертва пересылает код подтверждения.",
        from: "victim",
        to: "attacker",
        packetLabel: "12345",
        outcome: "exploited",
      },
      {
        order: 4,
        title: "Вход в аккаунт",
        description:
          "Злоумышленник вводит полученный код и получает доступ к аккаунту.",
        from: "attacker",
        to: "tg",
        packetLabel: "код принят",
        outcome: "exploited",
      },
    ],
    final: {
      status: "exploited",
      title: "Код выдан — доступ получен",
      description:
        "Жертва сама передала код. Правило простое: код подтверждения — как пароль, его нельзя сообщать никому.",
    },
    mitigations: [
      "Код подтверждения — это пароль на вход. Не передавайте его никому.",
      "Telegram и настоящая поддержка НИКОГДА не просят код.",
      "Включите облачный пароль (2FA) — одного кода станет недостаточно.",
      "Если «друг» просит код — свяжитесь с ним другим способом: возможно, его взломали.",
      "Насторожитесь при любой срочности и давлении в переписке.",
    ],
  },
  {
    key: "tg-sim-swap",
    slug: "telegram-podmena-sim",
    title: "Telegram: подмена SIM (SIM-swap)",
    category: "Аккаунты и мессенджеры",
    difficulty: "Продвинутый",
    estimatedMin: 15,
    order: 9,
    summary:
      "Злоумышленник перевыпускает SIM-карту жертвы у оператора связи и перехватывает SMS с кодом входа, получая доступ к аккаунту без пароля.",
    nodes: [
      { id: "attacker", label: "Злоумышленник", kind: "attacker", x: 10, y: 20 },
      { id: "operator", label: "Оператор связи", kind: "operator", x: 48, y: 20 },
      { id: "victim", label: "SIM жертвы", kind: "victim", x: 10, y: 80 },
      { id: "tg", label: "Telegram", kind: "service", x: 90, y: 50 },
    ],
    steps: [
      {
        order: 1,
        title: "Социальная инженерия оператора",
        description:
          "Используя утёкшие данные или поддельные документы, злоумышленник убеждает оператора перевыпустить SIM жертвы на свою карту.",
        from: "attacker",
        to: "operator",
        packetLabel: "перевыпуск SIM",
        outcome: "exploited",
      },
      {
        order: 2,
        title: "SIM жертвы отключается",
        description:
          "Настоящая SIM-карта жертвы теряет сеть — номер теперь у злоумышленника.",
        from: "operator",
        to: "victim",
        packetLabel: "SIM неактивна",
        outcome: "exploited",
      },
      {
        order: 3,
        title: "Перехват SMS-кода",
        description:
          "Злоумышленник запрашивает вход в Telegram — код по SMS приходит уже на его SIM.",
        from: "attacker",
        to: "tg",
        packetLabel: "SMS-код",
        outcome: "exploited",
      },
      {
        order: 4,
        title: "Вход в аккаунт",
        description:
          "С перехваченным кодом злоумышленник авторизует новую сессию.",
        from: "attacker",
        to: "tg",
        packetLabel: "новая сессия",
        outcome: "exploited",
      },
    ],
    final: {
      status: "exploited",
      title: "Перехват номера удался",
      description:
        "Только SMS-код оказался единственной защитой. Облачный пароль (2FA) сделал бы SIM-swap бесполезным.",
    },
    mitigations: [
      "Включите облачный пароль (2FA) — SMS-кода будет недостаточно.",
      "Установите у оператора запрет на перевыпуск SIM без личного визита.",
      "Подключите уведомления об операциях с SIM и номером.",
      "Не привязывайте критичные сервисы только к номеру телефона.",
      "Минимизируйте публичную утечку персональных данных.",
    ],
  },
  {
    key: "tg-fake-bot",
    slug: "telegram-feyk-bot",
    title: "Telegram: фейковый бот «Premium»",
    category: "Аккаунты и мессенджеры",
    difficulty: "Базовый",
    estimatedMin: 10,
    order: 10,
    summary:
      "Мошеннический бот обещает бесплатный Telegram Premium и под видом «авторизации» выманивает код входа или данные аккаунта.",
    nodes: [
      { id: "attacker", label: "Злоумышленник", kind: "attacker", x: 10, y: 20 },
      { id: "bot", label: "Фейк-бот «Premium»", kind: "bot", x: 48, y: 50 },
      { id: "victim", label: "Жертва", kind: "victim", x: 10, y: 80 },
      { id: "tg", label: "Telegram", kind: "service", x: 90, y: 50 },
    ],
    steps: [
      {
        order: 1,
        title: "Приглашение в бота",
        description:
          "Жертве присылают бота с обещанием бесплатного Premium или «проверки аккаунта».",
        from: "attacker",
        to: "victim",
        packetLabel: "@FreePremium_bot",
        outcome: "exploited",
      },
      {
        order: 2,
        title: "Мнимая авторизация",
        description:
          "Бот просит «войти через Telegram» и вводит код подтверждения либо запрашивает данные аккаунта.",
        from: "victim",
        to: "bot",
        packetLabel: "код / данные",
        outcome: "exploited",
      },
      {
        order: 3,
        title: "Передача данных злоумышленнику",
        description:
          "Всё, что жертва ввела боту, немедленно уходит его владельцу.",
        from: "bot",
        to: "attacker",
        packetLabel: "код + данные",
        outcome: "exploited",
      },
      {
        order: 4,
        title: "Захват аккаунта",
        description:
          "Злоумышленник использует полученные данные для входа в аккаунт жертвы.",
        from: "attacker",
        to: "tg",
        packetLabel: "вход",
        outcome: "exploited",
      },
    ],
    final: {
      status: "exploited",
      title: "Аккаунт украден через бота",
      description:
        "Боты не выдают Premium и не должны запрашивать код входа. Ввод кода в бота = передача аккаунта злоумышленнику.",
    },
    mitigations: [
      "Оформляйте Premium только внутри официального приложения Telegram.",
      "Боты не могут выдавать Premium и не должны запрашивать код входа.",
      "Никогда не вводите код подтверждения в ботах и мини-приложениях.",
      "Проверяйте официальные каналы и остерегайтесь «слишком выгодных» предложений.",
      "Включите облачный пароль (2FA).",
    ],
  },
];

export function getScenario(key: string): Scenario | undefined {
  return scenarios.find((s) => s.key === key);
}
