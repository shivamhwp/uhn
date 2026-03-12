import { useState, type CSSProperties } from "react";
import { CaretDownIcon, CaretRightIcon, UserIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useComments, useItem } from "../lib/hooks";
import type { HNItem } from "../lib/types";
import { timeAgo } from "../lib/utils";

const INITIAL_TOP_LEVEL_COMMENTS = 20;
const COMMENT_PAGE_SIZE = 20;

const DEPTH_COLORS = [
  "var(--color-accent)",
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
];

interface CommentProps {
  commentId: number;
  depth: number;
  onUserClick: (id: string) => void;
}

function Comment({ commentId, depth, onUserClick }: CommentProps) {
  const { data: comment } = useItem(commentId);
  const [collapsed, setCollapsed] = useState(false);
  const [showReplies, setShowReplies] = useState(false);

  if (!comment || comment.deleted || comment.dead) {
    return null;
  }

  const color = DEPTH_COLORS[depth % DEPTH_COLORS.length];
  const hasKids = comment.kids && comment.kids.length > 0;
  const replyCountLabel = hasKids
    ? `${comment.kids!.length} ${comment.kids!.length === 1 ? "reply" : "replies"}`
    : "";

  return (
    <div className="comment-thread min-w-0" style={{ "--comment-depth": depth } as CSSProperties}>
      <div
        className="min-w-0 overflow-hidden border-l-2 py-1.5 pl-3 transition-colors"
        style={{ borderColor: collapsed ? "var(--color-edge)" : color }}
      >
        {/* Comment header */}
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-base">
          <button
            type="button"
            onClick={() => setCollapsed(!collapsed)}
            className="text-fg-faint hover:text-fg transition-colors shrink-0"
          >
            {collapsed ? (
              <CaretRightIcon size={10} weight="bold" />
            ) : (
              <CaretDownIcon size={10} weight="bold" />
            )}
          </button>
          <button
            type="button"
            onClick={() => comment.by && onUserClick(comment.by)}
            className="flex min-w-0 max-w-full items-center gap-1 font-medium text-fg-muted transition-colors hover:text-accent"
          >
            <UserIcon size={10} />
            <span className="min-w-0 break-all">{comment.by}</span>
          </button>
          <span className="text-fg-faint">{timeAgo(comment.time)}</span>
          {collapsed && hasKids && <span className="text-fg-faint">[{replyCountLabel}]</span>}
        </div>

        {/* Comment body */}
        {!collapsed && (
          <>
            <div
              className="comment-html mt-1 min-w-0 text-lg leading-relaxed text-fg"
              dangerouslySetInnerHTML={{ __html: comment.text || "" }}
            />
            {hasKids && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowReplies((visible) => !visible)}
                  className="text-sm text-fg-muted transition-colors hover:text-accent"
                >
                  {showReplies ? `Hide ${replyCountLabel}` : `Show ${replyCountLabel}`}
                </button>
              </div>
            )}
            {hasKids && showReplies && (
              <div className="mt-1">
                {comment.kids!.map((kidId) => (
                  <Comment
                    key={kidId}
                    commentId={kidId}
                    depth={depth + 1}
                    onUserClick={onUserClick}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

interface CommentTreeProps {
  commentIds: number[];
  initialComments?: HNItem[];
  onUserClick: (id: string) => void;
}

export function CommentTree({ commentIds, initialComments = [], onUserClick }: CommentTreeProps) {
  const [visibleCount, setVisibleCount] = useState(INITIAL_TOP_LEVEL_COMMENTS);
  const visibleCommentIds = commentIds.slice(0, visibleCount);
  const hasMoreTopLevel = visibleCount < commentIds.length;
  const nextCommentBatchSize = Math.min(
    COMMENT_PAGE_SIZE,
    commentIds.length - visibleCommentIds.length,
  );
  const { comments, isLoading } = useComments(visibleCommentIds, initialComments);
  const visibleTopLevelComments = comments.filter((comment) => !comment.deleted && !comment.dead);

  if (commentIds.length === 0) {
    return <div className="py-12 text-center text-sm text-fg-faint">No comments yet.</div>;
  }

  if (visibleTopLevelComments.length === 0 && !hasMoreTopLevel) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center gap-2 py-8 text-sm text-fg-faint">
          <SpinnerIcon size={14} className="animate-spin" />
          Loading comments...
        </div>
      );
    }

    return <div className="py-12 text-center text-sm text-fg-faint">No comments yet.</div>;
  }

  return (
    <div className="space-y-0.5">
      {visibleCommentIds.map((id) => (
        <Comment key={id} commentId={id} depth={0} onUserClick={onUserClick} />
      ))}
      {hasMoreTopLevel && (
        <div className="pt-3">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + COMMENT_PAGE_SIZE)}
            className="text-sm text-accent transition-colors hover:text-accent-hover"
          >
            Load {nextCommentBatchSize} more comments (
            {commentIds.length - visibleCommentIds.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
