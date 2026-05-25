import { QueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { ConfettiIcon, CowIcon } from "@phosphor-icons/react";
import { del, get, set } from "idb-keyval";
import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { Persister } from "@tanstack/react-query-persist-client";
import { Toaster, toast } from "sonner";
import "sonner/dist/styles.css";
import { ThemeProvider, useTheme } from "../ThemeProvider";
import type { HNItem } from "../../lib/types";
import { ReadStateProvider } from "./ReadStateProvider";

const ONE_DAY_MS = 24 * 60 * 60 * 1000;
const FIVE_MINUTES_MS = 5 * 60 * 1000;
const QUERY_CACHE_KEY = "uhn:query-cache-v2";
const refreshToastFrame = {
  width: "var(--uhn-refresh-toast-width)",
  padding: "0.875rem",
} as const;
const neutralToastStyle = {
  ...refreshToastFrame,
  background: "var(--color-surface)",
  border: "1px solid var(--color-edge)",
  color: "var(--color-fg)",
} as const;
const successToastStyle = {
  ...refreshToastFrame,
  background: "var(--color-accent)",
  border: "1px solid var(--color-accent-hover)",
  color: "#fff",
} as const;
const errorToastStyle = {
  background: "var(--color-surface)",
  border: "1px solid var(--color-danger)",
  color: "var(--color-fg)",
  padding: "0.875rem",
} as const;
const cowIcons = Array.from({ length: 10 }, (_, index) => index);

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

function ThemedToaster() {
  const { theme } = useTheme();

  return <Toaster position="bottom-right" theme={theme} />;
}

const FetchingToast = () => (
  <div className="flex h-5 min-w-0 items-center gap-2">
    <span className="shrink-0 text-sm font-medium text-fg">fetching latest stories.</span>
    <div className="min-w-0 flex-1 overflow-hidden">
      <div className="flex w-max items-center gap-1.5 text-accent [animation:uhnCowMarquee_10s_linear_infinite]">
        {cowIcons.map((index) => (
          <CowIcon key={`cow-a-${index}`} size={14} weight="fill" />
        ))}
        {cowIcons.map((index) => (
          <CowIcon key={`cow-b-${index}`} size={14} weight="fill" />
        ))}
      </div>
    </div>
  </div>
);

const FetchedToast = () => (
  <div className="flex h-5 min-w-0 items-center gap-2 text-sm font-medium text-white">
    <ConfettiIcon size={16} weight="fill" color="white" />
    <span>latest stories fetched.</span>
  </div>
);

export function ReactProviders({ children }: { children: ReactNode }) {
  const toastIdRef = useRef<string | number | null>(null);
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
      toastIdRef.current = toast.custom(() => <FetchingToast />, {
        className: "uhn-refresh-toast",
        id: toastIdRef.current ?? undefined,
        style: neutralToastStyle,
      });
      try {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["storyIds"] }),
          queryClient.invalidateQueries({ queryKey: ["item"] }),
          queryClient.invalidateQueries({ queryKey: ["user"] }),
          queryClient.invalidateQueries({ queryKey: ["search"] }),
        ]);
        await queryClient.refetchQueries({ type: "active" });
        if (toastIdRef.current != null) {
          toast.dismiss(toastIdRef.current);
        }
        toast.custom(() => <FetchedToast />, {
          className: "uhn-refresh-toast",
          style: successToastStyle,
        });
      } catch {
        if (toastIdRef.current != null) {
          toast.dismiss(toastIdRef.current);
        }
        toast.error("failed to refresh stories.", {
          style: errorToastStyle,
        });
      } finally {
        refreshing = false;
        toastIdRef.current = null;
        window.dispatchEvent(new Event("uhn:refresh:done"));
      }
    };

    window.addEventListener("uhn:refresh", refreshNow);
    return () => window.removeEventListener("uhn:refresh", refreshNow);
  }, [queryClient]);

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
        <ThemeProvider>
          {children}
          <ThemedToaster />
        </ThemeProvider>
      </ReadStateProvider>
    </PersistQueryClientProvider>
  );
}
