import { atom } from "nanostores";
import type { FeedType } from "./types";

export const $activeStory = atom<{ feedType: FeedType; storyId: number } | null>(null);

/** Persists pagination page per feed so it survives back navigation from story detail */
export const $feedPage = atom<Partial<Record<FeedType, number>>>({});
