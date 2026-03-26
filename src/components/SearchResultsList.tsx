import { useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { ArrowSquareOutIcon, CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react";
import { useSearch } from "../lib/hooks";
import { extractDomain, timeAgo } from "../lib/utils";
import { $searchPage, setSearchPageEntry } from "../lib/stores";
import { useHotkeys } from "../lib/useHotkeys";
import type { SearchFilters } from "../lib/types";
import { LoadingNotice } from "./LoadingNotice";

interface Props {
  query: string;
  onStoryClick: (id: number) => void;
  onUserClick: (id: string) => void;
}

export function SearchResultsList({ query, onStoryClick, onUserClick }: Props) {
  const [sortBy, setSortBy] = useState<SearchFilters["sortBy"]>("latest");
  const searchPageKey = `${sortBy}:${query}`;
  const searchPages = useStore($searchPage);
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
    Enter: () => hits[selectedIndex] && onStoryClick(Number(hits[selectedIndex].objectID)),
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
          const domain = extractDomain(hit.url);
          return (
            <div
              key={hit.objectID}
              onClick={() => onStoryClick(Number(hit.objectID))}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onStoryClick(Number(hit.objectID));
                }
              }}
              className={`group flex gap-3 rounded-md border border-transparent px-3 py-2.5 cursor-pointer transition-all duration-150 ${
                i === selectedIndex
                  ? "border-accent/20 bg-accent-subtle"
                  : "hover:border-edge/70 hover:bg-surface-hover"
              }`}
              role="button"
              tabIndex={0}
            >
              <div className="shrink-0 w-8 text-right">
                <span
                  className={`text-sm tabular-nums ${
                    i === selectedIndex ? "text-accent font-semibold" : "text-fg-faint"
                  }`}
                >
                  {page * 30 + i + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex min-w-0 items-baseline gap-2">
                  <h3
                    className={`min-w-0 break-words text-xl font-medium leading-snug ${
                      i === selectedIndex ? "text-accent" : "text-fg group-hover:text-accent"
                    } transition-colors`}
                  >
                    {hit.title}
                  </h3>
                  {domain && (
                    <span className="hidden shrink-0 text-base text-fg-faint sm:inline">
                      ({domain})
                    </span>
                  )}
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-base text-fg-muted">
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
                  {hit.url && (
                    <a
                      href={hit.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="ml-auto opacity-0 group-hover:opacity-100 text-fg-faint hover:text-accent transition-all"
                    >
                      <ArrowSquareOutIcon size={11} />
                    </a>
                  )}
                </div>
              </div>
            </div>
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
