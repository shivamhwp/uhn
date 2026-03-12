import { useLayoutEffect, useRef } from "react";
import { useHotkeys } from "../../lib/useHotkeys";
import { SearchResultsList } from "../SearchResultsList";
import { ReactProviders } from "../providers/ReactProviders";

interface Props {
  initialQuery: string;
}

export function SearchIsland({ initialQuery }: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useHotkeys({
    "/": (event) => {
      event.preventDefault();
      document.querySelector<HTMLInputElement>('header input[name="q"]')?.focus();
    },
  });

  useLayoutEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "auto" });
  }, [initialQuery]);

  return (
    <ReactProviders>
      <div ref={scrollRef} className="app-scroll flex-1 py-4 animate-fade">
        <SearchResultsList
          query={initialQuery}
          onStoryClick={(id) => window.location.assign(`/item?id=${id}`)}
          onUserClick={(id) => window.location.assign(`/user?id=${encodeURIComponent(id)}`)}
        />
      </div>
    </ReactProviders>
  );
}
