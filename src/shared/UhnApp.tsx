/** @jsxImportSource preact */
import type { ComponentChildren } from "preact";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import { fetchItem, fetchStoryIds, searchStories } from "../lib/api";
import { feedLabels, feedOrder, feedPath, isFeedType } from "../lib/feeds";
import type { AlgoliaHit, FeedType, HNItem } from "../lib/types";

const itemsPerPage = 30;
const maxItems = 180;
const readStoriesKey = "uhn:read-story-ids";

type LoadState = "idle" | "loading" | "ready" | "error";

type Story = HNItem & {
  title: string;
  type: "story" | "job";
};

type IconProps = {
  className?: string;
  size?: number;
};

declare global {
  interface Window {
    __LAKEBED_AUTH__?: unknown;
  }
}

const isStory = (item: HNItem | null): item is Story =>
  Boolean(
    item &&
    !item.deleted &&
    !item.dead &&
    item.title &&
    (item.type === "story" || item.type === "job"),
  );

const timeAgo = (timestamp: number) => {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 60) return `${Math.max(0, seconds)}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
};

const storyFromHit = (hit: AlgoliaHit): Story => ({
  by: hit.author,
  descendants: hit.num_comments,
  id: Number(hit.objectID),
  score: hit.points,
  time: hit.created_at_i,
  title: hit.title || "Untitled story",
  type: "story",
  url: hit.url,
});

const extractDomain = (url?: string) => {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
};

const openUrlInNewTab = (url: string) => {
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.target = "_blank";
  anchor.rel = "noopener noreferrer";
  anchor.referrerPolicy = "no-referrer";
  anchor.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
};

const isLakebed = () => Boolean(window.__LAKEBED_AUTH__);

const itemUrl = (storyId: number) =>
  isLakebed()
    ? `https://news.ycombinator.com/item?id=${storyId}`
    : `/item?id=${encodeURIComponent(storyId)}`;

const userUrl = (userId: string) =>
  isLakebed()
    ? `https://news.ycombinator.com/user?id=${encodeURIComponent(userId)}`
    : `/user?id=${encodeURIComponent(userId)}`;

const resolveStoryOpenUrl = (story: Pick<Story, "id" | "url">) =>
  story.url?.trim() || itemUrl(story.id);

const readStoredStoryIds = () => {
  try {
    const raw = localStorage.getItem(readStoriesKey);
    if (!raw) return new Set<number>();
    const ids = JSON.parse(raw);
    return new Set(Array.isArray(ids) ? ids.filter(Number.isFinite) : []);
  } catch {
    return new Set<number>();
  }
};

const writeStoredStoryIds = (ids: Set<number>) => {
  try {
    localStorage.setItem(readStoriesKey, JSON.stringify([...ids]));
  } catch {
    // Ignore private-mode and quota failures.
  }
};

