import { useEffect, useState } from "react";
import { ArrowLeft, Calendar, Lightning, Article, Spinner } from "@phosphor-icons/react";
import { useUser } from "../lib/hooks";
import { formatDate, timeAgo, extractDomain, isInputFocused } from "../lib/utils";
import type { HNItem } from "../lib/types";
import { useQueries } from "@tanstack/react-query";
import { fetchItem } from "../lib/api";

interface Props {
  userId: string;
  onBack: () => void;
  onStoryClick: (id: number) => void;
}

const SUBMISSIONS_PER_PAGE = 15;

export function UserProfile({ userId, onBack, onStoryClick }: Props) {
  const { data: user, isLoading } = useUser(userId);
  const [showCount, setShowCount] = useState(SUBMISSIONS_PER_PAGE);

  const submissionIds = user?.submitted?.slice(0, showCount) ?? [];
  const submissions = useQueries({
    queries: submissionIds.map((id) => ({
      queryKey: ["item", id] as const,
      queryFn: () => fetchItem(id),
      staleTime: Infinity,
      gcTime: 24 * 60 * 60 * 1000,
    })),
  });

  const stories = submissions
    .map((q) => q.data)
    .filter(
      (item): item is HNItem =>
        item != null && item.type === "story" && !item.dead && !item.deleted,
    );

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (isInputFocused()) return;
      if (e.key === "h" || e.key === "Escape" || e.key === "Backspace") {
        e.preventDefault();
        onBack();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onBack]);

  if (isLoading) {
    return (
      <div className="py-6 space-y-4 animate-fade">
        <div className="skeleton h-4 w-16" />
        <div className="skeleton h-8 w-48" />
        <div className="flex gap-4">
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-4 w-24" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-12 text-center">
        <p className="text-fg-faint text-sm">User not found.</p>
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
      </button>

      {/* Profile header */}
      <div className="bg-surface border border-edge rounded-lg p-5">
        <h1 className="text-lg font-semibold text-fg">{user.id}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-sm text-fg-muted">
          <span className="flex items-center gap-1.5">
            <Lightning size={13} weight="bold" className="text-accent" />
            {user.karma.toLocaleString()} karma
          </span>
          <span className="flex items-center gap-1.5">
            <Calendar size={13} />
            Joined {formatDate(user.created)}
          </span>
          {user.submitted && (
            <span className="flex items-center gap-1.5">
              <Article size={13} />
              {user.submitted.length.toLocaleString()} submissions
            </span>
          )}
        </div>
        {user.about && (
          <div
            className="comment-html mt-3 pt-3 border-t border-edge text-lg text-fg-muted leading-relaxed"
            dangerouslySetInnerHTML={{ __html: user.about }}
          />
        )}
      </div>

      {/* Submissions */}
      {stories.length > 0 && (
        <div className="mt-6">
          <h2 className="text-xs font-semibold text-fg-muted uppercase tracking-wider mb-3">
            Recent Stories
          </h2>
          <div className="space-y-0.5">
            {stories.map((story) => (
              <button
                key={story.id}
                onClick={() => onStoryClick(story.id)}
                className="w-full text-left px-3 py-2.5 rounded-md hover:bg-surface-hover transition-colors group"
              >
                <div className="text-lg font-medium text-fg group-hover:text-accent transition-colors">
                  {story.title}
                  {story.url && (
                    <span className="text-sm text-fg-faint font-normal ml-2">
                      ({extractDomain(story.url)})
                    </span>
                  )}
                </div>
                <div className="text-sm text-fg-muted mt-0.5">
                  {story.score} pts · {timeAgo(story.time)}
                  {story.descendants != null && ` · ${story.descendants} comments`}
                </div>
              </button>
            ))}
          </div>

          {user.submitted && showCount < user.submitted.length && (
            <button
              onClick={() => setShowCount((c) => c + SUBMISSIONS_PER_PAGE)}
              className="flex items-center gap-1.5 mx-3 mt-3 text-xs text-accent hover:text-accent-hover transition-colors"
            >
              Load more submissions
            </button>
          )}
        </div>
      )}
    </div>
  );
}
