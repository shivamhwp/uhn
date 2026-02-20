import { useCallback } from "react";
import { StoryDetail } from "../StoryDetail";
import { ReactProviders } from "../providers/ReactProviders";

interface Props {
  storyId: number;
}

export function StoryIsland({ storyId }: Props) {
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
      <StoryDetail storyId={storyId} onBack={goBack} onUserClick={goToUser} />
    </ReactProviders>
  );
}
