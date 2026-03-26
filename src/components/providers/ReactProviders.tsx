import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { del, get, set } from "idb-keyval";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import type { Persister } from "@tanstack/react-query-persist-client";
import { ThemeProvider } from "../ThemeProvider";
import type { HNItem } from "../../lib/types";
import { ReadStateProvider } from "./ReadStateProvider";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const QUERY_CACHE_KEY = "uhn:query-cache-v2";

const queryPersister: Persister =
  typeof window === "undefined"
    ? {
        persistClient: async () => {},
        restoreClient: async () => undefined,
        removeClient: async () => {},
      }
    : {
        persistClient: async (client) => {
          await set(QUERY_CACHE_KEY, client);
        },
        restoreClient: async () => get(QUERY_CACHE_KEY),
        removeClient: async () => {
          await del(QUERY_CACHE_KEY);
        },
      };

export function ReactProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 2,
            refetchOnMount: true,
            refetchOnReconnect: true,
            refetchOnWindowFocus: false,
            staleTime: FIVE_MINUTES_MS,
            gcTime: ONE_DAY_MS,
          },
        },
      }),
  );

  useEffect(() => {
    if (typeof window === "undefined") return;
    let refreshing = false;

    const refreshNow = async () => {
      if (refreshing) return;
      refreshing = true;
      window.dispatchEvent(new Event("uhn:refresh:start"));
      try {
        await queryPersister.removeClient();
      } catch {
        // Ignore storage failures.
      }
      try {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["storyIds"] }),
          queryClient.invalidateQueries({ queryKey: ["item"] }),
          queryClient.invalidateQueries({ queryKey: ["user"] }),
          queryClient.invalidateQueries({ queryKey: ["search"] }),
        ]);
        await queryClient.refetchQueries({ type: "active" });
      } finally {
        refreshing = false;
        window.dispatchEvent(new Event("uhn:refresh:done"));
      }
    };

    window.addEventListener("uhn:refresh", refreshNow);
    return () => window.removeEventListener("uhn:refresh", refreshNow);
  }, []);

  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{
        persister: queryPersister,
        maxAge: ONE_DAY_MS,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => {
            const [scope] = query.queryKey;
            if (scope === "storyIds" || scope === "user") return true;
            if (scope !== "item") return false;

            const item = query.state.data as HNItem | undefined;
            return item?.type === "story" || item?.type === "job" || item?.type === "poll";
          },
        },
      }}
    >
      <ReadStateProvider>
        <ThemeProvider>{children}</ThemeProvider>
      </ReadStateProvider>
    </PersistQueryClientProvider>
  );
}
