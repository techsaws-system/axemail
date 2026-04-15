import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(value: number) {
  const normalizedValue = Number(value);
  return new Intl.NumberFormat("en-US").format(Number.isFinite(normalizedValue) ? normalizedValue : 0);
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}
