import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Объединяет классы Tailwind с корректным разрешением конфликтов. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Форматирует дату в русской локали. */
export function formatDateTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
