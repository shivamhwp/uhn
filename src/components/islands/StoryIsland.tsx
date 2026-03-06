import { useCallback } from "react";
import { StoryDetail } from "../StoryDetail";
import { ReactProviders } from "../providers/ReactProviders";
import type { HNItem } from "../../lib/types";

interface Props {
  initialComments?: HNItem[];
  initialStory?: HNItem | null;
  storyId: number;
}

export function StoryIsland({ storyId, initialStory, initialComments = [] }: Props) {
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

  return (
    <ReactProviders>
      <div className="h-full overflow-y-auto overscroll-contain">
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
