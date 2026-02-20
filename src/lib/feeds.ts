import type { FeedType } from "./types";

export const feedOrder = ["top", "new", "best", "ask", "show", "jobs"] as const;

export const feedLabels: Record<FeedType, string> = {
  top: "Top",
  new: "New",
  best: "Best",
  ask: "Ask",
  show: "Show",
  jobs: "Jobs",
};

export const isFeedType = (value: string): value is FeedType =>
  feedOrder.includes(value as (typeof feedOrder)[number]);

export const feedPath = (feedType: FeedType) => `/${feedType}`;
