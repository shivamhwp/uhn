import { useCallback, useLayoutEffect, useRef } from "react";
import { UserProfile } from "../UserProfile";
import { ReactProviders } from "../providers/ReactProviders";

interface Props {
  userId: string;
}

export function UserIsland({ userId }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

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

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [userId]);

  return (
    <ReactProviders>
      <div ref={scrollRef} className="app-scroll flex-1">
        <UserProfile userId={userId} onBack={goBack} onStoryClick={goToStory} />
      </div>
    </ReactProviders>
  );
}
