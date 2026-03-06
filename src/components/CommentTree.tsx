import { useState } from "react";
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
    <div style={{ paddingLeft: depth > 0 ? "var(--comment-indent)" : undefined }}>
      <div
        className="border-l-2 pl-3 py-1.5 transition-colors overflow-hidden"
        style={{ borderColor: collapsed ? "var(--color-edge)" : color }}
      >
        {/* Comment header */}
        <div className="flex items-center gap-2 text-sm">
          <button
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
            onClick={() => comment.by && onUserClick(comment.by)}
            className="font-medium text-fg-muted hover:text-accent transition-colors flex items-center gap-1"
          >
            <UserIcon size={10} />
            {comment.by}
          </button>
          <span className="text-fg-faint">{timeAgo(comment.time)}</span>
          {collapsed && hasKids && <span className="text-fg-faint">[{replyCountLabel}]</span>}
        </div>

        {/* Comment body */}
        {!collapsed && (
          <>
            <div
              className="comment-html text-base text-fg leading-relaxed mt-1"
              dangerouslySetInnerHTML={{ __html: comment.text || "" }}
            />
            {hasKids && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={() => setShowReplies((visible) => !visible)}
                  className="text-xs text-fg-muted hover:text-accent transition-colors"
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
    return <div className="text-center py-12 text-fg-faint text-xs">No comments yet.</div>;
  }

  if (visibleTopLevelComments.length === 0 && !hasMoreTopLevel) {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center gap-2 py-8 text-xs text-fg-faint">
          <SpinnerIcon size={14} className="animate-spin" />
          Loading comments...
        </div>
      );
    }

    return <div className="text-center py-12 text-fg-faint text-xs">No comments yet.</div>;
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
            className="text-xs text-accent hover:text-accent-hover transition-colors"
          >
            Load {nextCommentBatchSize} more comments (
            {commentIds.length - visibleCommentIds.length} remaining)
          </button>
        </div>
      )}
    </div>
  );
}
