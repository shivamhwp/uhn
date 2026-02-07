# Usable HN

A keyboard-driven Hacker News client built for readability and speed.

## Features

- **Keyboard-first navigation** -- `j`/`k` to move, `Enter` to open, `o` for external links, `1-6` to switch feeds, `/` to search, `?` for help
- **6 feeds** -- Top, New, Best, Ask HN, Show HN, Jobs
- **Full-text search** via Algolia with date range filtering
- **Nested comment trees** with collapse/expand and depth-based coloring
- **User profiles** with karma, bio, and recent submissions
- **Dark/light theme** with system preference detection and `t` to toggle
- **Prefetching on hover** for near-instant navigation
- **Hash-based routing** with scroll position preservation

## Tech Stack

- [Astro](https://astro.build) + [React](https://react.dev)
- [Tailwind CSS](https://tailwindcss.com)
- [TanStack React Query](https://tanstack.com/query) for data fetching and caching
- [Phosphor Icons](https://phosphoricons.com)
- [JetBrains Mono](https://www.jetbrains.com/lp/mono/) typeface
- Deployed on [Vercel](https://vercel.com)

## Data Sources

- [Hacker News Firebase API](https://github.com/HackerNews/API) -- stories, comments, users
- [Algolia HN Search API](https://hn.algolia.com/api) -- full-text search

## Getting Started

```sh
bun install
bun run dev
```

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j` / `k` | Move down / up |
| `Enter` | Open story |
| `o` | Open link in new tab |
| `h` / `Esc` | Go back |
| `1`-`6` | Switch feed |
| `/` | Search |
| `t` | Toggle theme |
| `[` / `]` | Previous / next page |
| `?` | Show all shortcuts |
