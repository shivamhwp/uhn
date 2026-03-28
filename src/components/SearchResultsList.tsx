import { useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { DotsThreeVerticalIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import * as Popover from "@radix-ui/react-popover";
import { useSearch } from "../lib/hooks";
import { extractDomain, timeAgo } from "../lib/utils";
import { $searchPage, setSearchPageEntry } from "../lib/stores";
import { useHotkeys } from "../lib/useHotkeys";
import { $readStoryIds, markStoryRead, markStoryUnread } from "../lib/read-stories";
import type { SearchFilters } from "../lib/types";
import { LoadingNotice } from "./LoadingNotice";

function SearchResultItem({
  hit,
  index,
  page,
  isSelected,
  isRead,
  onStoryClick,
  onUserClick,
}: {
  hit: {
    objectID: string;
    title: string;
    url?: string;
    points: number;
    author: string;
    created_at_i: number;
    num_comments: number;
  };
  index: number;
  page: number;
  isSelected: boolean;
  isRead: boolean;
  onStoryClick: (id: number) => void;
  onUserClick: (id: string) => void;
}) {
  const domain = extractDomain(hit.url);
  const storyId = Number(hit.objectID);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      onClick={() => {
        void markStoryRead(storyId, "detail");
        onStoryClick(storyId);
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          void markStoryRead(storyId, "detail");
          onStoryClick(storyId);
        }
      }}
      className={`group flex gap-3 rounded-md border border-transparent px-3 py-2.5 cursor-pointer transition-all duration-150 ${
        isSelected
          ? "border-accent/20 bg-accent-subtle"
          : "hover:border-edge/70 hover:bg-surface-hover"
      }`}
      role="button"
      tabIndex={0}
    >
      <div className="shrink-0 w-8 text-right">
        <span
          className={`text-sm tabular-nums ${
            isSelected ? "text-accent font-semibold" : "text-fg-faint"
          }`}
        >
          {page * 30 + index + 1}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex min-w-0 items-baseline gap-2">
          <h3
            className={`min-w-0 break-words text-xl font-medium leading-snug ${
              isSelected
                ? "text-accent"
                : isRead
                  ? "text-fg/40 group-hover:text-accent"
                  : "text-fg/90 group-hover:text-accent"
            } transition-colors`}
          >
            {hit.title}
          </h3>
          {domain && (
            <span
              className={`hidden shrink-0 text-base text-fg-faint sm:inline ${
                menuOpen ? "!hidden" : "group-hover:hidden"
              }`}
            >
              ({domain})
            </span>
          )}
          <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
            <Popover.Trigger asChild>
              <button
                type="button"
                onClick={(e) => e.stopPropagation()}
                className={`shrink-0 self-center rounded p-0.5 text-fg-faint/60 transition-colors hover:text-accent hover:bg-accent-subtle ${
                  menuOpen
                    ? "text-accent bg-accent-subtle opacity-100"
                    : "sm:opacity-0 sm:group-hover:opacity-100"
                }`}
                aria-label="Story actions"
              >
                <DotsThreeVerticalIcon size={16} weight="bold" />
              </button>
            </Popover.Trigger>
            <Popover.Portal>
              <Popover.Content
                align="end"
                sideOffset={4}
                className="z-50 min-w-40 overflow-hidden rounded-md border border-edge bg-surface p-1 text-fg shadow-xl shadow-black/10 animate-in fade-in-0 zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                {hit.url && (
                  <button
                    type="button"
                    className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent-subtle hover:text-accent"
                    onClick={() => {
                      window.open(hit.url, "_blank", "noopener,noreferrer");
                      void markStoryRead(storyId, "external");
                      setMenuOpen(false);
                    }}
                  >
                    Open original URL
                  </button>
                )}
                <button
                  type="button"
                  className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent-subtle hover:text-accent"
                  onClick={() => {
                    void (isRead ? markStoryUnread(storyId) : markStoryRead(storyId, "manual"));
                    setMenuOpen(false);
                  }}
                >
                  {isRead ? "Mark as unread" : "Mark as read"}
                </button>
              </Popover.Content>
            </Popover.Portal>
          </Popover.Root>
        </div>
        <div
          className={`mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-base ${
            isRead ? "text-fg-faint/85" : "text-fg-muted"
          }`}
        >
          <span>{hit.points} pts</span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onUserClick(hit.author);
            }}
            className="hover:text-accent transition-colors"
          >
            {hit.author}
          </button>
          <span className="text-fg-faint">{timeAgo(hit.created_at_i)}</span>
          <span>{hit.num_comments} comments</span>
        </div>
      </div>
    </div>
  );
}

interface Props {
  query: string;
  onStoryClick: (id: number) => void;
  onUserClick: (id: string) => void;
}

