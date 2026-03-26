import React, { useState } from "react";
import { DotsThreeVerticalIcon, ChatCircleIcon, ArrowFatUpIcon } from "@phosphor-icons/react";
import * as Popover from "@radix-ui/react-popover";
import { timeAgo, extractDomain } from "../lib/utils";
import { markStoryRead, markStoryUnread } from "../lib/read-stories";
import type { HNItem } from "../lib/types";

interface Props {
  story: HNItem;
  rank: number;
  isSelected: boolean;
  isRead: boolean;
  onClick: () => void;
  onHover: () => void;
  onUserClick: (id: string) => void;
  onPrefetch: () => void;
  onOpenExternal: () => void;
  style?: React.CSSProperties;
}

export const StoryItem = React.forwardRef<HTMLDivElement, Props>(function StoryItem(
  {
    story,
    rank,
    isSelected,
    isRead,
    onClick,
    onHover,
    onUserClick,
    onPrefetch,
    onOpenExternal,
    style,
  },
  ref,
) {
  const domain = extractDomain(story.url);
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div
      ref={ref}
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
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 py-4 sm:py-5 pr-3 sm:pl-0 pl-3">
        {/* Title row */}
        <div className="flex min-w-0 items-baseline gap-2">
          <h3
            className={`min-w-0 flex-1 line-clamp-2 text-lg font-medium leading-tight tracking-tight ${
              isSelected
                ? "text-accent"
                : isRead
                  ? "text-fg/40 group-hover:text-accent"
                  : "text-fg/90 group-hover:text-accent"
            } transition-colors`}
          >
            {story.title}
          </h3>

        </div>

        {/* Meta row */}
        <div
          className={`flex min-w-0 items-center gap-x-3 overflow-hidden text-base leading-none ${
            isRead ? "text-fg-faint/85" : "text-fg-faint"
          }`}
        >
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
        </div>
      </div>

      {/* Three-dot menu — vertically centered on the right */}
      <div className="flex shrink-0 items-center justify-center px-3">
        <Popover.Root open={menuOpen} onOpenChange={setMenuOpen}>
          <Popover.Trigger asChild>
            <button
              type="button"
              onClick={(e) => e.stopPropagation()}
              className={`cursor-pointer text-fg-faint/60 transition-colors hover:text-accent ${
                menuOpen
                  ? "text-accent opacity-100"
                  : "sm:opacity-0 sm:group-hover:opacity-100"
              }`}
              aria-label="Story actions"
            >
              <DotsThreeVerticalIcon size={28} weight="bold" />
            </button>
          </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            side="bottom"
            align="end"
            sideOffset={2}
            className="z-50 min-w-40 overflow-hidden rounded-md border border-edge bg-surface p-1 text-fg shadow-xl shadow-black/10 animate-in fade-in-0 zoom-in-95"
            onClick={(e) => e.stopPropagation()}
          >
            {story.url && (
              <button
                type="button"
                className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent-subtle hover:text-accent"
                onClick={() => {
                  window.open(story.url, "_blank", "noopener,noreferrer");
                  onOpenExternal();
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
                void (isRead
                  ? markStoryUnread(story.id)
                  : markStoryRead(story.id, "manual"));
                setMenuOpen(false);
              }}
            >
              {isRead ? "Mark as unread" : "Mark as read"}
            </button>
          </Popover.Content>
        </Popover.Portal>
        </Popover.Root>
      </div>
    </div>
  );
});
