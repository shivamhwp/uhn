import {
  ArrowSquareOutIcon,
  ChatCircleIcon,
  ArrowFatUpIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { timeAgo, extractDomain } from "../lib/utils";
import type { HNItem } from "../lib/types";

interface Props {
  story: HNItem;
  rank: number;
  isSelected: boolean;
  onClick: () => void;
  onHover: () => void;
  onUserClick: (id: string) => void;
  onPrefetch: () => void;
  style?: React.CSSProperties;
}

export function StoryItem({
  story,
  rank,
  isSelected,
  onClick,
  onHover,
  onUserClick,
  onPrefetch,
  style,
}: Props) {
  const domain = extractDomain(story.url);

  return (
    <div
      data-rank={rank}
      className={`group relative flex gap-4  px-4 py-3.5 rounded-none sm:rounded-md cursor-pointer transition-all duration-150 ${
        isSelected ? "sm:bg-accent-subtle sm:ring-1 sm:ring-accent/20" : "sm:hover:bg-surface-hover"
      }`}
      onClick={onClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          onClick();
        }
      }}
      onMouseEnter={() => {
        onHover();
        onPrefetch();
      }}
      role="button"
      tabIndex={0}
      style={style}
    >
      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Title row */}
        <div className="flex items-baseline gap-2">
          <h3
            className={`text-xl leading-snug font-medium ${
              isSelected ? "text-fg sm:text-accent" : "text-fg sm:group-hover:text-accent"
            } transition-colors`}
          >
            {story.title}
          </h3>
          {domain && (
            <span className="shrink-0 text-sm text-fg-faint hidden sm:inline">({domain})</span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex items-center flex-wrap gap-x-3 gap-y-1 mt-1.5 text-base text-fg-muted">
          {story.score != null && (
            <span className="flex items-center gap-1">
              <ArrowFatUpIcon size={13} weight="bold" className="text-accent/70" />
              {story.score}
            </span>
          )}
          {story.by && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onUserClick(story.by!);
              }}
              className="flex items-center gap-1 hover:text-accent transition-colors"
            >
              <UserIcon size={13} />
              {story.by}
            </button>
          )}
          <span className="text-fg-faint">{timeAgo(story.time)}</span>
          {story.descendants != null && (
            <span className="flex items-center gap-1">
              <ChatCircleIcon size={13} />
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
              <ArrowSquareOutIcon size={13} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
