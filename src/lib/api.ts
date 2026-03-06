import type { HNItem, HNUser, FeedType, AlgoliaResponse } from "./types";

const HN_API = "https://hacker-news.firebaseio.com/v0";
const ALGOLIA_API = "https://hn.algolia.com/api/v1";

export async function fetchItem(id: number): Promise<HNItem | null> {
  const res = await fetch(`${HN_API}/item/${id}.json`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchUser(id: string): Promise<HNUser | null> {
  const res = await fetch(`${HN_API}/user/${id}.json`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchStoryIds(type: FeedType): Promise<number[]> {
  const endpoints: Record<FeedType, string> = {
    top: "topstories",
    new: "newstories",
    best: "beststories",
    ask: "askstories",
    show: "showstories",
    jobs: "jobstories",
  };
  const res = await fetch(`${HN_API}/${endpoints[type]}.json`);
  if (!res.ok) return [];
  return res.json();
}

export async function searchStories(params: {
  query: string;
  page?: number;
  dateFrom?: number;
  dateTo?: number;
  sortBy?: "latest" | "popular";
}): Promise<AlgoliaResponse> {
  const searchParams = new URLSearchParams({
    tags: "story",
    hitsPerPage: "30",
    page: String(params.page ?? 0),
  });

  if (params.query) {
    searchParams.set("query", params.query);
  }

  const numericFilters: string[] = [];
  if (params.dateFrom) numericFilters.push(`created_at_i>${params.dateFrom}`);
  if (params.dateTo) numericFilters.push(`created_at_i<${params.dateTo}`);
  if (numericFilters.length) {
    searchParams.set("numericFilters", numericFilters.join(","));
  }

  const endpoint = params.sortBy === "popular" ? "search" : "search_by_date";
  const res = await fetch(`${ALGOLIA_API}/${endpoint}?${searchParams}`);
  return res.json();
}
