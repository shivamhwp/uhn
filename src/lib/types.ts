export interface HNItem {
  id: number;
  type: "story" | "comment" | "job" | "poll" | "pollopt";
  by?: string;
  time: number;
  text?: string;
  title?: string;
  url?: string;
  score?: number;
  kids?: number[];
  descendants?: number;
  deleted?: boolean;
  dead?: boolean;
  parent?: number;
  poll?: number;
  parts?: number[];
}

export interface HNUser {
  id: string;
  created: number;
  karma: number;
  about?: string;
  submitted?: number[];
}

export type FeedType = "top" | "new" | "best" | "ask" | "show" | "jobs";

export interface SearchFilters {
  query: string;
  dateFrom: string;
  dateTo: string;
  page: number;
}

export interface AlgoliaHit {
  objectID: string;
  title: string;
  url?: string;
  author: string;
  points: number;
  num_comments: number;
  created_at: string;
  created_at_i: number;
  story_text?: string;
}

export interface AlgoliaResponse {
  hits: AlgoliaHit[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
}

export type Route =
  | { view: "feed"; feedType: FeedType }
  | { view: "story"; id: number }
  | { view: "user"; id: string }
  | { view: "search" };
