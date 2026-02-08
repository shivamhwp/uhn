import { ArrowSquareOut, ChatCircle, ArrowFatUp, User } from '@phosphor-icons/react';
import { timeAgo, extractDomain } from '../lib/utils';
import type { HNItem } from '../lib/types';

interface Props {
  story: HNItem;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
  onUserClick: (id: string) => void;
  onPrefetch: () => void;
  style?: React.CSSProperties;
}

export function StoryItem({
  story,
  rank,
  isSelected,
  onClick,
  onUserClick,
  onPrefetch,
  style,
}: Props) {
  const domain = extractDomain(story.url);

  return (
    <div
      data-rank={rank}
      className={`group relative flex gap-3 px-3 py-2.5 rounded-md cursor-pointer transition-all duration-150 ${
        isSelected
          ? 'bg-accent-subtle ring-1 ring-accent/20'
          : 'hover:bg-surface-hover'
      }`}
      onClick={onClick}
      onMouseEnter={onPrefetch}
      style={style}
    >
      {/* Rank number */}
      <div className="shrink-0 w-8 text-right">
        <span
          className={`text-xs tabular-nums ${
            isSelected ? 'text-accent font-semibold' : 'text-fg-faint'
          }`}
        >
          {rank}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-baseline gap-2">
          <h3
            className={`text-lg leading-snug font-medium ${
              isSelected ? 'text-accent' : 'text-fg group-hover:text-accent'
            } transition-colors`}
          >
            {story.title}
          </h3>
          {domain && (
            <span className="shrink-0 text-sm text-fg-faint hidden sm:inline">
              ({domain})
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-0.5 mt-1 text-sm text-fg-muted">
          {story.score != null && (
            <span className="flex items-center gap-1">
              <ArrowFatUp size={11} weight="bold" className="text-accent/70" />
              {story.score}
            </span>
          )}
          {story.by && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUserClick(story.by!);
              }}
              className="flex items-center gap-1 hover:text-accent transition-colors"
            >
              <User size={11} />
              {story.by}
            </button>
          )}
          <span className="text-fg-faint">{timeAgo(story.time)}</span>
          {story.descendants != null && (
            <span className="flex items-center gap-1">
              <ChatCircle size={11} />
              {story.descendants}
            </span>
          )}
          {story.url && (
            <a
              href={story.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1 text-fg-faint hover:text-accent transition-colors ml-auto opacity-0 group-hover:opacity-100"
            >
              <ArrowSquareOut size={11} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

export function StoryItemSkeleton({ rank }: { rank: number }) {
  return (
    <div className="flex gap-3 px-3 py-2.5">
      <div className="shrink-0 w-8 text-right">
        <span className="text-xs text-fg-faint tabular-nums">{rank}</span>
      </div>
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-3/4" />
        <div className="skeleton h-3 w-1/3" />
      </div>
    </div>
  );
}
