import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  MagnifyingGlass,
  CalendarBlank,
  ArrowSquareOut,
  Spinner,
  X,
  CaretLeft,
  CaretRight,
} from '@phosphor-icons/react';
import { useSearch } from '../lib/hooks';
import { timeAgo, extractDomain, isInputFocused } from '../lib/utils';
import { useTheme } from './ThemeProvider';
import type { SearchFilters } from '../lib/types';

interface Props {
  onStoryClick: (id: number) => void;
  onUserClick: (id: string) => void;
  onBack: () => void;
}

export function SearchPanel({ onStoryClick, onUserClick, onBack }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { toggle: toggleTheme } = useTheme();
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    dateFrom: '',
    dateTo: '',
    page: 0,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const { data, isLoading, isFetching } = useSearch(filters);
  const hits = data?.hits ?? [];

  // Reset page on filter change
  const updateFilter = useCallback((updates: Partial<SearchFilters>) => {
    setFilters((prev) => ({ ...prev, ...updates, page: 0 }));
    setSelectedIndex(0);
  }, []);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Allow typing in inputs
      if (e.key === 'Escape') {
        e.preventDefault();
        if (document.activeElement === inputRef.current) {
          inputRef.current?.blur();
        } else {
          onBack();
        }
        return;
      }

      if (isInputFocused()) return;

      switch (e.key) {
        case 'j':
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, hits.length - 1));
          break;
        case 'k':
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (hits[selectedIndex]) {
            onStoryClick(Number(hits[selectedIndex].objectID));
          }
          break;
        case 'o': {
          e.preventDefault();
          const hit = hits[selectedIndex];
          if (hit?.url) window.open(hit.url, '_blank', 'noopener,noreferrer');
          break;
        }
        case '/':
          e.preventDefault();
          inputRef.current?.focus();
          break;
        case 'h':
        case 'Backspace':
          e.preventDefault();
          onBack();
          break;
        case 't':
          e.preventDefault();
          toggleTheme();
          break;
        case ']':
          e.preventDefault();
          if (data && filters.page < data.nbPages - 1) {
            setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
            setSelectedIndex(0);
          }
          break;
        case '[':
          e.preventDefault();
          if (filters.page > 0) {
            setFilters((prev) => ({ ...prev, page: prev.page - 1 }));
            setSelectedIndex(0);
          }
          break;
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [hits, selectedIndex, data, filters.page, onBack, onStoryClick, toggleTheme]);

  const hasFilters = filters.query || filters.dateFrom || filters.dateTo;

  return (
    <div className="py-4 animate-fade">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-accent transition-colors mb-4 group"
      >
        <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
        <kbd className="text-[9px] px-1 py-0.5 bg-kbd border border-kbd-edge rounded text-fg-faint ml-1">
          esc
        </kbd>
      </button>

      {/* Search input */}
      <div className="bg-surface border border-edge rounded-lg p-4 space-y-3">
        <div className="relative">
          <MagnifyingGlass
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint"
          />
          <input
            ref={inputRef}
            type="text"
            autoFocus
            placeholder="Search stories..."
            value={filters.query}
            onChange={(e) => updateFilter({ query: e.target.value })}
            className="w-full pl-10 pr-10 py-2.5 bg-bg border border-edge rounded-md text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/20 transition-all"
          />
          {filters.query && (
            <button
              onClick={() => updateFilter({ query: '' })}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-fg-faint hover:text-fg transition-colors"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Date filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
          <div className="flex items-center gap-2 text-xs text-fg-muted">
            <CalendarBlank size={14} />
            <span>From</span>
          </div>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => updateFilter({ dateFrom: e.target.value })}
            className="px-2.5 py-1.5 bg-bg border border-edge rounded-md text-xs text-fg focus:outline-none focus:border-accent/50 transition-colors"
          />
          <span className="text-xs text-fg-faint">to</span>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => updateFilter({ dateTo: e.target.value })}
            className="px-2.5 py-1.5 bg-bg border border-edge rounded-md text-xs text-fg focus:outline-none focus:border-accent/50 transition-colors"
          />
          {(filters.dateFrom || filters.dateTo) && (
            <button
              onClick={() => updateFilter({ dateFrom: '', dateTo: '' })}
              className="text-[11px] text-danger hover:underline"
            >
              Clear dates
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      <div className="mt-4">
        {isFetching && !data && (
          <div className="flex items-center justify-center py-12 gap-2 text-fg-faint text-xs">
            <Spinner size={14} className="animate-spin" />
            Searching...
          </div>
        )}

        {!hasFilters && (
          <div className="text-center py-12 text-fg-faint text-xs">
            Type a query or select a date range to search.
          </div>
        )}

        {data && hits.length === 0 && hasFilters && (
          <div className="text-center py-12 text-fg-faint text-xs">No results found.</div>
        )}

        {hits.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-[11px] text-fg-faint">
                {data?.nbHits.toLocaleString()} results
                {isFetching && <Spinner size={10} className="animate-spin inline ml-1.5" />}
              </span>
              {data && data.nbPages > 1 && (
                <span className="text-[11px] text-fg-faint">
                  Page {data.page + 1} of {data.nbPages}
                </span>
              )}
            </div>

            <div className="space-y-0.5">
              {hits.map((hit, i) => {
                const domain = extractDomain(hit.url);
                return (
                  <div
                    key={hit.objectID}
                    onClick={() => onStoryClick(Number(hit.objectID))}
                    className={`group flex gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-150 ${
                      i === selectedIndex
                        ? 'bg-accent-subtle ring-1 ring-accent/20'
                        : 'hover:bg-surface-hover'
                    }`}
                  >
                    <div className="shrink-0 w-8 text-right">
                      <span
                        className={`text-xs tabular-nums ${
                          i === selectedIndex ? 'text-accent font-semibold' : 'text-fg-faint'
                        }`}
                      >
                        {filters.page * 30 + i + 1}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <h3
                          className={`text-[13px] leading-snug font-medium ${
                            i === selectedIndex
                              ? 'text-accent'
                              : 'text-fg group-hover:text-accent'
                          } transition-colors`}
                        >
                          {hit.title}
                        </h3>
                        {domain && (
                          <span className="shrink-0 text-[11px] text-fg-faint hidden sm:inline">
                            ({domain})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[11px] text-fg-muted">
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

            {/* Pagination */}
            {data && data.nbPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, page: prev.page - 1 }));
                    setSelectedIndex(0);
                  }}
                  disabled={filters.page === 0}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-fg-muted hover:text-fg bg-surface hover:bg-surface-hover border border-edge rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  <CaretLeft size={12} />
                  Prev
                </button>
                <button
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
                    setSelectedIndex(0);
                  }}
                  disabled={filters.page >= data.nbPages - 1}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs text-accent hover:text-accent-hover bg-accent-subtle border border-accent/20 rounded-md transition-colors disabled:opacity-30 disabled:pointer-events-none"
                >
                  Next
                  <CaretRight size={12} />
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Status bar — keyboard hints, hidden on mobile */}
      <div className="fixed bottom-0 left-0 right-0 h-7 bg-surface/80 backdrop-blur-sm border-t border-edge hidden sm:flex items-center justify-center gap-6 text-[10px] text-fg-faint z-30">
        <span>
          <kbd className="inline-block min-w-[16px] text-center px-1 py-0.5 bg-kbd border border-kbd-edge rounded text-[9px] mx-0.5">/</kbd>
          {' '}focus search
        </span>
        <span>
          <kbd className="inline-block min-w-[16px] text-center px-1 py-0.5 bg-kbd border border-kbd-edge rounded text-[9px] mx-0.5">j</kbd>
          <kbd className="inline-block min-w-[16px] text-center px-1 py-0.5 bg-kbd border border-kbd-edge rounded text-[9px] mx-0.5">k</kbd>
          {' '}navigate
        </span>
        <span>
          <kbd className="inline-block min-w-[16px] text-center px-1 py-0.5 bg-kbd border border-kbd-edge rounded text-[9px] mx-0.5">esc</kbd>
          {' '}back
        </span>
      </div>
    </div>
  );
}