export function SearchResultsList({ query, onStoryClick, onUserClick }: Props) {
  const [sortBy, setSortBy] = useState<SearchFilters["sortBy"]>("latest");
  const searchPageKey = `${sortBy}:${query}`;
  const searchPages = useStore($searchPage);
  const readStoryIds = useStore($readStoryIds);
  const page = searchPages[searchPageKey] ?? 0;
  const setPage = (action: number | ((p: number) => number)) => {
    const currentPage = $searchPage.get()[searchPageKey] ?? 0;
    const next = typeof action === "function" ? action(currentPage) : action;
    setSearchPageEntry(searchPageKey, next);
  };
  const [selectedIndex, setSelectedIndex] = useState(0);
  const prevSearchKeyRef = useRef<string | null>(null);
  const { data, isFetching } = useSearch({ query, dateFrom: "", dateTo: "", page, sortBy });
  const hits = data?.hits ?? [];

  useEffect(() => {
    if (prevSearchKeyRef.current != null && prevSearchKeyRef.current !== searchPageKey) {
      setSearchPageEntry(searchPageKey, 0);
    }
    prevSearchKeyRef.current = searchPageKey;
    setSelectedIndex(0);
  }, [searchPageKey]);

  useHotkeys({
    j: () => setSelectedIndex((i) => Math.min(i + 1, hits.length - 1)),
    ArrowDown: () => setSelectedIndex((i) => Math.min(i + 1, hits.length - 1)),
    k: () => setSelectedIndex((i) => Math.max(i - 1, 0)),
    ArrowUp: () => setSelectedIndex((i) => Math.max(i - 1, 0)),
    Enter: () => {
      const hit = hits[selectedIndex];
      if (!hit) return;
      void markStoryRead(Number(hit.objectID), "detail");
      onStoryClick(Number(hit.objectID));
    },
    "[": () => {
      if (page > 0) {
        setPage((p) => p - 1);
        setSelectedIndex(0);
      }
    },
    "]": () => {
      if (data && page < data.nbPages - 1) {
        setPage((p) => p + 1);
        setSelectedIndex(0);
      }
    },
  });

  if (!query.trim()) {
    return (
      <div className="py-10 text-center text-sm text-fg-faint">
        Type in the top search bar to search stories.
      </div>
    );
  }

  if (isFetching && hits.length === 0) {
    return <LoadingNotice className="py-12 animate-fade" />;
  }

  return (
    <div className="py-3 animate-fade">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1">
        <span className="text-sm text-fg-faint">{data?.nbHits?.toLocaleString() ?? 0} results</span>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 rounded-md border border-edge bg-surface p-0.5">
            {(["latest", "popular"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setSortBy(mode)}
                className={`rounded-sm px-2 py-1 text-sm transition-colors ${
                  sortBy === mode
                    ? "bg-accent-subtle text-accent"
                    : "text-fg-faint hover:text-fg hover:bg-surface-hover"
                }`}
              >
                {mode === "latest" ? "Latest" : "Popular"}
              </button>
            ))}
          </div>
          {data && data.nbPages > 1 && (
            <span className="text-sm text-fg-faint">
              Page {data.page + 1} of {data.nbPages}
            </span>
          )}
        </div>
      </div>

      {hits.length === 0 && !isFetching && (
        <div className="py-10 text-center text-sm text-fg-faint">No results found.</div>
      )}

      <div className="space-y-0.5">
        {hits.map((hit, i) => {
          const storyId = Number(hit.objectID);
          const isRead = readStoryIds.has(storyId);
          return (
            <SearchResultItem
              key={hit.objectID}
              hit={hit}
              index={i}
              page={page}
              isSelected={i === selectedIndex}
              isRead={isRead}
              onStoryClick={onStoryClick}
              onUserClick={onUserClick}
            />
          );
        })}
      </div>

      {data && data.nbPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => {
              setPage((p) => p - 1);
              setSelectedIndex(0);
            }}
            disabled={page === 0}
            className="flex items-center gap-1 rounded-md border border-edge bg-surface px-3 py-1.5 text-sm text-fg-muted transition-colors hover:bg-surface-hover hover:text-fg disabled:pointer-events-none disabled:opacity-30"
          >
            <CaretLeftIcon size={12} />
            Prev
          </button>
          <button
            onClick={() => {
              setPage((p) => p + 1);
              setSelectedIndex(0);
            }}
            disabled={page >= data.nbPages - 1}
            className="flex items-center gap-1 rounded-md border border-accent/20 bg-accent-subtle px-3 py-1.5 text-sm text-accent transition-colors hover:text-accent-hover disabled:pointer-events-none disabled:opacity-30"
          >
            Next
            <CaretRightIcon size={12} />
          </button>
        </div>
      )}

      {isFetching && hits.length > 0 && <LoadingNotice className="py-4" />}
    </div>
  );
}
