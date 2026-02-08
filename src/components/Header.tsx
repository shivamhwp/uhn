import {
  ArrowClockwise as ArrowClockwiseIcon,
  Briefcase as BriefcaseIcon,
  CaretDown as CaretDownIcon,
  ChatCircle as ChatCircleIcon,
  Clock as ClockIcon,
  Eye as EyeIcon,
  Fire as FireIcon,
  Keyboard as KeyboardIcon,
  List as ListIcon,
  MagnifyingGlass as MagnifyingGlassIcon,
  Moon as MoonIcon,
  Sun as SunIcon,
  Trophy as TrophyIcon,
  X as XIcon,
} from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import type { FeedType, Route } from "../lib/types";
import { useTheme } from "./ThemeProvider";

const feeds: {
  type: FeedType;
  label: string;
  icon: typeof FireIcon;
}[] = [
  { type: "top", label: "Top", icon: FireIcon },
  { type: "new", label: "New", icon: ClockIcon },
  { type: "best", label: "Best", icon: TrophyIcon },
  { type: "ask", label: "Ask", icon: ChatCircleIcon },
  { type: "show", label: "Show", icon: EyeIcon },
  { type: "jobs", label: "Jobs", icon: BriefcaseIcon },
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
  const feedMenuRef = useRef<HTMLDivElement>(null);
  const [isFeedMenuOpen, setIsFeedMenuOpen] = useState(false);
  const activeFeedItem = feeds.find((feed) => feed.type === activeFeed) ?? feeds[0];
  const ActiveFeedIcon = activeFeedItem.icon;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ["storyIds"] });
  };

  useEffect(() => {
    if (!searchOpen) return;
    searchInputRef.current?.focus();
    setIsFeedMenuOpen(false);
  }, [searchOpen]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (feedMenuRef.current?.contains(event.target as Node)) return;
      setIsFeedMenuOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-bg/80 backdrop-blur-md border-b border-edge">
      <div className="max-w-5xl mx-auto px-4 md:px-5 h-14 md:h-15 flex items-center gap-1.5 md:gap-2">
        {/* Logo */}
        <button
          onClick={() => onFeedChange("top")}
          className="shrink-0 group rounded-md p-1 hover:bg-surface-hover transition-colors"
          aria-label="Go to top stories"
        >
          <img src="/favicon.svg" alt="" className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        <div className="flex-1 min-w-0 relative" ref={feedMenuRef}>
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
            <>
              <button
                onClick={() => setIsFeedMenuOpen((open) => !open)}
                className="md:hidden w-full h-10 px-3 rounded-md border border-edge bg-surface text-sm text-fg inline-flex items-center justify-between hover:bg-surface-hover transition-colors"
                aria-haspopup="menu"
                aria-expanded={isFeedMenuOpen}
                aria-label="Open feed menu"
              >
                <span className="inline-flex items-center gap-2">
                  <ListIcon size={16} className="text-fg-muted" />
                  <span className="inline-flex items-center gap-1.5">
                    <ActiveFeedIcon size={14} className="text-accent" />
                    {activeFeedItem.label}
                  </span>
                </span>
                <CaretDownIcon
                  size={14}
                  className={`text-fg-muted transition-transform ${isFeedMenuOpen ? "rotate-180" : ""}`}
                />
              </button>

              {isFeedMenuOpen && (
                <div
                  className="md:hidden absolute top-[calc(100%+0.5rem)] left-0 right-0 rounded-md border border-edge bg-surface shadow-lg p-1 animate-entry"
                  role="menu"
                >
                  {feeds.map((feed) => {
                    const isActive = activeFeed === feed.type;
                    const Icon = feed.icon;
                    return (
                      <button
                        key={feed.type}
                        onClick={() => {
                          onFeedChange(feed.type);
                          setIsFeedMenuOpen(false);
                        }}
                        className={`w-full h-10 px-3 rounded-md text-sm transition-colors inline-flex items-center gap-2 ${
                          isActive
                            ? "bg-accent-subtle text-accent"
                            : "text-fg-muted hover:text-fg hover:bg-surface-hover"
                        }`}
                        role="menuitem"
                      >
                        <Icon size={14} />
                        {feed.label}
                      </button>
                    );
                  })}
                </div>
              )}

              <nav className="hidden md:flex w-full items-center gap-1.5">
                {feeds.map((feed) => {
                  const isActive = activeFeed === feed.type;
                  const Icon = feed.icon;
                  return (
                    <button
                      key={feed.type}
                      onClick={() => onFeedChange(feed.type)}
                      className={`h-9 min-w-[72px] px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap inline-flex items-center justify-center gap-1.5 ${
                        isActive
                          ? "bg-accent-subtle text-accent"
                          : "text-fg-muted hover:text-fg hover:bg-surface-hover"
                      }`}
                    >
                      <span className="inline-flex h-4 w-4 items-center justify-center">
                        <Icon size={14} weight="regular" />
                      </span>
                      <span>{feed.label}</span>
                    </button>
                  );
                })}
              </nav>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 md:ml-1 md:pl-2 md:border-l md:border-edge/70">
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
