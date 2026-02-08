import { useEffect } from "react";
import {
  ArrowLeft,
  ArrowSquareOut,
  ArrowFatUp,
  User,
  ChatCircle,
  Clock,
} from "@phosphor-icons/react";
import { useItem } from "../lib/hooks";
import { useTheme } from "./ThemeProvider";
import { timeAgo, extractDomain, formatDate, isInputFocused } from "../lib/utils";
import { CommentTree } from "./CommentTree";

interface Props {
  storyId: number;
  onBack: () => void;
  onUserClick: (id: string) => void;
  onStoryClick: (id: number) => void;
}

export function StoryDetail({ storyId, onBack, onUserClick, onStoryClick }: Props) {
  const { data: story, isLoading } = useItem(storyId);
  const { toggle: toggleTheme } = useTheme();
  const domain = extractDomain(story?.url);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isInputFocused()) return;
      switch (e.key) {
        case "h":
        case "Escape":
        case "Backspace":
          e.preventDefault();
          onBack();
          break;
        case "o":
          e.preventDefault();
          if (story?.url) window.open(story.url, "_blank", "noopener,noreferrer");
          break;
        case "t":
          e.preventDefault();
          toggleTheme();
          break;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBack, story, toggleTheme]);

  if (isLoading) {
    return (
      <div className="py-6 space-y-4 animate-fade">
        <div className="skeleton h-4 w-16" />
        <div className="skeleton h-6 w-3/4" />
        <div className="skeleton h-4 w-1/2" />
        <div className="mt-8 space-y-4">
          {Array.from({ length: 5 }, (_, i) => (
            <div key={i} className="space-y-2">
              <div className="skeleton h-3 w-32" />
              <div className="skeleton h-3 w-full" />
              <div className="skeleton h-3 w-2/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!story) {
    return (
      <div className="py-12 text-center">
        <p className="text-fg-faint text-sm">Story not found.</p>
        <button onClick={onBack} className="text-accent text-xs mt-2 hover:underline">
          Go back
        </button>
      </div>
    );
  }

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
            <ArrowSquareOut size={12} />
            {domain}
          </a>
        )}

        {/* Meta */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 text-sm text-fg-muted">
          {story.score != null && (
            <span className="flex items-center gap-1">
              <ArrowFatUp size={12} weight="bold" className="text-accent" />
              {story.score} points
            </span>
          )}
          {story.by && (
            <button
              onClick={() => onUserClick(story.by!)}
              className="flex items-center gap-1 hover:text-accent transition-colors"
            >
              <User size={12} />
              {story.by}
            </button>
          )}
          <span className="flex items-center gap-1 text-fg-faint">
            <Clock size={12} />
            {formatDate(story.time)} ({timeAgo(story.time)})
          </span>
          {story.descendants != null && (
            <span className="flex items-center gap-1">
              <ChatCircle size={12} />
              {story.descendants} comments
            </span>
          )}
        </div>

        {/* Story text (Ask HN, etc.) */}
        {story.text && (
          <div
            className="story-html mt-4 p-4 bg-surface border border-edge rounded-lg text-base text-fg leading-relaxed"
            dangerouslySetInnerHTML={{ __html: story.text }}
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
