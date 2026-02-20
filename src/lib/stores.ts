import { atom } from "nanostores";
import type { FeedType } from "./types";

export const $activeStory = atom<{ feedType: FeedType; storyId: number } | null>(null);

/** Persists pagination page per feed so it survives back navigation from story detail */
export const $feedPage = atom<Partial<Record<FeedType, number>>>({});

const MAX_MAP_ENTRIES = 50;

function setWithEviction(
  map: Record<string, number>,
  key: string,
  value: number,
): Record<string, number> {
  const next = { ...map, [key]: value };
  const keys = Object.keys(next);
  if (keys.length <= MAX_MAP_ENTRIES) return next;
  const keep = keys.slice(-MAX_MAP_ENTRIES);
  return Object.fromEntries(keep.map((k) => [k, next[k]]));
}

/** Persists search results page per query so it survives back navigation */
export const $searchPage = atom<Record<string, number>>({});

export function setSearchPageEntry(query: string, page: number): void {
  $searchPage.set(setWithEviction($searchPage.get(), query, page));
}

/** Persists user profile "load more" count per user so it survives back navigation */
export const $userProfileShowCount = atom<Record<string, number>>({});

export function setUserProfileShowCountEntry(userId: string, count: number): void {
  $userProfileShowCount.set(setWithEviction($userProfileShowCount.get(), userId, count));
}
