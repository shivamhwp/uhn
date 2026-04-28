import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { HNItem } from "./types";

export function timeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
}

export function extractDomain(url?: string): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

/** Article URL, or the story page when there is no outbound link (Ask HN, Show HN text, etc.). */
export function resolveStoryOpenUrl(story: Pick<HNItem, "id" | "url">): string {
  const raw = story.url?.trim();
  if (raw) return raw;
  return new URL(`/item?id=${story.id}`, window.location.origin).href;
}

/** Opens in a new tab via a real <a> click (display:none breaks activation in several browsers). */
export function openUrlInNewTab(url: string): void {
  const a = document.createElement("a");
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  a.referrerPolicy = "no-referrer";
  a.setAttribute("aria-hidden", "true");
  a.tabIndex = -1;
  a.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;opacity:0.01";
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export function pluralize(n: number, singular: string, plural?: string): string {
  return n === 1 ? `${n} ${singular}` : `${n} ${plural ?? singular + "s"}`;
}

export function isInputFocused(): boolean {
  const tag = document.activeElement?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function formatNumber(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function cn(...inputs: Parameters<typeof clsx>) {
  return twMerge(clsx(...inputs));
}
