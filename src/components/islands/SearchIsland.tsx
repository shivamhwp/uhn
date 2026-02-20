import { useHotkeys } from "../../lib/useHotkeys";
import { SearchResultsList } from "../SearchResultsList";
import { ReactProviders } from "../providers/ReactProviders";

interface Props {
  initialQuery: string;
}

export function SearchIsland({ initialQuery }: Props) {
  useHotkeys({
    "/": (event) => {
      event.preventDefault();
      document.querySelector<HTMLInputElement>('header input[name="q"]')?.focus();
    },
  });

  return (
    <ReactProviders>
      <div className="py-4 animate-fade">
        <SearchResultsList
          query={initialQuery}
          onStoryClick={(id) => window.location.assign(`/story?id=${id}`)}
          onUserClick={(id) => window.location.assign(`/user?id=${encodeURIComponent(id)}`)}
        />
      </div>
    </ReactProviders>
  );
}
