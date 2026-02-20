import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { ThemeProvider } from "../ThemeProvider";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      gcTime: Infinity,
    },
  },
});

const queryPersister = createSyncStoragePersister({
  storage: typeof window === "undefined" ? undefined : window.localStorage,
  key: "uhn:query-cache-v1",
  throttleTime: 1_000,
});

export function ReactProviders({ children }: { children: ReactNode }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    let refreshing = false;

    const refreshNow = async () => {
      if (refreshing) return;
      refreshing = true;
      window.dispatchEvent(new Event("uhn:refresh:start"));
      try {
        localStorage.removeItem("uhn:query-cache-v1");
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
      }}
    >
      <ThemeProvider>{children}</ThemeProvider>
    </PersistQueryClientProvider>
  );
}
