import { useState } from "react";
import { CaretDownIcon, CaretRightIcon, UserIcon, SpinnerIcon } from "@phosphor-icons/react";
import { useItem } from "../lib/hooks";
import { timeAgo } from "../lib/utils";

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
  const { data: comment, isLoading } = useItem(commentId);
  const [collapsed, setCollapsed] = useState(false);

  if (isLoading) {
    return (
      <div
        style={{ paddingLeft: depth > 0 ? "var(--comment-indent)" : undefined }}
        className="flex items-center py-2"
      >
        <SpinnerIcon size={14} className="animate-spin text-fg-muted" />
      </div>
    );
  }

  if (!comment || comment.deleted || comment.dead) {
    return null;
  }

  const color = DEPTH_COLORS[depth % DEPTH_COLORS.length];
  const hasKids = comment.kids && comment.kids.length > 0;

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
          {collapsed && hasKids && (
            <span className="text-fg-faint">
              [{comment.kids!.length} {comment.kids!.length === 1 ? "reply" : "replies"}]
            </span>
          )}
        </div>

        {/* Comment body */}
        {!collapsed && (
          <>
            <div
              className="comment-html text-base text-fg leading-relaxed mt-1"
              dangerouslySetInnerHTML={{ __html: comment.text || "" }}
            />
            {hasKids && (
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
  onUserClick: (id: string) => void;
}

export function CommentTree({ commentIds, onUserClick }: CommentTreeProps) {
  if (commentIds.length === 0) {
    return <div className="text-center py-12 text-fg-faint text-xs">No comments yet.</div>;
  }

  return (
    <div className="space-y-0.5">
      {commentIds.map((id) => (
        <Comment key={id} commentId={id} depth={0} onUserClick={onUserClick} />
      ))}
    </div>
  );
}
