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
import type { HNItem } from "../lib/types";
import { useTheme } from "./ThemeProvider";
import { timeAgo, extractDomain, formatDate } from "../lib/utils";
import { useHotkeys } from "../lib/useHotkeys";
import { CommentTree } from "./CommentTree";

interface Props {
  initialComments?: HNItem[];
  initialStory?: HNItem | null;
  storyId: number;
  onBack: () => void;
  onUserClick: (id: string) => void;
}

export function StoryDetail({
  storyId,
  initialStory,
  initialComments = [],
  onBack,
  onUserClick,
}: Props) {
  const { data: story, isLoading } = useItem(storyId, initialStory);
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
        <p className="text-base text-fg-faint">Story not found.</p>
        <button type="button" onClick={onBack} className="mt-2 text-sm text-accent hover:underline">
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
        className="group mb-4 flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-accent"
      >
        <ArrowLeftIcon size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
        <kbd className="ml-1 rounded border border-kbd-edge bg-kbd px-1 py-0.5 text-[11px] text-fg-faint">
          esc
        </kbd>
      </button>

      {/* Story header */}
      <article>
        <h1 className="break-words text-xl font-semibold leading-snug text-fg">{story.title}</h1>

        {domain && (
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1.5 text-base text-accent transition-colors hover:text-accent-hover"
          >
            <ArrowSquareOutIcon size={12} />
            {domain}
          </a>
        )}

        {/* Meta */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-fg-muted">
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
            className="story-html mt-4 rounded-lg border border-edge bg-surface p-4 text-lg leading-relaxed text-fg"
            dangerouslySetInnerHTML={{ __html: story.text ?? "" }}
          />
        )}
      </article>

      {/* Comments */}
      <div className="mt-6 border-t border-edge pt-4">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-fg-muted">
          Comments
        </h2>
        <CommentTree
          commentIds={story.kids ?? []}
          initialComments={initialComments}
          onUserClick={onUserClick}
        />
      </div>
    </div>
  );
}
