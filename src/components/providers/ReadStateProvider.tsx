import { useEffect } from "react";
import type { ReactNode } from "react";
import { hydrateReadStories } from "../../lib/read-stories";

export function ReadStateProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    void hydrateReadStories();
  }, []);

  return children;
}
