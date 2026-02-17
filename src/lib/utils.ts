import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const rtf = new Intl.RelativeTimeFormat("fr", { numeric: "auto" });

export function relativeTime(date: Date | string): string {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diffSeconds = Math.round((then - now) / 1000);
  const absDiff = Math.abs(diffSeconds);

  if (absDiff < 60) return "a l'instant";
  if (absDiff < 3600) return rtf.format(Math.round(diffSeconds / 60), "minute");
  if (absDiff < 86400) return rtf.format(Math.round(diffSeconds / 3600), "hour");
  if (absDiff < 2592000) return rtf.format(Math.round(diffSeconds / 86400), "day");
  return rtf.format(Math.round(diffSeconds / 2592000), "month");
}
