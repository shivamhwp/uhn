import { useState, useEffect, useCallback, useMemo, useSyncExternalStore } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';
import { ThemeProvider } from './ThemeProvider';
import { Header } from './Header';
import { StoryList } from './StoryList';
import { StoryDetail } from './StoryDetail';
import { UserProfile } from './UserProfile';
import { SearchPanel } from './SearchPanel';
import { KeyboardShortcuts } from './KeyboardShortcuts';
import type { Route, FeedType } from '../lib/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
      gcTime: 24 * 60 * 60 * 1000,
    },
  },
});

const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'uhn-cache',
});

function parseHash(hash: string): Route {
  const clean = hash.replace(/^#\/?/, '');
  if (!clean || clean === 'top') return { view: 'feed', feedType: 'top' };
  if (clean === 'new' || clean === 'best' || clean === 'ask' || clean === 'show' || clean === 'jobs') {
    return { view: 'feed', feedType: clean as FeedType };
  }
  const storyMatch = clean.match(/^story\/(\d+)$/);
  if (storyMatch) return { view: 'story', id: parseInt(storyMatch[1], 10) };
  const userMatch = clean.match(/^user\/(.+)$/);
  if (userMatch) return { view: 'user', id: decodeURIComponent(userMatch[1]) };
  if (clean === 'search') return { view: 'search' };
  return { view: 'feed', feedType: 'top' };
}

// --- Hash-based routing via useSyncExternalStore ---
const scrollPositions = new Map<string, number>();
let trackedHash = typeof window !== 'undefined' ? (window.location.hash || '#top') : '#top';

function subscribeToHash(callback: () => void) {
  const handler = () => {
    // Save scroll position for the route we're leaving
    scrollPositions.set(trackedHash, window.scrollY);
    trackedHash = window.location.hash || '#top';
    callback();
  };
  window.addEventListener('hashchange', handler);
  return () => window.removeEventListener('hashchange', handler);
}

function getHashSnapshot() {
  return window.location.hash || '#top';
}

function getHashServerSnapshot() {
  return '#top';
}

function AppShell() {
  const hash = useSyncExternalStore(subscribeToHash, getHashSnapshot, getHashServerSnapshot);
  const route = useMemo(() => parseHash(hash), [hash]);
  const [showShortcuts, setShowShortcuts] = useState(true);

  // Scroll restoration after route change — legitimate DOM sync
  useEffect(() => {
    const saved = scrollPositions.get(hash);
    if (saved != null) {
      requestAnimationFrame(() => window.scrollTo(0, saved));
    } else {
      window.scrollTo(0, 0);
    }
  }, [hash]);

  const navigate = useCallback((newHash: string) => {
    // Save scroll before programmatic navigation
    scrollPositions.set(window.location.hash || '#top', window.scrollY);
    window.location.hash = newHash;
  }, []);

  const goToFeed = useCallback(
    (type: FeedType) => navigate(type),
    [navigate]
  );
  const goToStory = useCallback(
    (id: number) => navigate(`story/${id}`),
    [navigate]
  );
  const goToUser = useCallback(
    (id: string) => navigate(`user/${encodeURIComponent(id)}`),
    [navigate]
  );
  const goToSearch = useCallback(() => navigate('search'), [navigate]);
  const goBack = useCallback(() => window.history.back(), []);

  return (
    <div className="min-h-screen bg-bg text-fg transition-colors duration-200">
      <Header
        route={route}
        onFeedChange={goToFeed}
        onSearch={goToSearch}
        onToggleShortcuts={() => setShowShortcuts((s) => !s)}
      />
      <main className="max-w-4xl mx-auto px-3 sm:px-4 pt-14 pb-4 sm:pb-12">
        {route.view === 'feed' && (
          <StoryList
            key={route.feedType}
            feedType={route.feedType}
            onStoryClick={goToStory}
            onUserClick={goToUser}
            onSearch={goToSearch}
            onToggleShortcuts={() => setShowShortcuts((s) => !s)}
          />
        )}
        {route.view === 'story' && (
          <StoryDetail
            storyId={route.id}
            onBack={goBack}
            onUserClick={goToUser}
            onStoryClick={goToStory}
          />
        )}
        {route.view === 'user' && (
          <UserProfile userId={route.id} onBack={goBack} onStoryClick={goToStory} />
        )}
        {route.view === 'search' && (
          <SearchPanel
            onStoryClick={goToStory}
            onUserClick={goToUser}
            onBack={goBack}
          />
        )}
      </main>
      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />

      {/* Credit */}
      <div className="fixed bottom-0 right-4 h-7 hidden sm:flex items-center text-[9px] text-fg-faint/50 z-40">
        made by{' '}
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
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000 }}
    >
      <ThemeProvider>
        <AppShell />
      </ThemeProvider>
    </PersistQueryClientProvider>
  );
}
