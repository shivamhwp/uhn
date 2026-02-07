import { useQuery, useQueries, useQueryClient } from '@tanstack/react-query';
import { fetchItem, fetchUser, fetchStoryIds, searchStories } from './api';
import type { FeedType, HNItem, SearchFilters } from './types';

export const ITEMS_PER_PAGE = 30;

export function useStoryIds(feedType: FeedType) {
  return useQuery({
    queryKey: ['storyIds', feedType],
    queryFn: () => fetchStoryIds(feedType),
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

export function useStoriesPage(ids: number[] | undefined, page: number) {
  const start = 0;
  const end = (page + 1) * ITEMS_PER_PAGE;
  const pageIds = ids?.slice(start, end) ?? [];

  const queries = useQueries({
    queries: pageIds.map((id) => ({
      queryKey: ['item', id] as const,
      queryFn: () => fetchItem(id),
      staleTime: 5 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
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

export function useItem(id: number | null) {
  return useQuery({
    queryKey: ['item', id],
    queryFn: () => fetchItem(id!),
    enabled: id != null,
    staleTime: 5 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function useComments(ids: number[] | undefined) {
  const queries = useQueries({
    queries: (ids ?? []).map((id) => ({
      queryKey: ['item', id] as const,
      queryFn: () => fetchItem(id),
      staleTime: 5 * 60 * 1000,
      gcTime: 60 * 60 * 1000,
    })),
  });

  return {
    comments: queries
      .map((q) => q.data)
      .filter((item): item is HNItem => item != null),
    isLoading: queries.some((q) => q.isLoading),
  };
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id!),
    enabled: id != null,
    staleTime: 10 * 60 * 1000,
    gcTime: 60 * 60 * 1000,
  });
}

export function useSearch(filters: SearchFilters) {
  const hasQuery = filters.query.length > 0 || !!filters.dateFrom || !!filters.dateTo;
  return useQuery({
    queryKey: ['search', filters],
    queryFn: () =>
      searchStories({
        query: filters.query,
        page: filters.page,
        dateFrom: filters.dateFrom
          ? Math.floor(new Date(filters.dateFrom).getTime() / 1000)
          : undefined,
        dateTo: filters.dateTo
          ? Math.floor(new Date(filters.dateTo + 'T23:59:59').getTime() / 1000)
          : undefined,
      }),
    enabled: hasQuery,
    staleTime: 2 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
    placeholderData: (prev) => prev,
  });
}

export function usePrefetchItem() {
  const qc = useQueryClient();
  return (id: number) => {
    qc.prefetchQuery({
      queryKey: ['item', id],
      queryFn: () => fetchItem(id),
      staleTime: 5 * 60 * 1000,
    });
  };
}
