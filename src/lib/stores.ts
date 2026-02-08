import { atom } from "nanostores";
import type { FeedType } from "./types";

export const $activeStory = atom<{ feedType: FeedType; storyId: number } | null>(null);
