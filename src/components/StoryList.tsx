import { useState, useEffect, useCallback, useRef } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@nanostores/react";
import { useStoryIds, useStoriesPage, usePrefetchItem, ITEMS_PER_PAGE } from "../lib/hooks";
import { useTheme } from "./ThemeProvider";
import { isInputFocused } from "../lib/utils";
import { $activeStory, $feedPage } from "../lib/stores";
import { StoryItem, StoryItemSkeleton } from "./StoryItem";
import { CaretLeft, CaretRight, Spinner } from "@phosphor-icons/react";
import type { FeedType } from "../lib/types";

interface Props {
  feedType: FeedType;
  onStoryClick: (id: number) => void;
  onUserClick: (id: string) => void;
  onSearch: () => void;
  onToggleShortcuts: () => void;
}

export function StoryList({
  feedType,
  onStoryClick,
  onUserClick,
  onSearch,
  onToggleShortcuts,
}: Props) {
  const activeStory = useStore($activeStory);
  const feedPages = useStore($feedPage);
  const page = feedPages[feedType] ?? 0;
  const setPage = useCallback(
    (action: number | ((p: number) => number)) => {
      const currentPage = $feedPage.get()[feedType] ?? 0;
      const next = typeof action === "function" ? action(currentPage) : action;
      $feedPage.set({ ...$feedPage.get(), [feedType]: next });
    },
    [feedType],
  );
  const [selectedIndexState, setSelectedIndexState] = useState(0);
  const [scrollMargin, setScrollMargin] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const { toggle: toggleTheme } = useTheme();
  const queryClient = useQueryClient();
  const prefetchItem = usePrefetchItem();

  const { data: allIds, isLoading: idsLoading } = useStoryIds(feedType);
  const { stories, isLoading, isLoadingMore, totalItems } = useStoriesPage(allIds, page);
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const hasMore = page < totalPages - 1;

  const loadMore = useCallback(() => {
    if (hasMore) setPage((p) => p + 1);
  }, [hasMore, setPage]);

  const restoredIndex =
    activeStory?.feedType === feedType
      ? stories.findIndex((s) => s.id === activeStory.storyId)
      : -1;
  const selectedIndex =
    restoredIndex >= 0
      ? restoredIndex
      : stories.length === 0
        ? 0
        : Math.min(selectedIndexState, stories.length - 1);

  const setSelectedIndex = setSelectedIndexState;

  const virtualizer = useWindowVirtualizer({
    count: stories.length,
    estimateSize: () => 60,
    overscan: 5,
    scrollMargin,
    scrollPaddingStart: 100,
    scrollPaddingEnd: 280,
  });

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isInputFocused()) return;

      const feedKeys: Record<string, FeedType> = {
        "1": "top",
        "2": "new",
        "3": "best",
        "4": "ask",
        "5": "show",
        "6": "jobs",
      };

      switch (e.key) {
        case "j":
        case "ArrowDown": {
          e.preventDefault();
          const next = Math.min(selectedIndex + 1, stories.length - 1);
          if (next >= stories.length - 3 && hasMore) loadMore();
          setSelectedIndex(next);
          const nextStory = stories[next];
          if (nextStory) $activeStory.set({ feedType, storyId: nextStory.id });
          virtualizer.scrollToIndex(next, { align: "auto", behavior: "smooth" });
          break;
        }
        case "k":
        case "ArrowUp": {
          e.preventDefault();
          const prev = Math.max(selectedIndex - 1, 0);
          setSelectedIndex(prev);
          const prevStory = stories[prev];
          if (prevStory) $activeStory.set({ feedType, storyId: prevStory.id });
          virtualizer.scrollToIndex(prev, { align: "auto", behavior: "smooth" });
          break;
        }
        case "Enter":
          e.preventDefault();
          if (stories[selectedIndex]) {
            $activeStory.set({ feedType, storyId: stories[selectedIndex].id });
            onStoryClick(stories[selectedIndex].id);
          }
          break;
        case "o": {
          e.preventDefault();
          const story = stories[selectedIndex];
          if (story?.url) {
            window.open(story.url, "_blank", "noopener,noreferrer");
          }
          break;
        }
        case "/":
          e.preventDefault();
          onSearch();
          break;
        case "t":
          e.preventDefault();
          toggleTheme();
          break;
        case "?":
          e.preventDefault();
          onToggleShortcuts();
          break;
        case "r":
          e.preventDefault();
          queryClient.invalidateQueries({ queryKey: ["storyIds"] });
          break;
        case "]":
          e.preventDefault();
          loadMore();
          break;
        case "[":
          e.preventDefault();
          if (page > 0) {
            setPage((p) => p - 1);
            setSelectedIndex(0);
          }
          break;
        default:
          if (feedKeys[e.key]) {
            e.preventDefault();
            window.location.hash = feedKeys[e.key];
          }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    stories,
    selectedIndex,
    hasMore,
    page,
    loadMore,
    virtualizer,
    onStoryClick,
    onSearch,
    onToggleShortcuts,
    toggleTheme,
    queryClient,
  ]);

  if (idsLoading || isLoading) {
    return (
      <div className="py-4">
        <div className="space-y-0.5">
          {Array.from({ length: 15 }, (_, i) => (
            <StoryItemSkeleton key={i} rank={i + 1} />
          ))}
        </div>
      </div>
    );
  }

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <div
      ref={(el) => {
        listRef.current = el;
        if (el) {
          const top = el.offsetTop;
          if (top !== scrollMargin) setScrollMargin(top);
        }
      }}
      className="py-3"
    >
      {/* Virtualized story list */}
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: "100%",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            transform: `translateY(${(virtualItems[0]?.start ?? 0) - virtualizer.options.scrollMargin}px)`,
          }}
        >
          {virtualItems.map((virtualRow) => {
            const story = stories[virtualRow.index];
            if (!story) return null;
            const i = virtualRow.index;
            return (
              <div key={story.id} data-index={virtualRow.index} ref={virtualizer.measureElement}>
                <StoryItem
                  story={story}
                  rank={i + 1}
                  isSelected={i === selectedIndex}
                  onClick={() => {
                    $activeStory.set({ feedType, storyId: story.id });
                    onStoryClick(story.id);
                  }}
                  onHover={() => {
                    setSelectedIndex(i);
                    $activeStory.set({ feedType, storyId: story.id });
                  }}
                  onUserClick={onUserClick}
                  onPrefetch={() => prefetchItem(story.id)}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-6 px-3">
        <div className="text-[11px] text-fg-faint">
          {stories.length} of {totalItems} stories
        </div>
        <div className="flex items-center gap-2">
          {page > 0 && (
            <button
              onClick={() => {
                setPage((p) => p - 1);
                setSelectedIndex(0);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-fg-muted hover:text-fg bg-surface hover:bg-surface-hover border border-edge rounded-md transition-colors"
            >
              <CaretLeft size={12} />
              Prev
            </button>
          )}
          {hasMore && (
            <button
              onClick={() => {
                loadMore();
                setSelectedIndex(stories.length);
              }}
              disabled={isLoadingMore}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-accent hover:text-accent-hover bg-accent-subtle hover:bg-accent/10 border border-accent/20 rounded-md transition-colors disabled:opacity-50"
            >
              {isLoadingMore ? (
                <>
                  <Spinner size={12} className="animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  More
                  <CaretRight size={12} />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
