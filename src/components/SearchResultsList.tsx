import { useEffect, useRef, useState } from "react";
import { useStore } from "@nanostores/react";
import { ArrowSquareOut, CaretLeft, CaretRight, Spinner } from "@phosphor-icons/react";
import { useSearch } from "../lib/hooks";
import { extractDomain, isInputFocused, timeAgo } from "../lib/utils";
import { $searchPage, setSearchPageEntry } from "../lib/stores";

interface Props {
  query: string;
  onStoryClick: (id: number) => void;
  onUserClick: (id: string) => void;
}

export function SearchResultsList({ query, onStoryClick, onUserClick }: Props) {
  const searchPages = useStore($searchPage);
  const page = searchPages[query] ?? 0;
  const setPage = (action: number | ((p: number) => number)) => {
    const currentPage = $searchPage.get()[query] ?? 0;
    const next = typeof action === "function" ? action(currentPage) : action;
    setSearchPageEntry(query, next);
  };
  const [selectedIndex, setSelectedIndex] = useState(0);
  const prevQueryRef = useRef<string | null>(null);
  const { data, isFetching } = useSearch({ query, dateFrom: "", dateTo: "", page });
  const hits = data?.hits ?? [];

  useEffect(() => {
    if (prevQueryRef.current != null && prevQueryRef.current !== query) {
      setSearchPageEntry(query, 0);
    }
    prevQueryRef.current = query;
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isInputFocused()) return;
      switch (e.key) {
        case "j":
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, hits.length - 1));
          break;
        case "k":
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case "Enter":
          e.preventDefault();
          if (hits[selectedIndex]) onStoryClick(Number(hits[selectedIndex].objectID));
          break;
        case "[":
          e.preventDefault();
          if (page > 0) {
            setPage((p) => p - 1);
            setSelectedIndex(0);
          }
          break;
        case "]":
          e.preventDefault();
          if (data && page < data.nbPages - 1) {
            setPage((p) => p + 1);
            setSelectedIndex(0);
          }
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [data, hits, onStoryClick, page, query, selectedIndex]);

  if (!query.trim()) {
    return (
      <div className="py-10 text-center text-fg-faint text-xs">
        Type in the top search bar to search stories.
      </div>
    );
  }

  return (
    <div className="py-3 animate-fade">
      <div className="flex items-center justify-between mb-2 px-1">
        <span className="text-[11px] text-fg-faint">
          {data?.nbHits?.toLocaleString() ?? 0} results
          {isFetching && <Spinner size={10} className="animate-spin inline ml-1.5" />}
        </span>
        {data && data.nbPages > 1 && (
          <span className="text-[11px] text-fg-faint">
            Page {data.page + 1} of {data.nbPages}
          </span>
        )}
      </div>

      {hits.length === 0 && !isFetching && (
        <div className="py-10 text-center text-fg-faint text-xs">No results found.</div>
      )}

      <div className="space-y-0.5">
        {hits.map((hit, i) => {
          const domain = extractDomain(hit.url);
          return (
            <div
              key={hit.objectID}
              onClick={() => onStoryClick(Number(hit.objectID))}
              className={`group flex gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-150 ${
                i === selectedIndex
                  ? "bg-accent-subtle ring-1 ring-accent/20"
                  : "hover:bg-surface-hover"
              }`}
            >
              <div className="shrink-0 w-8 text-right">
                <span
                  className={`text-xs tabular-nums ${
                    i === selectedIndex ? "text-accent font-semibold" : "text-fg-faint"
                  }`}
                >
                  {page * 30 + i + 1}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <h3
                    className={`text-lg leading-snug font-medium ${
                      i === selectedIndex ? "text-accent" : "text-fg group-hover:text-accent"
                    } transition-colors`}
                  >
                    {hit.title}
                  </h3>
                  {domain && (
                    <span className="shrink-0 text-sm text-fg-faint hidden sm:inline">
                      ({domain})
                    </span>
                  )}
                </div>
                <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1 text-sm text-fg-muted">
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
                      <ArrowSquareOut size={11} />
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
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-fg-muted hover:text-fg bg-surface hover:bg-surface-hover border border-edge rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <CaretLeft size={12} />
            Prev
          </button>
          <button
            onClick={() => {
              setPage((p) => p + 1);
              setSelectedIndex(0);
            }}
            disabled={page >= data.nbPages - 1}
            className="flex items-center gap-1 px-3 py-1.5 text-xs text-accent hover:text-accent-hover bg-accent-subtle border border-accent/20 rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            Next
            <CaretRight size={12} />
          </button>
        </div>
      )}
    </div>
  );
}
