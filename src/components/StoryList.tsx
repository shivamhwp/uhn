import { useState, useCallback, useRef } from "react";
import { useEffect, useLayoutEffect } from "react";
import { useIsRestoring } from "@tanstack/react-query";
import { useStore } from "@nanostores/react";
import { Virtuoso } from "react-virtuoso";
import type { VirtuosoHandle } from "react-virtuoso";
import { useStoryIds, useStoriesPage, usePrefetchItem, ITEMS_PER_PAGE } from "../lib/hooks";
import { feedPath } from "../lib/feeds";
import { useTheme } from "./ThemeProvider";
import { $activeStory, $feedPage } from "../lib/stores";
import { useHotkeys } from "../lib/useHotkeys";
import { resolveStoryOpenUrl, openUrlInNewTab } from "../lib/utils";
import { $readStoryIds, markStoryRead } from "../lib/read-stories";
import { StoryItem } from "./StoryItem";
import { LoadingNotice } from "./LoadingNotice";

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
  const readStoryIds = useStore($readStoryIds);
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
  const scrollRef = useRef<HTMLElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);
  const virtuosoRef = useRef<VirtuosoHandle>(null);
  const hasRestoredScrollRef = useRef(false);
  const hasRestoredStoryAnchorRef = useRef(false);
  const autoLoadPendingRef = useRef(false);
  const prevFeedTypeRef = useRef(feedType);

  if (prevFeedTypeRef.current !== feedType) {
    prevFeedTypeRef.current = feedType;
    hasRestoredScrollRef.current = false;
    hasRestoredStoryAnchorRef.current = false;
  }

  const { toggle: toggleTheme } = useTheme();
  const isRestoring = useIsRestoring();
  const prefetchItem = usePrefetchItem();

  const { data: allIds, isLoading: idsLoading } = useStoryIds(feedType);
  const { stories, isLoading, isLoadingMore, totalItems } = useStoriesPage(allIds, page);
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const hasMore = page < totalPages - 1;

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore || autoLoadPendingRef.current) return;
    autoLoadPendingRef.current = true;
    setPage((p) => p + 1);
  }, [hasMore, isLoadingMore, setPage]);

  const restoredIndex =
    activeStory?.feedType === feedType
      ? stories.findIndex((story) => story.id === activeStory.storyId)
      : -1;
  const selectedIndex =
    restoredIndex >= 0
      ? restoredIndex
      : stories.length === 0
        ? 0
        : Math.min(selectedIndexState, stories.length - 1);
  const persistCurrentFeedPosition = useCallback(() => {
    saveFeedScroll(feedType, scrollRef.current?.scrollTop ?? 0);
  }, [feedType]);

  const scrollSelectedStoryIntoView = useCallback((index: number) => {
    virtuosoRef.current?.scrollIntoView({ index, behavior: "auto" });
  }, []);

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
  }, [isLoadingMore, page, stories.length]);

  useLayoutEffect(() => {
    if (hasRestoredScrollRef.current || idsLoading || isLoading || isLoadingMore) return;
    if (stories.length === 0) return;

    const savedTop = feedScrollTop.get(feedType) ?? readSavedFeedScroll(feedType);
    if (savedTop == null) return;

    hasRestoredScrollRef.current = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: savedTop, behavior: "auto" });
      });
    });
  }, [feedType, idsLoading, isLoading, isLoadingMore, stories.length]);

  useLayoutEffect(() => {
    if (hasRestoredStoryAnchorRef.current || hasRestoredScrollRef.current) return;
    if (idsLoading || isLoading || isLoadingMore) return;
    if (restoredIndex < 0 || stories.length === 0) return;

    hasRestoredStoryAnchorRef.current = true;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        virtuosoRef.current?.scrollToIndex({ index: restoredIndex, align: "center" });
      });
    });
  }, [idsLoading, isLoading, isLoadingMore, restoredIndex, stories.length]);

  useHotkeys({
    j: () => {
      const next = Math.min(selectedIndex + 1, stories.length - 1);
      if (next >= stories.length - 3) loadMore();
      setSelectedIndexState(next);
      const nextStory = stories[next];
      if (nextStory) $activeStory.set({ feedType, storyId: nextStory.id });
      scrollSelectedStoryIntoView(next);
    },
    ArrowDown: () => {
      const next = Math.min(selectedIndex + 1, stories.length - 1);
      if (next >= stories.length - 3) loadMore();
      setSelectedIndexState(next);
      const nextStory = stories[next];
      if (nextStory) $activeStory.set({ feedType, storyId: nextStory.id });
      scrollSelectedStoryIntoView(next);
    },
    k: () => {
      const prev = Math.max(selectedIndex - 1, 0);
      setSelectedIndexState(prev);
      const prevStory = stories[prev];
      if (prevStory) $activeStory.set({ feedType, storyId: prevStory.id });
      scrollSelectedStoryIntoView(prev);
    },
    ArrowUp: () => {
      const prev = Math.max(selectedIndex - 1, 0);
      setSelectedIndexState(prev);
      const prevStory = stories[prev];
      if (prevStory) $activeStory.set({ feedType, storyId: prevStory.id });
      scrollSelectedStoryIntoView(prev);
    },
    Enter: () => {
      if (stories[selectedIndex]) {
        void markStoryRead(stories[selectedIndex].id, "detail");
        $activeStory.set({ feedType, storyId: stories[selectedIndex].id });
        persistCurrentFeedPosition();
        onStoryClick(stories[selectedIndex].id);
      }
    },
    "/": () => {
      persistCurrentFeedPosition();
      onSearch();
    },
    t: () => toggleTheme(),
    "?": () => onToggleShortcuts(),
    r: () => {
      window.dispatchEvent(new Event("uhn:refresh"));
    },
    "]": () => loadMore(),
    "[": () => {
      if (page > 0) {
        setPage((p) => p - 1);
        setSelectedIndexState(0);
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

  useHotkeys(
    {
      o: () => {
        const story = stories[selectedIndex];
        if (!story) return;
        void markStoryRead(story.id, "external");
        openUrlInNewTab(resolveStoryOpenUrl(story));
      },
    },
    { ignoreInputs: false },
  );

  const showInitialLoading =
    !isRestoring && stories.length === 0 && (!allIds?.length || idsLoading || isLoading);

  if (showInitialLoading) {
    return <LoadingNotice className="py-16 animate-fade" />;
  }

  return (
    <div ref={listRef} className="flex min-h-0 flex-1">
      <Virtuoso
        ref={virtuosoRef}
        className="app-scroll flex-1"
        style={{ height: "100%" }}
        data={stories}
        computeItemKey={(_, story) => story.id}
        scrollerRef={(ref) => {
          scrollRef.current = ref instanceof HTMLElement ? ref : null;
        }}
        increaseViewportBy={{ top: 80, bottom: 220 }}
        overscan={320}
        rangeChanged={({ endIndex }) => {
          if (endIndex >= stories.length - 5) {
            loadMore();
          }
        }}
        components={{
          Footer: () => (hasMore || isLoadingMore ? <LoadingNotice className="py-6" /> : null),
        }}
        itemContent={(index, story) => (
          <StoryItem
            story={story}
            rank={index + 1}
            isSelected={index === selectedIndex}
            isRead={readStoryIds.has(story.id)}
            onClick={() => {
              void markStoryRead(story.id, "detail");
              $activeStory.set({ feedType, storyId: story.id });
              persistCurrentFeedPosition();
              onStoryClick(story.id);
            }}
            onHover={() => {
              setSelectedIndexState(index);
              $activeStory.set({ feedType, storyId: story.id });
            }}
            onUserClick={(id) => {
              persistCurrentFeedPosition();
              onUserClick(id);
            }}
            onPrefetch={() => prefetchItem(story.id)}
            onOpenExternal={() => {
              void markStoryRead(story.id, "external");
            }}
          />
        )}
      />
    </div>
  );
}
