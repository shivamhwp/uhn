import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
	useCallback,
	useEffect,
	useMemo,
	useState,
	useSyncExternalStore,
} from "react";
import type { FeedType, Route } from "../lib/types";
import { isInputFocused } from "../lib/utils";
import { Header } from "./Header";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { SearchResultsList } from "./SearchResultsList";
import { StoryDetail } from "./StoryDetail";
import { StoryList } from "./StoryList";
import { ThemeProvider } from "./ThemeProvider";
import { UserProfile } from "./UserProfile";

const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			retry: 2,
			refetchOnWindowFocus: false,
			gcTime: 24 * 60 * 60 * 1000,
		},
	},
});

function parseHash(hash: string): Route {
	const clean = hash.replace(/^#\/?/, "");
	if (!clean || clean === "top") return { view: "feed", feedType: "top" };
	if (
		clean === "new" ||
		clean === "best" ||
		clean === "ask" ||
		clean === "show" ||
		clean === "jobs"
	) {
		return { view: "feed", feedType: clean as FeedType };
	}
	const storyMatch = clean.match(/^story\/(\d+)$/);
	if (storyMatch) return { view: "story", id: parseInt(storyMatch[1], 10) };
	const userMatch = clean.match(/^user\/(.+)$/);
	if (userMatch) return { view: "user", id: decodeURIComponent(userMatch[1]) };
	return { view: "feed", feedType: "top" };
}

// --- Hash-based routing via useSyncExternalStore ---
const scrollPositions = new Map<string, number>();
let trackedHash =
	typeof window !== "undefined" ? window.location.hash || "#top" : "#top";

function subscribeToHash(callback: () => void) {
	const handler = () => {
		// Save scroll position for the route we're leaving
		scrollPositions.set(trackedHash, window.scrollY);
		trackedHash = window.location.hash || "#top";
		callback();
	};
	window.addEventListener("hashchange", handler);
	return () => window.removeEventListener("hashchange", handler);
}

function getHashSnapshot() {
	return window.location.hash || "#top";
}

function getHashServerSnapshot() {
	return "#top";
}

function AppShell() {
	const hash = useSyncExternalStore(
		subscribeToHash,
		getHashSnapshot,
		getHashServerSnapshot,
	);
	const route = useMemo(() => parseHash(hash), [hash]);
	const [showShortcuts, setShowShortcuts] = useState(true);
	const [searchOpen, setSearchOpen] = useState(false);
	const [searchQuery, setSearchQuery] = useState("");

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "/" && !isInputFocused()) {
				e.preventDefault();
				setSearchOpen(true);
			}
			if (e.key === "Escape" && searchOpen) {
				e.preventDefault();
				const shouldGoHome = !searchQuery.trim();
				setSearchOpen(false);
				setSearchQuery("");
				if (shouldGoHome) {
					window.location.hash = "top";
				}
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [searchOpen, searchQuery]);

	// Scroll restoration after route change — legitimate DOM sync
	useEffect(() => {
		if (route.view === "story") {
			window.scrollTo(0, 0);
			return;
		}
		const saved = scrollPositions.get(hash);
		if (saved != null) {
			requestAnimationFrame(() => window.scrollTo(0, saved));
		} else {
			window.scrollTo(0, 0);
		}
	}, [hash, route.view]);

	const navigate = useCallback((newHash: string) => {
		// Save scroll before programmatic navigation
		scrollPositions.set(window.location.hash || "#top", window.scrollY);
		window.location.hash = newHash;
	}, []);

	const goToFeed = useCallback((type: FeedType) => navigate(type), [navigate]);
	const goToStory = useCallback(
		(id: number) => navigate(`story/${id}`),
		[navigate],
	);
	const goToUser = useCallback(
		(id: string) => navigate(`user/${encodeURIComponent(id)}`),
		[navigate],
	);
	const goBack = useCallback(() => window.history.back(), []);

	return (
		<div className="min-h-screen bg-bg text-fg transition-colors duration-200">
			<Header
				route={route}
				onFeedChange={goToFeed}
				searchOpen={searchOpen}
				searchQuery={searchQuery}
				onSearchOpen={() => setSearchOpen(true)}
				onSearchClose={() => {
					setSearchOpen(false);
					setSearchQuery("");
				}}
				onSearchQueryChange={setSearchQuery}
				onToggleShortcuts={() => setShowShortcuts((s) => !s)}
			/>
			<main className="w-full max-w-4xl mx-auto px-0.5 sm:px-4 pt-16 pb-4 sm:pb-12">
				{route.view === "feed" &&
					(searchOpen ? (
						<SearchResultsList
							query={searchQuery}
							onStoryClick={goToStory}
							onUserClick={goToUser}
						/>
					) : (
						<StoryList
							key={route.feedType}
							feedType={route.feedType}
							onStoryClick={goToStory}
							onUserClick={goToUser}
							onSearch={() => setSearchOpen(true)}
							onToggleShortcuts={() => setShowShortcuts((s) => !s)}
						/>
					))}
				{route.view === "story" && (
					<StoryDetail
						storyId={route.id}
						onBack={goBack}
						onUserClick={goToUser}
						onStoryClick={goToStory}
					/>
				)}
				{route.view === "user" && (
					<UserProfile
						userId={route.id}
						onBack={goBack}
						onStoryClick={goToStory}
					/>
				)}
			</main>
			<KeyboardShortcuts
				isOpen={showShortcuts}
				onClose={() => setShowShortcuts(false)}
			/>

			{/* Credit */}
			<div className="fixed bottom-0 right-4 h-7 hidden sm:flex items-center text-lg  text-fg-faint/50 z-40">
				made by{" "}
				<a
					href="https://claude.ai"
					target="_blank"
					rel="noopener noreferrer"
					className="hover:text-accent transition-colors ml-0.5"
				>
					claude
				</a>
				<span className="mx-0.5">&</span>
				<a
					href="https://shivam.ing"
					target="_blank"
					rel="noopener noreferrer"
					className="hover:text-accent transition-colors"
				>
					shivam
				</a>
			</div>
		</div>
	);
}

export default function App() {
	return (
		<QueryClientProvider client={queryClient}>
			<ThemeProvider>
				<AppShell />
			</ThemeProvider>
		</QueryClientProvider>
	);
}
