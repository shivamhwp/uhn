import { ArrowSquareOutIcon, ChatCircleIcon, ArrowFatUpIcon } from "@phosphor-icons/react";
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
      className={`group relative flex cursor-pointer items-stretch border-b border-edge/50 transition-colors duration-100 ${
        isSelected ? "bg-accent-subtle" : "hover:bg-surface-hover"
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
      {/* Rank */}
      <div className="hidden sm:flex w-9 shrink-0 items-center justify-center">
        <span
          className={`text-sm font-mono tabular-nums leading-none ${
            isSelected ? "text-accent/60" : "text-fg-faint"
          }`}
        >
          {rank}
        </span>
      </div>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2 py-3 pr-3 sm:pl-0 pl-3">
        {/* Title row */}
        <div className="flex min-w-0 items-baseline gap-2">
          <h3
            className={`min-w-0 flex-1 line-clamp-2 text-lg font-medium leading-tight tracking-tight ${
              isSelected ? "text-accent" : "text-fg group-hover:text-accent"
            } transition-colors`}
          >
            {story.title}
          </h3>
          {domain && (
            <span className="hidden shrink-0 self-end truncate pb-px leading-none text-sm text-fg-faint/70 sm:inline-block sm:max-w-32">
              {domain}
            </span>
          )}
        </div>

        {/* Meta row */}
        <div className="flex min-w-0 items-center gap-x-3 overflow-hidden text-base leading-none text-fg-faint">
          {story.score != null && (
            <span className="flex shrink-0 items-center gap-0.5 text-accent/80 font-medium tabular-nums">
              <ArrowFatUpIcon size={11} weight="fill" />
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
              className="shrink-0 max-w-32 truncate text-left text-fg-muted hover:text-accent transition-colors"
            >
              {story.by}
            </button>
          )}
          <span className="shrink-0">{timeAgo(story.time)}</span>
          {story.descendants != null && (
            <span className="flex shrink-0 items-center gap-0.5 text-fg-muted">
              <ChatCircleIcon size={11} />
              {story.descendants}
            </span>
          )}
          {story.url && (
            <a
              href={story.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="ml-auto shrink-0 text-fg-faint/40 opacity-0 transition-all hover:text-accent group-hover:opacity-100"
            >
              <ArrowSquareOutIcon size={12} />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
