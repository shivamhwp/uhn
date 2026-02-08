import {
	ArrowClockwiseIcon,
	BriefcaseIcon,
	CaretDownIcon,
	ChatCircleIcon,
	ClockIcon,
	EyeIcon,
	FireIcon,
	KeyboardIcon,
	ListIcon,
	MagnifyingGlassIcon,
	MoonIcon,
	SunIcon,
	TrophyIcon,
	XIcon,
} from "@phosphor-icons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import type { FeedType, Route } from "../lib/types";
import { useTheme } from "./ThemeProvider";

const feeds = [
	{ type: "top", label: "Top", icon: FireIcon },
	{ type: "new", label: "New", icon: ClockIcon },
	{ type: "best", label: "Best", icon: TrophyIcon },
	{ type: "ask", label: "Ask", icon: ChatCircleIcon },
	{ type: "show", label: "Show", icon: EyeIcon },
	{ type: "jobs", label: "Jobs", icon: BriefcaseIcon },
] as const satisfies Array<{
	type: FeedType;
	label: string;
	icon: typeof FireIcon;
}>;

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
	const searchInputRef = useRef<HTMLInputElement>(null);
	const feedMenuRef = useRef<HTMLDivElement>(null);
	const [isFeedMenuOpen, setIsFeedMenuOpen] = useState(false);

	const activeFeed = route.view === "feed" ? route.feedType : "top";
	const activeFeedItem = useMemo(
		() => feeds.find((feed) => feed.type === activeFeed) ?? feeds[0],
		[activeFeed],
	);
	const ActiveFeedIcon = activeFeedItem.icon;

	useEffect(() => {
		if (!searchOpen) return;
		setIsFeedMenuOpen(false);
		requestAnimationFrame(() => searchInputRef.current?.focus());
	}, [searchOpen]);

	useEffect(() => {
		if (!isFeedMenuOpen) return;

		const handlePointerDown = (event: PointerEvent) => {
			if (feedMenuRef.current?.contains(event.target as Node)) return;
			setIsFeedMenuOpen(false);
		};

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === "Escape") setIsFeedMenuOpen(false);
		};

		document.addEventListener("pointerdown", handlePointerDown);
		window.addEventListener("keydown", handleEscape);

		return () => {
			document.removeEventListener("pointerdown", handlePointerDown);
			window.removeEventListener("keydown", handleEscape);
		};
	}, [isFeedMenuOpen]);

	const refreshFeeds = () => {
		queryClient.invalidateQueries({ queryKey: ["storyIds"] });
	};

	const selectFeed = (feedType: FeedType) => {
		setIsFeedMenuOpen(false);
		onFeedChange(feedType);
	};

	const toggleSearch = () => {
		if (searchOpen) {
			onSearchClose();
			return;
		}
		setIsFeedMenuOpen(false);
		onSearchOpen();
	};

	return (
		<header className="fixed top-0 left-0 right-0 z-40 border-b border-edge bg-bg/80 backdrop-blur-md">
			<div className="w-full max-w-4xl mx-auto px-0.5 sm:px-4 h-14 md:h-15 flex items-center gap-1 md:gap-2">
				<img src="/favicon.svg" alt="" className="h-5 w-5 sm:h-6 sm:w-6" />

				<div className="flex-1 min-w-0 relative" ref={feedMenuRef}>
					{/* Search input — always in DOM, toggled via CSS to prevent layout shift */}
					<div className={`relative w-full ${searchOpen ? "" : "hidden"}`}>
						<MagnifyingGlassIcon
							size={16}
							className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-faint"
						/>
						<input
							ref={searchInputRef}
							type="text"
							value={searchQuery}
							onChange={(event) => onSearchQueryChange(event.target.value)}
							placeholder="Search stories..."
							className="w-full h-10 box-border pl-9 pr-9 rounded-md border border-edge bg-surface text-sm text-fg placeholder:text-fg-faint focus:outline-none focus:ring-1 focus:ring-accent/30 focus:border-accent/50"
						/>
						<button
							onClick={() => onSearchQueryChange("")}
							className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 transition-colors ${
								searchQuery
									? "text-fg-faint hover:text-fg"
									: "invisible pointer-events-none"
							}`}
							aria-label="Clear search"
							tabIndex={searchQuery ? 0 : -1}
							type="button"
						>
							<XIcon size={14} />
						</button>
					</div>

					{/* Mobile feed dropdown trigger — always in DOM, toggled via CSS */}
					<button
						onClick={() => setIsFeedMenuOpen((open) => !open)}
						className={`w-full h-10 px-3 rounded-md border border-edge bg-surface text-sm text-fg inline-flex items-center justify-between hover:bg-surface-hover transition-colors ${searchOpen ? "hidden" : "md:hidden"}`}
						aria-haspopup="menu"
						aria-expanded={isFeedMenuOpen}
						aria-label="Open feed menu"
						type="button"
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

					{/* Mobile feed dropdown menu */}
					{!searchOpen && isFeedMenuOpen && (
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
										onClick={() => selectFeed(feed.type)}
										className={`w-full h-10 px-3 rounded-md text-sm transition-colors inline-flex items-center gap-2 ${
											isActive
												? "bg-accent-subtle text-accent"
												: "text-fg-muted hover:text-fg hover:bg-surface-hover"
										}`}
										role="menuitem"
										type="button"
									>
										<Icon size={14} />
										{feed.label}
									</button>
								);
							})}
						</div>
					)}

					{/* Desktop feed tabs — always in DOM, toggled via CSS */}
					<nav
						className={`hidden w-full items-center gap-1.5 ${searchOpen ? "" : "md:flex"}`}
					>
						{feeds.map((feed) => {
							const isActive = activeFeed === feed.type;
							const Icon = feed.icon;
							return (
								<button
									key={feed.type}
									onClick={() => selectFeed(feed.type)}
									className={`h-9 px-3 rounded-md text-xs font-medium transition-colors whitespace-nowrap inline-flex items-center justify-center gap-1.5 ${
										isActive
											? "bg-accent-subtle text-accent"
											: "text-fg-muted hover:text-fg hover:bg-surface-hover"
									}`}
									type="button"
								>
									<span className="inline-flex h-4 w-4 items-center justify-center">
										<Icon size={14} weight="regular" />
									</span>
									<span>{feed.label}</span>
								</button>
							);
						})}
					</nav>
				</div>

				<div className="flex items-center gap-0.5 md:ml-1 md:pl-2 md:border-l md:border-edge/70">
					<button
						onClick={refreshFeeds}
						className="p-2 rounded-md text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
						title="Refresh feeds (r)"
						type="button"
					>
						<ArrowClockwiseIcon size={16} />
					</button>
					<button
						onClick={toggleSearch}
						className={`p-2 rounded-md transition-colors ${
							searchOpen
								? "text-accent bg-accent-subtle"
								: "text-fg-muted hover:text-fg hover:bg-surface-hover"
						}`}
						title="Search (/)"
						type="button"
					>
						<MagnifyingGlassIcon size={16} />
					</button>
					<button
						onClick={toggle}
						className="p-2 rounded-md text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
						title="Toggle theme (t)"
						type="button"
					>
						{theme === "dark" ? <SunIcon size={16} /> : <MoonIcon size={16} />}
					</button>
					<button
						onClick={onToggleShortcuts}
						className="hidden sm:block p-2 rounded-md text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
						title="Keyboard shortcuts (?)"
						type="button"
					>
						<KeyboardIcon size={16} />
					</button>
				</div>
			</div>
		</header>
	);
}
