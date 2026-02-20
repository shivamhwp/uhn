import {
  ArrowLeftIcon,
  ArrowSquareOutIcon,
  ArrowFatUpIcon,
  UserIcon,
  ChatCircleIcon,
  ClockIcon,
  SpinnerIcon,
} from "@phosphor-icons/react";
import { useItem } from "../lib/hooks";
import { useTheme } from "./ThemeProvider";
import { timeAgo, extractDomain, formatDate } from "../lib/utils";
import { useHotkeys } from "../lib/useHotkeys";
import { CommentTree } from "./CommentTree";

interface Props {
  storyId: number;
  onBack: () => void;
  onUserClick: (id: string) => void;
}

export function StoryDetail({ storyId, onBack, onUserClick }: Props) {
  const { data: story, isLoading } = useItem(storyId);
  const { toggle: toggleTheme } = useTheme();
  const domain = extractDomain(story?.url);

  useHotkeys({
    h: () => onBack(),
    Escape: () => onBack(),
    Backspace: () => onBack(),
    o: () => story?.url && window.open(story.url, "_blank", "noopener,noreferrer"),
    t: () => toggleTheme(),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 animate-fade">
        <SpinnerIcon size={24} className="animate-spin text-fg-muted" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="py-12 px-4 text-center">
        <p className="text-fg-faint text-sm">Story not found.</p>
        <button type="button" onClick={onBack} className="text-accent text-xs mt-2 hover:underline">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="py-4 px-4 animate-fade">
      {/* Back */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-xs text-fg-muted hover:text-accent transition-colors mb-4 group"
      >
        <ArrowLeftIcon size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
        <kbd className="text-[9px] px-1 py-0.5 bg-kbd border border-kbd-edge rounded text-fg-faint ml-1">
          esc
        </kbd>
      </button>

      {/* Story header */}
      <article>
        <h1 className="text-lg font-semibold text-fg leading-snug">{story.title}</h1>

        {domain && (
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-accent hover:text-accent-hover mt-2 transition-colors"
          >
            <ArrowSquareOutIcon size={12} />
            {domain}
          </a>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-fg-muted">
          {story.score != null && (
            <span className="flex items-center gap-1">
              <ArrowFatUpIcon size={12} weight="bold" className="text-accent" />
              {story.score} points
            </span>
          )}
          {story.by && (
            <button
              type="button"
              onClick={() => onUserClick(story.by!)}
              className="flex items-center gap-1 hover:text-accent transition-colors"
            >
              <UserIcon size={12} />
              {story.by}
            </button>
          )}
          <span className="flex items-center gap-1 text-fg-faint">
            <ClockIcon size={12} />
            {formatDate(story.time)} ({timeAgo(story.time)})
          </span>
          {story.descendants != null && (
            <span className="flex items-center gap-1">
              <ChatCircleIcon size={12} />
              {story.descendants} comments
            </span>
          )}
        </div>

        {/* Story text (Ask HN, etc.) */}
        {story.text && (
          <div
            className="story-html mt-4 p-4 bg-surface border border-edge rounded-lg text-base text-fg leading-relaxed"
            dangerouslySetInnerHTML={{ __html: story.text ?? "" }}
          />
        )}
      </article>

      {/* Comments */}
      <div className="mt-6 border-t border-edge pt-4">
        <h2 className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-4">
          Comments
        </h2>
        <CommentTree commentIds={story.kids ?? []} onUserClick={onUserClick} />
      </div>
    </div>
  );
}
