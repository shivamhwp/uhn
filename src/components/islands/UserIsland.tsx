import { useCallback } from "react";
import { UserProfile } from "../UserProfile";
import { ReactProviders } from "../providers/ReactProviders";

interface Props {
  userId: string;
}

export function UserIsland({ userId }: Props) {
  const goBack = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
      return;
    }
    window.location.assign("/top");
  }, []);

  const goToStory = useCallback((id: number) => {
    window.location.assign(`/story?id=${id}`);
  }, []);

  return (
    <ReactProviders>
      <UserProfile userId={userId} onBack={goBack} onStoryClick={goToStory} />
    </ReactProviders>
  );
}
