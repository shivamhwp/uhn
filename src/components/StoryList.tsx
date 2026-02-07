import { useState, useEffect, useCallback, useRef } from 'react';
import { useStoryIds, useStoriesPage, usePrefetchItem, ITEMS_PER_PAGE } from '../lib/hooks';
import { useTheme } from './ThemeProvider';
import { isInputFocused } from '../lib/utils';
import { StoryItem, StoryItemSkeleton } from './StoryItem';
import { CaretLeft, CaretRight, Spinner } from '@phosphor-icons/react';
import type { FeedType } from '../lib/types';

interface Props {
  feedType: FeedType;
  onStoryClick: (id: number) => void;
  onUserClick: (id: string) => void;
  onSearch: () => void;
  onShowHelp: () => void;
}

export function StoryList({ feedType, onStoryClick, onUserClick, onSearch, onShowHelp }: Props) {
  // No reset useEffect needed — App renders <StoryList key={feedType}>
  // so the component remounts with fresh state on feed change.
  const [page, setPage] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const { toggle: toggleTheme } = useTheme();
  const prefetchItem = usePrefetchItem();

  const { data: allIds, isLoading: idsLoading } = useStoryIds(feedType);
  const { stories, isLoading, isLoadingMore, totalItems } = useStoriesPage(allIds, page);
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const hasMore = page < totalPages - 1;

  const loadMore = useCallback(() => {
    if (hasMore) {
      setPage((p) => p + 1);
    }
  }, [hasMore]);

  // Scroll helper — called directly in event handlers, no useEffect needed
  const scrollToItem = useCallback((index: number) => {
    requestAnimationFrame(() => {
      listRef.current
        ?.querySelector(`[data-rank="${index + 1}"]`)
        ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isInputFocused()) return;

      const feedKeys: Record<string, FeedType> = {
        '1': 'top',
        '2': 'new',
        '3': 'best',
        '4': 'ask',
        '5': 'show',
        '6': 'jobs',
      };

      switch (e.key) {
        case 'j':
        case 'ArrowDown': {
          e.preventDefault();
          const next = Math.min(selectedIndex + 1, stories.length - 1);
          if (next >= stories.length - 3 && hasMore) loadMore();
          setSelectedIndex(next);
          scrollToItem(next);
          break;
        }
        case 'k':
        case 'ArrowUp': {
          e.preventDefault();
          const prev = Math.max(selectedIndex - 1, 0);
          setSelectedIndex(prev);
          scrollToItem(prev);
          break;
        }
        case 'Enter':
          e.preventDefault();
          if (stories[selectedIndex]) {
            onStoryClick(stories[selectedIndex].id);
          }
          break;
        case 'o': {
          e.preventDefault();
          const story = stories[selectedIndex];
          if (story?.url) {
            window.open(story.url, '_blank', 'noopener,noreferrer');
          }
          break;
        }
        case '/':
          e.preventDefault();
          onSearch();
          break;
        case 't':
          e.preventDefault();
          toggleTheme();
          break;
        case '?':
          e.preventDefault();
          onShowHelp();
          break;
        case ']':
          e.preventDefault();
          loadMore();
          break;
        case '[':
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

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [stories, selectedIndex, hasMore, page, loadMore, scrollToItem, onStoryClick, onSearch, onShowHelp, toggleTheme]);

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

  return (
    <div ref={listRef} className="py-3">
      {/* Stories */}
      <div className="space-y-0.5">
        {stories.map((story, i) => (
          <StoryItem
            key={story.id}
            story={story}
            rank={i + 1}
            isSelected={i === selectedIndex}
            onClick={() => onStoryClick(story.id)}
            onUserClick={onUserClick}
            onPrefetch={() => prefetchItem(story.id)}
            style={{ animationDelay: `${Math.min(i, 15) * 20}ms` }}
          />
        ))}
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
                window.scrollTo({ top: 0, behavior: 'smooth' });
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

      {/* Status bar */}
      <div className="fixed bottom-0 left-0 right-0 h-7 bg-surface/80 backdrop-blur-sm border-t border-edge flex items-center justify-center gap-4 sm:gap-6 text-[10px] text-fg-faint z-30">
        <span>
          <kbd className="inline-block min-w-[16px] text-center px-1 py-0.5 bg-kbd border border-kbd-edge rounded text-[9px] mx-0.5">j</kbd>
          <kbd className="inline-block min-w-[16px] text-center px-1 py-0.5 bg-kbd border border-kbd-edge rounded text-[9px] mx-0.5">k</kbd>
          {' '}navigate
        </span>
        <span>
          <kbd className="inline-block min-w-[16px] text-center px-1 py-0.5 bg-kbd border border-kbd-edge rounded text-[9px] mx-0.5">↵</kbd>
          {' '}open
        </span>
        <span className="hidden sm:inline">
          <kbd className="inline-block min-w-[16px] text-center px-1 py-0.5 bg-kbd border border-kbd-edge rounded text-[9px] mx-0.5">o</kbd>
          {' '}url
        </span>
        <span>
          <kbd className="inline-block min-w-[16px] text-center px-1 py-0.5 bg-kbd border border-kbd-edge rounded text-[9px] mx-0.5">/</kbd>
          {' '}search
        </span>
        <span className="hidden sm:inline">
          <kbd className="inline-block min-w-[16px] text-center px-1 py-0.5 bg-kbd border border-kbd-edge rounded text-[9px] mx-0.5">?</kbd>
          {' '}help
        </span>
      </div>
    </div>
  );
}
