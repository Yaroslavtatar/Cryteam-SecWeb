"use client";

import {
  Skull,
  Server,
  Database,
  ShieldCheck,
  Laptop,
  UserRound,
  KeyRound,
  AppWindow,
  Boxes,
  Wifi,
  Fish,
  Globe,
  Smartphone,
  Bot,
  Tablet,
  Monitor,
  Router,
  Watch,
  Cpu,
  Tv,
  Printer,
  HardDrive,
  type LucideIcon,
} from "lucide-react";
import type { NodeKind } from "@/lib/scenarios";

export type Tone = "attack" | "defense" | "data" | "neutral";

/** Метаданные типов узлов: иконка, цветовой тон и русское название. */
export const KIND_META: Record<
  NodeKind,
  { icon: LucideIcon; tone: Tone; label: string }
> = {
  attacker: { icon: Skull, tone: "attack", label: "Злоумышленник" },
  mitm: { icon: Wifi, tone: "attack", label: "Перехватчик" },
  phishing: { icon: Fish, tone: "attack", label: "Фишинг-сайт" },
  bot: { icon: Bot, tone: "attack", label: "Бот" },
  client: { icon: Laptop, tone: "neutral", label: "Клиент" },
  victim: { icon: UserRound, tone: "neutral", label: "Жертва" },
  operator: { icon: Smartphone, tone: "neutral", label: "Оператор связи" },
  waf: { icon: ShieldCheck, tone: "defense", label: "WAF" },
  edge: { icon: ShieldCheck, tone: "defense", label: "Anti-DDoS / CDN" },
  server: { icon: Server, tone: "data", label: "Сервер" },
  db: { icon: Database, tone: "data", label: "База данных" },
  store: { icon: Database, tone: "data", label: "Хранилище" },
  app: { icon: AppWindow, tone: "data", label: "Приложение" },
  api: { icon: Boxes, tone: "data", label: "API" },
  idp: { icon: KeyRound, tone: "data", label: "Провайдер (IdP)" },
  service: { icon: Globe, tone: "data", label: "Сервис" },
  smartphone: { icon: Smartphone, tone: "neutral", label: "Смартфон" },
  tablet: { icon: Tablet, tone: "neutral", label: "Планшет" },
  laptop: { icon: Laptop, tone: "neutral", label: "Ноутбук" },
  desktop: { icon: Monitor, tone: "neutral", label: "Компьютер" },
  router: { icon: Router, tone: "neutral", label: "Роутер" },
  smartwatch: { icon: Watch, tone: "neutral", label: "Умные часы" },
  iot: { icon: Cpu, tone: "neutral", label: "IoT-устройство" },
  smarttv: { icon: Tv, tone: "neutral", label: "Smart TV" },
  printer: { icon: Printer, tone: "neutral", label: "Принтер" },
  nas: { icon: HardDrive, tone: "data", label: "NAS-хранилище" },
};

export const TONE_CLASSES: Record<Tone, string> = {
  attack: "border-destructive/50 bg-destructive/10 text-destructive",
  defense:
    "border-[hsl(var(--defense))]/50 bg-[hsl(var(--defense))]/10 text-[hsl(var(--defense))]",
  data: "border-accent/50 bg-accent/10 text-accent",
  neutral: "border-border bg-white/5 text-foreground",
};

/** Список типов узлов для выпадающих списков редактора. */
export const KIND_OPTIONS = (Object.keys(KIND_META) as NodeKind[]).map((k) => ({
  value: k,
  label: KIND_META[k].label,
}));
