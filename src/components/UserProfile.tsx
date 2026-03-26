import { useStore } from "@nanostores/react";
import { ArrowLeftIcon, CalendarIcon, LightningIcon, ArticleIcon } from "@phosphor-icons/react";
import { useUser } from "../lib/hooks";
import { formatDate, timeAgo, extractDomain } from "../lib/utils";
import { useHotkeys } from "../lib/useHotkeys";
import type { HNItem } from "../lib/types";
import { useQueries } from "@tanstack/react-query";
import { fetchItem } from "../lib/api";
import { $userProfileShowCount, setUserProfileShowCountEntry } from "../lib/stores";
import { AutoLoadIndicator, LoadingNotice } from "./LoadingNotice";

interface Props {
  userId: string;
  onBack: () => void;
  onStoryClick: (id: number) => void;
}

const SUBMISSIONS_PER_PAGE = 15;

export function UserProfile({ userId, onBack, onStoryClick }: Props) {
  const { data: user, isLoading } = useUser(userId);
  const showCounts = useStore($userProfileShowCount);
  const showCount = showCounts[userId] ?? SUBMISSIONS_PER_PAGE;
  const setShowCount = (action: number | ((c: number) => number)) => {
    const next = typeof action === "function" ? action(showCount) : action;
    setUserProfileShowCountEntry(userId, next);
  };

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
  const hasMoreSubmissions = (user?.submitted?.length ?? 0) > showCount;
  const isLoadingMore = submissions.slice(-SUBMISSIONS_PER_PAGE).some((query) => query.isLoading);

  useHotkeys({
    h: () => onBack(),
    Escape: () => onBack(),
    Backspace: () => onBack(),
  });

  if (isLoading) {
    return <LoadingNotice className="py-16 animate-fade" />;
  }

  if (!user) {
    return (
      <div className="py-12 text-center">
        <p className="text-base text-fg-faint">User not found.</p>
        <button onClick={onBack} className="mt-2 text-sm text-accent hover:underline">
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
        className="group mb-4 flex items-center gap-1.5 text-sm text-fg-muted transition-colors hover:text-accent"
      >
        <ArrowLeftIcon size={14} className="group-hover:-translate-x-0.5 transition-transform" />
        Back
      </button>

      {/* Profile header */}
      <div className="bg-surface border border-edge rounded-lg p-5">
        <h1 className="break-words text-xl font-semibold text-fg">{user.id}</h1>
        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-base text-fg-muted">
          <span className="flex items-center gap-1.5">
            <LightningIcon size={13} weight="bold" className="text-accent" />
            {user.karma.toLocaleString()} karma
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarIcon size={13} />
            Joined {formatDate(user.created)}
          </span>
          {user.submitted && (
            <span className="flex items-center gap-1.5">
              <ArticleIcon size={13} />
              {user.submitted.length.toLocaleString()} submissions
            </span>
          )}
        </div>
        {user.about && (
          <div
            className="comment-html mt-3 border-t border-edge pt-3 text-xl leading-relaxed text-fg-muted"
            dangerouslySetInnerHTML={{ __html: user.about }}
          />
        )}
      </div>

      {/* Submissions */}
      {stories.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Recent Stories
          </h2>
          <div className="space-y-0.5">
            {stories.map((story) => (
              <button
                key={story.id}
                onClick={() => onStoryClick(story.id)}
                className="w-full text-left px-3 py-2.5 rounded-md hover:bg-surface-hover transition-colors group"
              >
                <div className="break-words text-xl font-medium text-fg transition-colors group-hover:text-accent">
                  {story.title}
                  {story.url && (
                    <span className="ml-2 text-base font-normal text-fg-faint">
                      ({extractDomain(story.url)})
                    </span>
                  )}
                </div>
                <div className="mt-0.5 text-base text-fg-muted">
                  {story.score} pts · {timeAgo(story.time)}
                  {story.descendants != null && ` · ${story.descendants} comments`}
                </div>
              </button>
            ))}
          </div>
          <AutoLoadIndicator
            enabled={hasMoreSubmissions}
            isLoading={isLoadingMore}
            onLoadMore={() => setShowCount((count) => count + SUBMISSIONS_PER_PAGE)}
            className="mt-3"
          />
        </div>
      )}
    </div>
  );
}
