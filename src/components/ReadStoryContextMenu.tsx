import type { ReactNode } from "react";
import { markStoryRead, markStoryUnread } from "../lib/read-stories";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "./ui/context-menu";

interface Props {
  storyId: number;
  isRead: boolean;
  storyUrl?: string | null;
  children: ReactNode;
}

export function ReadStoryContextMenu({ storyId, isRead, storyUrl, children }: Props) {
  return (
    <ContextMenu>
      <ContextMenuTrigger asChild>{children}</ContextMenuTrigger>
      <ContextMenuContent>
        {storyUrl && (
          <>
            <ContextMenuItem
              onSelect={() => {
                window.open(storyUrl, "_blank", "noopener,noreferrer");
              }}
            >
              Open original URL
            </ContextMenuItem>
            <ContextMenuSeparator />
          </>
        )}
        <ContextMenuItem
          onSelect={() => {
            void (isRead ? markStoryUnread(storyId) : markStoryRead(storyId, "manual"));
          }}
        >
          {isRead ? "Mark as unread" : "Mark as read"}
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}
