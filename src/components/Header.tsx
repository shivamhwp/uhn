import {
  ArrowClockwise as ArrowClockwiseIcon,
  Briefcase as BriefcaseIcon,
  ChatCircle as ChatCircleIcon,
  Clock as ClockIcon,
  Eye as EyeIcon,
  Fire as FireIcon,
  Keyboard as KeyboardIcon,
  MagnifyingGlass as MagnifyingGlassIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
  Trophy as TrophyIcon,
  X as XIcon,
} from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import type { FeedType, Route } from "../lib/types";
import { useTheme } from "./ThemeProvider";

const feeds: {
  type: FeedType;
  label: string;
  icon: typeof FireIcon;
  key: string;
}[] = [
  { type: "top", label: "Top", icon: FireIcon, key: "1" },
  { type: "new", label: "New", icon: ClockIcon, key: "2" },
  { type: "best", label: "Best", icon: TrophyIcon, key: "3" },
  { type: "ask", label: "Ask", icon: ChatCircleIcon, key: "4" },
  { type: "show", label: "Show", icon: EyeIcon, key: "5" },
  { type: "jobs", label: "Jobs", icon: BriefcaseIcon, key: "6" },
];

interface Props {
  route: Route;
  onFeedChange: (type: FeedType) => void;
  searchOpen: boolean;
  searchQuery: string;
  onSearchOpen: () => void;
  onSearchClose: () => void;
  onSearchQueryChange: (query: string) => void;
  onToggleShortcuts: () => void;
}

export function Header({
  route,
  onFeedChange,
  searchOpen,
  searchQuery,
  onSearchOpen,
  onSearchClose,
  onSearchQueryChange,
  onToggleShortcuts,
}: Props) {
  const { theme, toggle } = useTheme();
  const queryClient = useQueryClient();
  const activeFeed = route.view === "feed" ? route.feedType : null;
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["storyIds"] });
  };

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
  }, [searchOpen]);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-bg/80 backdrop-blur-md border-b border-edge">
      <div className="max-w-4xl mx-auto px-4 h-14 flex items-center gap-1.5">
        {/* Logo */}
        <button
          onClick={() => onFeedChange("top")}
          className="shrink-0 group rounded-md p-1 hover:bg-surface-hover transition-colors"
          aria-label="Go to top stories"
        >
          <img src="/favicon.svg" alt="" className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <div className="flex-1 min-w-0">
          {searchOpen ? (
            <div className="relative w-full">
              <MagnifyingGlassIcon
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint"
              />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder="Search stories..."
                className="w-full h-10 box-border pl-9 pr-9 rounded-md border border-edge bg-surface text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/50"
              />
              <button
                onClick={() => onSearchQueryChange("")}
                className={`absolute right-2 top-1/2 -translate-y-1/2 transition-colors p-1 ${
                  searchQuery ? "text-fg-faint hover:text-fg" : "invisible pointer-events-none"
                }`}
                aria-label="Clear search"
                tabIndex={searchQuery ? 0 : -1}
              >
                <XIcon size={14} />
              </button>
            </div>
          ) : (
            <nav className="w-full flex items-center gap-1 overflow-x-auto scrollbar-none">
              {feeds.map((feed) => {
                const isActive = activeFeed === feed.type;
                const Icon = feed.icon;
                return (
                  <button
                    key={feed.type}
                    onClick={() => onFeedChange(feed.type)}
                    className={`h-9 min-w-[48px] sm:min-w-[74px] px-2.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap inline-flex items-center justify-center gap-1.5 ${
                      isActive
                        ? "bg-accent-subtle text-accent"
                        : "text-fg-muted hover:text-fg hover:bg-surface-hover"
                    }`}
                  >
                    <span className="inline-flex h-4 w-4 items-center justify-center">
                      <Icon size={14} weight="regular" />
                    </span>
                    <span className="hidden sm:inline">{feed.label}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-md text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
            title="Refresh feeds (r)"
          >
            <ArrowClockwiseIcon size={16} />
          </button>
          <button
            onClick={() => {
              if (searchOpen) onSearchClose();
              else onSearchOpen();
            }}
            className={`p-2 rounded-md transition-colors ${
              searchOpen
                ? "text-accent bg-accent-subtle"
                : "text-fg-muted hover:text-fg hover:bg-surface-hover"
            }`}
            title="Search (/)"
          >
            <MagnifyingGlassIcon size={16} />
          </button>
          <button
            onClick={toggle}
            className="p-2 rounded-md text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
            title="Toggle theme (t)"
          >
            {theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
          </button>
          <button
            onClick={onToggleShortcuts}
            className="p-2 rounded-md text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors hidden sm:block"
            title="Keyboard shortcuts (?)"
          >
            <KeyboardIcon size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