const currentFeedFromLocation = (fallback: FeedType) => {
  const hashFeed = window.location.hash.replace(/^#\/?/, "").split("?")[0];
  if (isFeedType(hashFeed)) return hashFeed;

  const pathFeed = window.location.pathname.replace(/^\/+/, "").split("/")[0];
  return isFeedType(pathFeed) ? pathFeed : fallback;
};

const fetchFeedStories = async (feed: FeedType, limit: number, signal: AbortSignal) => {
  const ids = await fetchStoryIds(feed);
  if (signal.aborted) return [];

  const items = await Promise.all(ids.slice(0, limit).map((id) => fetchItem(id).catch(() => null)));

  if (signal.aborted) return [];
  return items.filter(isStory);
};

const fetchSearchStories = async (query: string, signal: AbortSignal) => {
  const result = await searchStories({ query, sortBy: "popular" });
  if (signal.aborted) return [];
  return result.hits.map(storyFromHit).filter((story) => story.id);
};

const installLakebedStyleBridge = () => {
  if (typeof document === "undefined" || document.getElementById("uhn-style-bridge")) return;

  const preconnect = document.createElement("link");
  preconnect.rel = "preconnect";
  preconnect.href = "https://fonts.gstatic.com";
  preconnect.crossOrigin = "anonymous";
  document.head.appendChild(preconnect);

  const fontLink = document.createElement("link");
  fontLink.rel = "stylesheet";
  fontLink.href =
    "https://fonts.googleapis.com/css2?family=Geist:wght@300;400;500;600;700&display=swap";
  document.head.appendChild(fontLink);

  const style = document.createElement("style");
  style.id = "uhn-style-bridge";
  style.textContent = `
    :root {
      --font-geist: "Geist", system-ui, sans-serif;
      --color-bg: #f8f8f6;
      --color-surface: #ffffff;
      --color-surface-hover: #f2f2f0;
      --color-edge: #e2e2df;
      --color-fg: #4d4d4d;
      --color-fg-muted: #8c8c8c;
      --color-fg-faint: #b3b3b3;
      --color-accent: #ff6600;
      --color-accent-hover: #e55a00;
      --color-accent-subtle: #ff66000d;
      --color-skeleton: #e8e8e5;
    }
    .dark {
      --color-bg: #0a0a0a;
      --color-surface: #141414;
      --color-surface-hover: #1c1c1c;
      --color-edge: #262626;
      --color-fg: #a8a5a0;
      --color-fg-muted: #737373;
      --color-fg-faint: #4a4a4a;
      --color-accent: #ff6600;
      --color-accent-hover: #ff7f2a;
      --color-accent-subtle: #ff660017;
      --color-skeleton: #1e1e1e;
    }
    html {
      background: var(--color-bg);
      color: var(--color-fg);
      font-family: var(--font-geist), system-ui, sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
      overscroll-behavior: none;
      scrollbar-gutter: stable;
    }
    body {
      background: var(--color-bg);
      color: var(--color-fg);
      font-family: var(--font-geist), system-ui, sans-serif;
      margin: 0;
      min-height: 100svh;
      min-height: 100dvh;
      overflow-x: clip;
      overscroll-behavior: none;
    }
    button, input, textarea, select {
      font: inherit;
    }
    * { scrollbar-width: none; -ms-overflow-style: none; }
    *::-webkit-scrollbar { display: none; width: 0; height: 0; }
    .bg-bg { background-color: var(--color-bg); }
    .bg-surface { background-color: var(--color-surface); }
    .bg-surface-hover { background-color: var(--color-surface-hover); }
    .bg-accent-subtle { background-color: var(--color-accent-subtle); }
    .bg-accent { background-color: var(--color-accent); }
    .border-edge { border-color: var(--color-edge); }
    .border-edge\\/50 { border-color: color-mix(in srgb, var(--color-edge) 50%, transparent); }
    .border-accent\\/30 { border-color: color-mix(in srgb, var(--color-accent) 30%, transparent); }
    .text-fg { color: var(--color-fg); }
    .text-fg\\/40 { color: color-mix(in srgb, var(--color-fg) 40%, transparent); }
    .text-fg\\/90 { color: color-mix(in srgb, var(--color-fg) 90%, transparent); }
    .text-fg-muted { color: var(--color-fg-muted); }
    .text-fg-faint { color: var(--color-fg-faint); }
    .text-fg-faint\\/60 { color: color-mix(in srgb, var(--color-fg-faint) 60%, transparent); }
    .text-fg-faint\\/85 { color: color-mix(in srgb, var(--color-fg-faint) 85%, transparent); }
    .text-accent { color: var(--color-accent); }
    .text-accent\\/60 { color: color-mix(in srgb, var(--color-accent) 60%, transparent); }
    .text-accent\\/80 { color: color-mix(in srgb, var(--color-accent) 80%, transparent); }
    .placeholder\\:text-fg-faint::placeholder { color: var(--color-fg-faint); }
    .hover\\:bg-surface-hover:hover { background-color: var(--color-surface-hover); }
    .hover\\:bg-accent-subtle:hover { background-color: var(--color-accent-subtle); }
    .hover\\:text-fg:hover { color: var(--color-fg); }
    .hover\\:text-accent:hover { color: var(--color-accent); }
    .group:hover .group-hover\\:text-accent { color: var(--color-accent); }
    .focus\\:border-accent\\/50:focus { border-color: color-mix(in srgb, var(--color-accent) 50%, transparent); }
    .focus\\:ring-accent\\/30:focus { --tw-ring-color: color-mix(in srgb, var(--color-accent) 30%, transparent); }
    .shadow-black\\/10 { --tw-shadow-color: rgb(0 0 0 / 0.1); }
    .line-clamp-2 {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .app-shell {
      height: 100svh;
      height: 100dvh;
      min-height: 100svh;
      min-height: 100dvh;
      padding-top: env(safe-area-inset-top);
      padding-right: max(0.125rem, env(safe-area-inset-right));
      padding-left: max(0.125rem, env(safe-area-inset-left));
    }
    @media (min-width: 640px) {
      .app-shell {
        padding-right: max(1rem, env(safe-area-inset-right));
        padding-left: max(1rem, env(safe-area-inset-left));
      }
    }
    .app-main { padding-bottom: env(safe-area-inset-bottom); }
    .app-scroll {
      height: 100%;
      min-height: 0;
      overflow-y: auto;
      overflow-x: clip;
      overscroll-behavior: none;
      -webkit-overflow-scrolling: touch;
      touch-action: pan-y pinch-zoom;
    }
    .animate-entry { animation: uhnFadeSlideIn 0.3s ease both; }
    .animate-fade { animation: uhnFadeIn 0.25s ease both; }
    .skeleton {
      background: linear-gradient(90deg, var(--color-skeleton) 25%, var(--color-surface-hover) 50%, var(--color-skeleton) 75%);
      background-size: 200% 100%;
      animation: uhnShimmer 1.5s ease infinite;
      border-radius: 3px;
    }
    @keyframes uhnFadeSlideIn {
      from { opacity: 0; transform: translateY(6px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes uhnFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes uhnShimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }
  `;
  document.head.appendChild(style);
};

const applyInitialTheme = () => {
  if (typeof document === "undefined") return;

  const stored = localStorage.getItem("hn-theme");
  const theme =
    stored || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.classList.toggle("dark", theme === "dark");
};

const IconShell = ({
  children,
  className = "",
  size = 16,
}: IconProps & { children: ComponentChildren }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    height={size}
    stroke="currentColor"
    stroke-linecap="round"
    stroke-linejoin="round"
    stroke-width="2"
    viewBox="0 0 24 24"
    width={size}
  >
    {children}
  </svg>
);

const RefreshIcon = (props: IconProps) => (
  <IconShell {...props}>
    <path d="M20 6v5h-5" />
    <path d="M4 18v-5h5" />
    <path d="M19 11a7 7 0 0 0-11.8-4.7L4 9" />
    <path d="M5 13a7 7 0 0 0 11.8 4.7L20 15" />
  </IconShell>
);

const SearchIcon = (props: IconProps) => (
  <IconShell {...props}>
    <circle cx="11" cy="11" r="7" />
    <path d="m20 20-3.5-3.5" />
  </IconShell>
);

const XIcon = (props: IconProps) => (
  <IconShell {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </IconShell>
);

const MoonIcon = (props: IconProps) => (
  <IconShell {...props}>
    <path d="M21 14.5A8.5 8.5 0 0 1 9.5 3 7 7 0 1 0 21 14.5Z" />
  </IconShell>
);

const SunIcon = (props: IconProps) => (
  <IconShell {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2" />
    <path d="M12 20v2" />
    <path d="m4.93 4.93 1.41 1.41" />
    <path d="m17.66 17.66 1.41 1.41" />
    <path d="M2 12h2" />
    <path d="M20 12h2" />
    <path d="m6.34 17.66-1.41 1.41" />
    <path d="m19.07 4.93-1.41 1.41" />
  </IconShell>
);

const CaretDownIcon = (props: IconProps) => (
  <IconShell {...props}>
    <path d="m6 9 6 6 6-6" />
  </IconShell>
);

const CheckIcon = (props: IconProps) => (
  <IconShell {...props}>
    <path d="m20 6-11 11-5-5" />
  </IconShell>
);

const UpIcon = ({ className = "", size = 11 }: IconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="currentColor"
    height={size}
    viewBox="0 0 24 24"
    width={size}
  >
    <path d="M12 3 4 13h5v8h6v-8h5L12 3Z" />
  </svg>
);

const ChatIcon = (props: IconProps) => (
  <IconShell {...props}>
    <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
  </IconShell>
);

const DotsIcon = ({ className = "", size = 28 }: IconProps) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="currentColor"
    height={size}
    viewBox="0 0 24 24"
    width={size}
  >
    <circle cx="12" cy="5" r="2" />
    <circle cx="12" cy="12" r="2" />
    <circle cx="12" cy="19" r="2" />
  </svg>
);

const SpinnerIcon = ({ className = "", size = 18 }: IconProps) => (
  <IconShell className={className} size={size}>
    <path d="M21 12a9 9 0 1 1-6.2-8.56" />
  </IconShell>
);

const LoadingNotice = ({ className = "" }: { className?: string }) => (
  <div
    className={`flex flex-col items-center justify-center gap-2 text-sm text-fg-faint ${className}`.trim()}
  >
    <SpinnerIcon className="animate-spin text-fg-muted" />
    <span>slow down buddy</span>
  </div>
);

const StoryRow = ({
  isRead,
  isSelected,
  onClick,
  onExternal,
  onHover,
  onMenuToggle,
  onUserClick,
  rank,
  showMenu,
  story,
}: {
  isRead: boolean;
  isSelected: boolean;
  onClick: () => void;
  onExternal: () => void;
  onHover: () => void;
  onMenuToggle: () => void;
  onUserClick: (id: string) => void;
  rank: number;
  showMenu: boolean;
  story: Story;
}) => (
  <div
    className={`group relative flex cursor-pointer items-stretch border-b border-edge/50 transition-colors duration-100 ${
      isSelected ? "bg-accent-subtle" : "hover:bg-surface-hover"
    }`}
    data-rank={rank}
    onClick={onClick}
    onKeyDown={(event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        onClick();
      }
    }}
    onMouseEnter={onHover}
    role="button"
    tabIndex={0}
  >
    <div className="hidden sm:flex w-9 shrink-0 items-center justify-center">
      <span
        className={`text-sm font-mono tabular-nums leading-none ${
          isSelected ? "text-accent/60" : "text-fg-faint"
        }`}
      >
        {rank}
      </span>
    </div>

    <div className="flex min-w-0 flex-1 flex-col justify-center gap-2.5 py-4 sm:py-5 pr-3 sm:pl-0 pl-3">
      <div className="flex min-w-0 items-baseline gap-2">
        <h3
          className={`min-w-0 flex-1 line-clamp-2 text-lg font-medium leading-tight tracking-tight ${
            isSelected
              ? "text-accent"
              : isRead
                ? "text-fg/40 group-hover:text-accent"
                : "text-fg/90 group-hover:text-accent"
          } transition-colors`}
        >
          {story.title}
        </h3>
      </div>

      <div
        className={`flex min-w-0 items-center gap-x-3 overflow-hidden text-base leading-none ${
          isRead ? "text-fg-faint/85" : "text-fg-faint"
        }`}
      >
        {story.score != null && (
          <span className="flex shrink-0 items-center gap-0.5 text-accent/80 font-medium tabular-nums">
            <UpIcon />
            {story.score}
          </span>
        )}
        {story.by && (
          <button
            className="shrink-0 max-w-32 truncate text-left text-fg-muted hover:text-accent transition-colors"
            onClick={(event) => {
              event.stopPropagation();
              onUserClick(story.by!);
            }}
            type="button"
          >
            {story.by}
          </button>
        )}
        <span className="shrink-0">{timeAgo(story.time)}</span>
        {story.descendants != null && (
          <span className="flex shrink-0 items-center gap-0.5 text-fg-muted">
            <ChatIcon size={11} />
            {story.descendants}
          </span>
        )}
        {story.url && (
          <span className="hidden min-w-0 truncate text-fg-faint/85 md:block">
            {extractDomain(story.url)}
          </span>
        )}
      </div>
    </div>

    <div className="relative flex shrink-0 items-center justify-center px-3">
      <button
        aria-label="Story actions"
        className={`cursor-pointer text-fg-faint/60 transition-colors hover:text-accent ${
          showMenu ? "text-accent opacity-100" : "sm:opacity-0 sm:group-hover:opacity-100"
        }`}
        onClick={(event) => {
          event.stopPropagation();
          onMenuToggle();
        }}
        type="button"
      >
        <DotsIcon />
      </button>

      {showMenu && (
        <div
          className="absolute right-2 top-[calc(50%+1rem)] z-50 min-w-40 overflow-hidden rounded-md border border-edge bg-surface p-1 text-fg shadow-xl shadow-black/10 animate-entry"
          onClick={(event) => event.stopPropagation()}
        >
          {story.url && (
            <button
              className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent-subtle hover:text-accent"
              onClick={onExternal}
              type="button"
            >
              Open original URL
            </button>
          )}
          <button
            className="flex w-full items-center rounded-sm px-2 py-1.5 text-sm transition-colors hover:bg-accent-subtle hover:text-accent"
            onClick={onClick}
            type="button"
          >
            Open thread
          </button>
        </div>
      )}
    </div>
  </div>
);

export function SharedUhnApp({ initialFeed = "top" }: { initialFeed?: FeedType }) {
  const [feed, setFeed] = useState<FeedType>(() => currentFeedFromLocation(initialFeed));
  const [stories, setStories] = useState<Story[]>([]);
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [openMenuId, setOpenMenuId] = useState<number | null>(null);
  const [status, setStatus] = useState<LoadState>("idle");
  const [error, setError] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [localQuery, setLocalQuery] = useState("");
  const [readStoryIds, setReadStoryIds] = useState<Set<number>>(() => new Set());
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLButtonElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const rowRefs = useRef(new Map<number, HTMLDivElement>());

  const isLocalSearch = isLakebed() && localQuery.trim().length > 0;
  const selectedStory = stories[selectedIndex];
  const hasMore = !isLocalSearch && visibleCount < maxItems;
  const activeFeedLabel = feedLabels[feed];
  const loadMore = useCallback(() => {
    if (!hasMore || status === "loading") return;
    setVisibleCount((count) => Math.min(maxItems, count + itemsPerPage));
  }, [hasMore, status]);

  useEffect(() => {
    installLakebedStyleBridge();
    applyInitialTheme();
    setReadStoryIds(readStoredStoryIds());
    setTheme(document.documentElement.classList.contains("dark") ? "dark" : "light");
  }, []);

  useEffect(() => {
    const onLocationChange = () => setFeed(currentFeedFromLocation(initialFeed));
    window.addEventListener("hashchange", onLocationChange);
    window.addEventListener("popstate", onLocationChange);
    return () => {
      window.removeEventListener("hashchange", onLocationChange);
      window.removeEventListener("popstate", onLocationChange);
    };
  }, [initialFeed]);

  const loadStories = useCallback(() => {
    const controller = new AbortController();
    setStatus("loading");
    setError("");

    const request = isLocalSearch
      ? fetchSearchStories(localQuery.trim(), controller.signal)
      : fetchFeedStories(feed, visibleCount, controller.signal);

    request
      .then((nextStories) => {
        if (controller.signal.aborted) return;
        setStories(nextStories);
        setSelectedIndex((index) => Math.min(index, Math.max(0, nextStories.length - 1)));
        setStatus("ready");
      })
      .catch((reason) => {
        if (controller.signal.aborted) return;
        setError(reason instanceof Error ? reason.message : "Unable to load stories");
        setStatus("error");
      });

    return () => controller.abort();
  }, [feed, isLocalSearch, localQuery, visibleCount]);

  useEffect(() => loadStories(), [loadStories]);

  useEffect(() => {
    const refresh = () => loadStories();
    window.addEventListener("uhn:refresh", refresh);
    return () => window.removeEventListener("uhn:refresh", refresh);
  }, [loadStories]);

  const markRead = useCallback((storyId: number) => {
    setReadStoryIds((current) => {
      const next = new Set(current);
      next.add(storyId);
      writeStoredStoryIds(next);
      return next;
    });
  }, []);

  const selectStory = useCallback(
    (index: number) => {
      const next = Math.max(0, Math.min(stories.length - 1, index));
      setSelectedIndex(next);
      const story = stories[next];
      if (story) {
        rowRefs.current.get(story.id)?.scrollIntoView({ block: "nearest" });
      }
      if (next >= stories.length - 4) loadMore();
    },
    [loadMore, stories],
  );

  useEffect(() => {
    const sentinel = loadMoreRef.current;
    const root = scrollRef.current;
    if (!sentinel || !root || !hasMore || status === "loading") return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) loadMore();
      },
      { root, rootMargin: "240px 0px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, status, stories.length]);

  const openStory = useCallback(
    (story: Story) => {
      markRead(story.id);
      window.location.assign(itemUrl(story.id));
    },
    [markRead],
  );

  const openExternal = useCallback(
    (story: Story) => {
      markRead(story.id);
      openUrlInNewTab(resolveStoryOpenUrl(story));
      setOpenMenuId(null);
    },
    [markRead],
  );

  const goToFeed = useCallback((nextFeed: FeedType) => {
    setFeed(nextFeed);
    setVisibleCount(itemsPerPage);
    setSelectedIndex(0);
    setLocalQuery("");
    setMobileMenuOpen(false);
    if (isLakebed()) {
      window.history.pushState(null, "", `/#${nextFeed}`);
      return;
    }
    window.history.pushState(null, "", feedPath(nextFeed));
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((current) => {
      const next = current === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      localStorage.setItem("hn-theme", next);
      return next;
    });
  }, []);

  const onSearchSubmit = useCallback(
    (event: Event) => {
      event.preventDefault();
      const nextQuery = query.trim();
      if (!nextQuery) return;

      if (isLakebed()) {
        setLocalQuery(nextQuery);
        setSelectedIndex(0);
        setSearchOpen(false);
        return;
      }

      window.location.assign(`/search?q=${encodeURIComponent(nextQuery)}`);
    },
    [query],
  );

  useEffect(() => {
    if (searchOpen) {
      requestAnimationFrame(() => searchInputRef.current?.focus());
    }
  }, [searchOpen]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT";

      if (typing && event.key !== "Escape") return;

      if (event.key === "j" || event.key === "ArrowDown") {
        event.preventDefault();
        selectStory(selectedIndex + 1);
      }
      if (event.key === "k" || event.key === "ArrowUp") {
        event.preventDefault();
        selectStory(selectedIndex - 1);
      }
      if (event.key === "Enter" && selectedStory) {
        event.preventDefault();
        openStory(selectedStory);
      }
      if (event.key === "o" && selectedStory) {
        event.preventDefault();
        openExternal(selectedStory);
      }
      if (event.key === "/") {
        event.preventDefault();
        setSearchOpen(true);
      }
      if (event.key === "Escape") {
        setSearchOpen(false);
        setMobileMenuOpen(false);
        setOpenMenuId(null);
        setLocalQuery("");
      }
      if (event.key === "t") toggleTheme();
      if (event.key === "r") loadStories();
      if (event.key === "]" && hasMore) loadMore();
      if (event.key === "[") {
        setVisibleCount((count) => Math.max(itemsPerPage, count - itemsPerPage));
        scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
      }
      if (/^[1-6]$/.test(event.key)) {
        const nextFeed = feedOrder[Number(event.key) - 1];
        if (nextFeed) {
          event.preventDefault();
          goToFeed(nextFeed);
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    goToFeed,
    hasMore,
    loadStories,
    loadMore,
    openExternal,
    openStory,
    selectStory,
    selectedIndex,
    selectedStory,
    toggleTheme,
  ]);

  const visibleTitle = useMemo(
    () => (localQuery.trim() ? `Search: ${localQuery.trim()}` : activeFeedLabel),
    [activeFeedLabel, localQuery],
  );

  return (
    <div className="app-shell box-border mx-auto flex h-screen min-h-dvh w-full max-w-4xl flex-col bg-bg text-fg">
      <header className="shrink-0 border-b border-edge bg-bg px-2.5">
        <div className="h-14 md:h-15 flex items-center gap-2">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            <div className={`${searchOpen ? "hidden" : "flex"} flex-1 min-w-0 items-center`}>
              <nav className="hidden md:flex items-center gap-1.5">
                {feedOrder.map((feedType) => (
                  <button
                    className={`inline-flex h-9 items-center justify-center whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ${
                      feed === feedType && !localQuery
                        ? "bg-accent-subtle text-accent border border-accent/30"
                        : "text-fg-muted hover:text-fg hover:bg-surface-hover"
                    }`}
                    key={feedType}
                    onClick={() => goToFeed(feedType)}
                    type="button"
                  >
                    {feedLabels[feedType]}
                  </button>
                ))}
              </nav>

              <div className="md:hidden relative flex w-full min-w-0">
                <button
                  aria-controls="mobile-feed-menu"
                  aria-expanded={mobileMenuOpen}
                  aria-haspopup="menu"
                  className="inline-flex h-10 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-edge bg-surface px-3 text-base text-fg transition-colors hover:bg-surface-hover"
                  onClick={() => setMobileMenuOpen((open) => !open)}
                  type="button"
                >
                  <span className="truncate text-left">{visibleTitle}</span>
                  <CaretDownIcon
                    className={`text-fg-faint transition-transform duration-200 ${mobileMenuOpen ? "rotate-180" : ""}`}
                    size={14}
                  />
                </button>

                {mobileMenuOpen && (
                  <div
                    className="absolute left-0 right-0 top-[calc(100%+0.45rem)] z-50 w-full min-w-0 rounded-md border border-edge bg-surface shadow-lg p-1 animate-entry"
                    id="mobile-feed-menu"
                    role="menu"
                  >
                    {feedOrder.map((feedType) => {
                      const active = feed === feedType && !localQuery;
                      return (
                        <button
                          className={`inline-flex h-9 w-full items-center justify-between rounded-sm px-2.5 text-base transition-colors ${
                            active
                              ? "bg-accent-subtle text-accent"
                              : "text-fg-muted hover:text-fg hover:bg-surface-hover"
                          }`}
                          key={feedType}
                          onClick={() => goToFeed(feedType)}
                          role="menuitem"
                          type="button"
                        >
                          <span>{feedLabels[feedType]}</span>
                          {active && <CheckIcon size={14} />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <form
              className={`${searchOpen ? "flex" : "hidden"} flex-1 min-w-0 items-center gap-2`}
              onSubmit={onSearchSubmit}
            >
              <div className="relative flex-1 min-w-0">
                <SearchIcon
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint"
                  size={16}
                />
                <input
                  className="box-border h-10 w-full rounded-md border border-edge bg-surface pl-9 pr-3 text-base text-fg placeholder:text-fg-faint focus:border-accent/50 focus:outline-none focus:ring-1 focus:ring-accent/30"
                  onInput={(event) => setQuery(event.currentTarget.value)}
                  placeholder="Search stories..."
                  ref={searchInputRef}
                  type="search"
                  value={query}
                />
              </div>
              <button
                className="p-2 rounded-md text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
                onClick={() => setSearchOpen(false)}
                title="Close search"
                type="button"
              >
                <XIcon size={16} />
              </button>
            </form>
          </div>

          <div className="flex items-center gap-1">
            <button
              aria-busy={status === "loading"}
              className="p-2 rounded-md text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
              onClick={loadStories}
              title="Refresh feeds"
              type="button"
            >
              <RefreshIcon className={status === "loading" ? "animate-spin" : ""} size={16} />
            </button>
            <button
              aria-controls="header-search-form"
              aria-expanded={searchOpen}
              className="p-2 rounded-md text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
              onClick={() => setSearchOpen(true)}
              title="Search"
              type="button"
            >
              <SearchIcon size={16} />
            </button>
            <button
              className="p-2 rounded-md text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
              onClick={toggleTheme}
              title="Toggle theme"
              type="button"
            >
              {theme === "dark" ? <MoonIcon size={16} /> : <SunIcon size={16} />}
            </button>
          </div>
        </div>
      </header>

      <main className="app-main min-h-0 flex flex-1 flex-col overflow-hidden">
        {status === "error" && (
          <div className="border-b border-edge bg-surface px-3 py-2 text-sm text-fg">{error}</div>
        )}

        {localQuery && (
          <div className="flex items-center justify-between gap-3 border-b border-edge bg-surface px-3 py-2 text-sm">
            <span className="truncate text-fg-muted">Showing search results for {localQuery}</span>
            <button
              className="shrink-0 rounded-sm px-2 py-1 text-accent hover:bg-accent-subtle"
              onClick={() => setLocalQuery("")}
              type="button"
            >
              Clear
            </button>
          </div>
        )}

        {status === "loading" && stories.length === 0 ? (
          <LoadingNotice className="py-16 animate-fade" />
        ) : (
          <div className="flex min-h-0 flex-1">
            <div className="app-scroll flex-1" ref={scrollRef}>
              {stories.map((story, index) => (
                <div
                  key={story.id}
                  ref={(node) => {
                    if (node) rowRefs.current.set(story.id, node);
                    else rowRefs.current.delete(story.id);
                  }}
                >
                  <StoryRow
                    isRead={readStoryIds.has(story.id)}
                    isSelected={index === selectedIndex}
                    onClick={() => openStory(story)}
                    onExternal={() => openExternal(story)}
                    onHover={() => setSelectedIndex(index)}
                    onMenuToggle={() => setOpenMenuId((id) => (id === story.id ? null : story.id))}
                    onUserClick={(id) => {
                      if (isLakebed()) {
                        openUrlInNewTab(userUrl(id));
                        return;
                      }
                      window.location.assign(userUrl(id));
                    }}
                    rank={index + 1}
                    showMenu={openMenuId === story.id}
                    story={story}
                  />
                </div>
              ))}

              {(hasMore || status === "loading") && (
                <button
                  className="flex w-full items-center justify-center py-6"
                  disabled={status === "loading"}
                  onClick={loadMore}
                  ref={loadMoreRef}
                  type="button"
                >
                  <LoadingNotice />
                </button>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
