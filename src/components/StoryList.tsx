import { useState, useCallback, useRef } from "react";
import { useEffect, useLayoutEffect } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useQueryClient } from "@tanstack/react-query";
import { useStore } from "@nanostores/react";
import { useStoryIds, useStoriesPage, usePrefetchItem, ITEMS_PER_PAGE } from "../lib/hooks";
import { feedPath } from "../lib/feeds";
import { useTheme } from "./ThemeProvider";
import { $activeStory, $feedPage } from "../lib/stores";
import { useHotkeys } from "../lib/useHotkeys";
import { StoryItem } from "./StoryItem";
import { CaretLeftIcon, SpinnerIcon } from "@phosphor-icons/react";
import type { FeedType } from "../lib/types";

interface Props {
  feedType: FeedType;
  onStoryClick: (id: number) => void;
  onUserClick: (id: string) => void;
  onSearch: () => void;
  onToggleShortcuts: () => void;
}

const feedScrollTop = new Map<FeedType, number>();
const getFeedScrollStorageKey = (feedType: FeedType) => `uhn:feed-scroll:${feedType}`;

const readSavedFeedScroll = (feedType: FeedType) => {
  try {
    const raw = sessionStorage.getItem(getFeedScrollStorageKey(feedType));
    if (!raw) return null;
    const parsed = Number.parseFloat(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
  } catch {
    return null;
  }
};

const saveFeedScroll = (feedType: FeedType, top: number) => {
  feedScrollTop.set(feedType, top);
  try {
    sessionStorage.setItem(getFeedScrollStorageKey(feedType), String(top));
  } catch {
    // Ignore storage write errors (private mode, quota, etc.).
  }
};

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const hasRestoredScrollRef = useRef(false);
  const hasRestoredStoryAnchorRef = useRef(false);
  const autoLoadPendingRef = useRef(false);
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

  const virtualizer = useVirtualizer({
    count: stories.length,
    getScrollElement: () => scrollRef.current,
    getItemKey: (index) => stories[index]?.id ?? index,
    estimateSize: () => 84,
    overscan: 5,
    scrollPaddingStart: 80,
    scrollPaddingEnd: 220,
  });

  const persistCurrentFeedPosition = useCallback(() => {
    saveFeedScroll(feedType, scrollRef.current?.scrollTop ?? 0);
  }, [feedType]);

  // Keep refs updated for pagehide (runs during unload when closure may be stale)
  const feedTypeRef = useRef(feedType);
  feedTypeRef.current = feedType;

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (!scrollElement) return;

    const persistScroll = () => {
      saveFeedScroll(feedTypeRef.current, scrollElement.scrollTop);
    };

    scrollElement.addEventListener("scroll", persistScroll, { passive: true });

    const onPageHide = () => {
      persistScroll();
    };
    window.addEventListener("pagehide", onPageHide);

    return () => {
      persistScroll();
      scrollElement.removeEventListener("scroll", persistScroll);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, []);

  useEffect(() => {
    if (!isLoadingMore) {
      autoLoadPendingRef.current = false;
    }
  }, [isLoadingMore]);

  useLayoutEffect(() => {
    if (hasRestoredScrollRef.current || idsLoading || isLoading || isLoadingMore) return;
    if (stories.length === 0) return;

    const savedTop = feedScrollTop.get(feedType) ?? readSavedFeedScroll(feedType);
    if (savedTop == null) return;

    hasRestoredScrollRef.current = true;
    const el = scrollRef.current;
    if (!el) return;

    const restore = () => {
      el.scrollTop = savedTop;
    };
    requestAnimationFrame(() => {
      requestAnimationFrame(restore);
    });
  }, [feedType, idsLoading, isLoading, isLoadingMore, stories.length]);

  useLayoutEffect(() => {
    if (hasRestoredStoryAnchorRef.current || hasRestoredScrollRef.current) return;
    if (idsLoading || isLoading || isLoadingMore) return;
    if (restoredIndex < 0 || stories.length === 0) return;

    hasRestoredStoryAnchorRef.current = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        virtualizer.scrollToIndex(restoredIndex, { align: "center", behavior: "auto" });
      });
    });
  }, [idsLoading, isLoading, isLoadingMore, restoredIndex, stories.length, virtualizer]);

  useLayoutEffect(() => {
    if (stories.length === 0) return;

    const frame = requestAnimationFrame(() => {
      virtualizer.measure();
    });

    return () => cancelAnimationFrame(frame);
  }, [stories.length, virtualizer]);

  useHotkeys({
    j: () => {
      const next = Math.min(selectedIndex + 1, stories.length - 1);
      if (next >= stories.length - 3 && hasMore) loadMore();
      setSelectedIndex(next);
      const nextStory = stories[next];
      if (nextStory) $activeStory.set({ feedType, storyId: nextStory.id });
      virtualizer.scrollToIndex(next, { align: "auto", behavior: "smooth" });
    },
    ArrowDown: () => {
      const next = Math.min(selectedIndex + 1, stories.length - 1);
      if (next >= stories.length - 3 && hasMore) loadMore();
      setSelectedIndex(next);
      const nextStory = stories[next];
      if (nextStory) $activeStory.set({ feedType, storyId: nextStory.id });
      virtualizer.scrollToIndex(next, { align: "auto", behavior: "smooth" });
    },
    k: () => {
      const prev = Math.max(selectedIndex - 1, 0);
      setSelectedIndex(prev);
      const prevStory = stories[prev];
      if (prevStory) $activeStory.set({ feedType, storyId: prevStory.id });
      virtualizer.scrollToIndex(prev, { align: "auto", behavior: "smooth" });
    },
    ArrowUp: () => {
      const prev = Math.max(selectedIndex - 1, 0);
      setSelectedIndex(prev);
      const prevStory = stories[prev];
      if (prevStory) $activeStory.set({ feedType, storyId: prevStory.id });
      virtualizer.scrollToIndex(prev, { align: "auto", behavior: "smooth" });
    },
    Enter: () => {
      if (stories[selectedIndex]) {
        $activeStory.set({ feedType, storyId: stories[selectedIndex].id });
        persistCurrentFeedPosition();
        onStoryClick(stories[selectedIndex].id);
      }
    },
    o: () => {
      const story = stories[selectedIndex];
      if (story?.url) window.open(story.url, "_blank", "noopener,noreferrer");
    },
    "/": () => {
      persistCurrentFeedPosition();
      onSearch();
    },
    t: () => toggleTheme(),
    "?": () => onToggleShortcuts(),
    r: () => {
      queryClient.invalidateQueries({ queryKey: ["storyIds"] });
      queryClient.invalidateQueries({ queryKey: ["item"] });
    },
    "]": () => loadMore(),
    "[": () => {
      if (page > 0) {
        setPage((p) => p - 1);
        setSelectedIndex(0);
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    "1": () => {
      persistCurrentFeedPosition();
      window.location.assign(feedPath("top"));
    },
    "2": () => {
      persistCurrentFeedPosition();
      window.location.assign(feedPath("new"));
    },
    "3": () => {
      persistCurrentFeedPosition();
      window.location.assign(feedPath("best"));
    },
    "4": () => {
      persistCurrentFeedPosition();
      window.location.assign(feedPath("ask"));
    },
    "5": () => {
      persistCurrentFeedPosition();
      window.location.assign(feedPath("show"));
    },
    "6": () => {
      persistCurrentFeedPosition();
      window.location.assign(feedPath("jobs"));
    },
  });

  const virtualItems = virtualizer.getVirtualItems();
  const lastVisibleIndex = virtualItems.at(-1)?.index ?? -1;

  useEffect(() => {
    if (!hasMore || isLoadingMore || autoLoadPendingRef.current) return;
    if (lastVisibleIndex < stories.length - 5) return;

    autoLoadPendingRef.current = true;
    loadMore();
  }, [hasMore, isLoadingMore, lastVisibleIndex, loadMore, stories.length]);

  if (idsLoading || isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <SpinnerIcon size={24} className="animate-spin text-fg-muted" />
      </div>
    );
  }

  return (
    <div ref={scrollRef} className="h-full overflow-y-auto overscroll-contain py-3">
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
            position: "relative",
            width: "100%",
          }}
        >
          {virtualItems.map((virtualRow) => {
            const story = stories[virtualRow.index];
            if (!story) return null;
            const i = virtualRow.index;
            return (
              <div
                key={story.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                <StoryItem
                  story={story}
                  rank={i + 1}
                  isSelected={i === selectedIndex}
                  onClick={() => {
                    $activeStory.set({ feedType, storyId: story.id });
                    persistCurrentFeedPosition();
                    onStoryClick(story.id);
                  }}
                  onHover={() => {
                    setSelectedIndex(i);
                    $activeStory.set({ feedType, storyId: story.id });
                  }}
                  onUserClick={(id) => {
                    persistCurrentFeedPosition();
                    onUserClick(id);
                  }}
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
              type="button"
              onClick={() => {
                setPage((p) => p - 1);
                setSelectedIndex(0);
                scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-fg-muted hover:text-fg bg-surface hover:bg-surface-hover border border-edge rounded-md transition-colors"
            >
              <CaretLeftIcon size={12} />
              Prev
            </button>
          )}
          {isLoadingMore && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-fg-faint">
              <SpinnerIcon size={12} className="animate-spin" />
              Loading more...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
