import {
  MagnifyingGlass,
  Moon,
  Sun,
  Keyboard,
  ArrowClockwise,
  Fire,
  Clock,
  Trophy,
  ChatCircle,
  Eye,
  Briefcase,
} from '@phosphor-icons/react';
import { useQueryClient } from '@tanstack/react-query';
import { useTheme } from './ThemeProvider';
import type { Route, FeedType } from '../lib/types';

const feeds: { type: FeedType; label: string; icon: typeof Fire; key: string }[] = [
  { type: 'top', label: 'Top', icon: Fire, key: '1' },
  { type: 'new', label: 'New', icon: Clock, key: '2' },
  { type: 'best', label: 'Best', icon: Trophy, key: '3' },
  { type: 'ask', label: 'Ask', icon: ChatCircle, key: '4' },
  { type: 'show', label: 'Show', icon: Eye, key: '5' },
  { type: 'jobs', label: 'Jobs', icon: Briefcase, key: '6' },
];

interface Props {
  route: Route;
  onFeedChange: (type: FeedType) => void;
  onSearch: () => void;
  onToggleShortcuts: () => void;
}

export function Header({ route, onFeedChange, onSearch, onToggleShortcuts }: Props) {
  const { theme, toggle } = useTheme();
  const queryClient = useQueryClient();
  const activeFeed = route.view === 'feed' ? route.feedType : null;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['storyIds'] });
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-bg/80 backdrop-blur-md border-b border-edge">
      <div className="max-w-4xl mx-auto px-4 h-12 flex items-center gap-1">
        {/* Logo */}
        <button
          onClick={() => onFeedChange('top')}
          className="mr-3 shrink-0 group"
        >
          <span className="text-[15px] font-bold tracking-tight group-hover:opacity-80 transition-opacity">
            <span className="text-accent">u</span>
            <span className="text-fg">hn</span>
          </span>
        </button>

        {/* Feed tabs */}
        <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-none">
          {feeds.map((feed) => {
            const isActive = activeFeed === feed.type;
            const Icon = feed.icon;
            return (
              <button
                key={feed.type}
                onClick={() => onFeedChange(feed.type)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-accent-subtle text-accent'
                    : 'text-fg-muted hover:text-fg hover:bg-surface-hover'
                }`}
              >
                <Icon size={14} weight={isActive ? 'fill' : 'regular'} />
                <span className="hidden sm:inline">{feed.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Actions */}
        <div className="flex items-center gap-0.5">
          <button
            onClick={handleRefresh}
            className="p-2 rounded-md text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
            title="Refresh feeds (r)"
          >
            <ArrowClockwise size={16} />
          </button>
          <button
            onClick={onSearch}
            className={`p-2 rounded-md transition-colors ${
              route.view === 'search'
                ? 'text-accent bg-accent-subtle'
                : 'text-fg-muted hover:text-fg hover:bg-surface-hover'
            }`}
            title="Search (/)"
          >
            <MagnifyingGlass size={16} />
          </button>
          <button
            onClick={toggle}
            className="p-2 rounded-md text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors"
            title="Toggle theme (t)"
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={onToggleShortcuts}
            className="p-2 rounded-md text-fg-muted hover:text-fg hover:bg-surface-hover transition-colors hidden sm:block"
            title="Keyboard shortcuts (?)"
          >
            <Keyboard size={16} />
          </button>
        </div>
      </div>
    </header>
  );
}
