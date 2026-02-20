import { atom } from "nanostores";
import type { FeedType } from "./types";

export const $activeStory = atom<{ feedType: FeedType; storyId: number } | null>(null);

/** Persists pagination page per feed so it survives back navigation from story detail */
export const $feedPage = atom<Partial<Record<FeedType, number>>>({});

/** Persists search results page per query so it survives back navigation */
export const $searchPage = atom<Record<string, number>>({});

/** Persists user profile "load more" count per user so it survives back navigation */
export const $userProfileShowCount = atom<Record<string, number>>({});
