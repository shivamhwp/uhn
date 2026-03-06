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
    window.location.assign(`/item?id=${id}`);
  }, []);

  return (
    <ReactProviders>
      <div className="h-full overflow-y-auto overscroll-contain">
        <UserProfile userId={userId} onBack={goBack} onStoryClick={goToStory} />
      </div>
    </ReactProviders>
  );
}
