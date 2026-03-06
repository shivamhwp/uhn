import { useQuery, useQueries, useQueryClient } from "@tanstack/react-query";
import { fetchItem, fetchUser, fetchStoryIds, searchStories } from "./api";
import type { FeedType, HNItem, SearchFilters } from "./types";

export const ITEMS_PER_PAGE = 30;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const FEED_STALE_MS = 30 * 1000;
const ITEM_STALE_MS = 5 * 60 * 1000;
const USER_STALE_MS = 15 * 60 * 1000;
const SEARCH_STALE_MS = 2 * 60 * 1000;

export function useStoryIds(feedType: FeedType) {
  return useQuery({
    queryKey: ["storyIds", feedType],
    queryFn: () => fetchStoryIds(feedType),
    staleTime: FEED_STALE_MS,
    gcTime: ONE_DAY_MS,
  });
}

export function useStoriesPage(ids: number[] | undefined, page: number) {
  const start = 0;
  const end = (page + 1) * ITEMS_PER_PAGE;
  const pageIds = ids?.slice(start, end) ?? [];

  const queries = useQueries({
    queries: pageIds.map((id) => ({
      queryKey: ["item", id] as const,
      queryFn: () => fetchItem(id),
      staleTime: ITEM_STALE_MS,
      gcTime: ONE_DAY_MS,
    })),
  });

  return {
    stories: queries
      .map((q) => q.data)
      .filter((item): item is HNItem => item != null && !item.dead && !item.deleted),
    isLoading: queries.length > 0 && queries.slice(0, ITEMS_PER_PAGE).some((q) => q.isLoading),
    isLoadingMore: queries.slice(-ITEMS_PER_PAGE).some((q) => q.isLoading),
    totalItems: ids?.length ?? 0,
  };
}

export function useItem(id: number | null, initialData?: HNItem | null) {
  return useQuery({
    queryKey: ["item", id],
    queryFn: () => fetchItem(id!),
    enabled: id != null,
    staleTime: ITEM_STALE_MS,
    gcTime: ONE_DAY_MS,
    initialData,
  });
}

export function useComments(ids: number[] | undefined, initialComments: HNItem[] = []) {
  const initialCommentMap = new Map(initialComments.map((comment) => [comment.id, comment]));
  const queries = useQueries({
    queries: (ids ?? []).map((id) => ({
      queryKey: ["item", id] as const,
      queryFn: () => fetchItem(id),
      staleTime: ITEM_STALE_MS,
      gcTime: ONE_DAY_MS,
      initialData: initialCommentMap.get(id),
    })),
  });

  return {
    comments: queries.map((q) => q.data).filter((item): item is HNItem => item != null),
    isLoading: queries.some((q) => q.isLoading),
  };
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: ["user", id],
    queryFn: () => fetchUser(id!),
    enabled: id != null,
    staleTime: USER_STALE_MS,
    gcTime: ONE_DAY_MS,
  });
}

export function useSearch(filters: SearchFilters) {
  const hasQuery = filters.query.length > 0 || !!filters.dateFrom || !!filters.dateTo;
  return useQuery({
    queryKey: ["search", filters],
    queryFn: () =>
      searchStories({
        query: filters.query,
        page: filters.page,
        sortBy: filters.sortBy,
        dateFrom: filters.dateFrom
          ? Math.floor(new Date(filters.dateFrom).getTime() / 1000)
          : undefined,
        dateTo: filters.dateTo
          ? Math.floor(new Date(filters.dateTo + "T23:59:59").getTime() / 1000)
          : undefined,
      }),
    enabled: hasQuery,
    staleTime: SEARCH_STALE_MS,
    gcTime: ONE_DAY_MS,
    placeholderData: (prev) => prev,
  });
}

export function usePrefetchItem() {
  const qc = useQueryClient();
  return (id: number) => {
    qc.prefetchQuery({
      queryKey: ["item", id],
      queryFn: () => fetchItem(id),
      staleTime: ITEM_STALE_MS,
    });
  };
}
