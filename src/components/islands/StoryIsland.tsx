import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { StoryDetail } from "../StoryDetail";
import { ReactProviders } from "../providers/ReactProviders";
import type { HNItem } from "../../lib/types";
import { markStoryRead } from "../../lib/read-stories";

interface Props {
  initialComments?: HNItem[];
  initialStory?: HNItem | null;
  storyId: number;
}

export function StoryIsland({ storyId, initialStory, initialComments = [] }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.assign("/top");
  }, []);

  const goToUser = useCallback((id: string) => {
    window.location.assign(`/user?id=${encodeURIComponent(id)}`);
  }, []);

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [storyId]);

  useEffect(() => {
    void markStoryRead(storyId, "detail");
  }, [storyId]);

  return (
    <ReactProviders>
      <div ref={scrollRef} className="app-scroll flex-1">
        <StoryDetail
          storyId={storyId}
          initialStory={initialStory}
          initialComments={initialComments}
          onBack={goBack}
          onUserClick={goToUser}
        />
      </div>
    </ReactProviders>
  );
}
