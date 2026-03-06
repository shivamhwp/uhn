import { useCallback, useState } from "react";
import type { FeedType } from "../../lib/types";
import { useHotkeys } from "../../lib/useHotkeys";
import { KeyboardShortcuts } from "../KeyboardShortcuts";
import { StoryList } from "../StoryList";
import { ReactProviders } from "../providers/ReactProviders";

interface Props {
  feedType: FeedType;
}

export function FeedIsland({ feedType }: Props) {
  const [showShortcuts, setShowShortcuts] = useState(false);

  const goToStory = useCallback((id: number) => {
    window.location.assign(`/item?id=${id}`);
  }, []);

  const goToUser = useCallback((id: string) => {
    window.location.assign(`/user?id=${encodeURIComponent(id)}`);
  }, []);

  const goToSearch = useCallback(() => {
    window.location.assign("/search");
  }, []);

  const toggleShortcuts = useCallback(() => {
    setShowShortcuts((show) => !show);
  }, []);

  useHotkeys({
    "Mod+k": (event) => {
      event.preventDefault();
      toggleShortcuts();
    },
  });

  return (
    <ReactProviders>
      <div className="h-full overflow-hidden">
        <StoryList
          feedType={feedType}
          onStoryClick={goToStory}
          onUserClick={goToUser}
          onSearch={goToSearch}
          onToggleShortcuts={toggleShortcuts}
        />
      </div>
      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </ReactProviders>
  );
}
