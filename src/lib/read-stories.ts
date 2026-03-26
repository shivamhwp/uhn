import Dexie, { type Table } from "dexie";
import { atom } from "nanostores";
import type { ReadSource, ReadStoryEntry } from "./types";

const READ_DB_NAME = "uhn-read-state";
const READ_SYNC_KEY = "uhn:read-sync";
const READ_SYNC_CHANNEL = "uhn:read-sync";
const READ_RETENTION_MS = 30 * 24 * 60 * 60 * 1000;
const PRUNE_THROTTLE_MS = 6 * 60 * 60 * 1000;
const PRUNE_DELAY_MS = 15 * 1000;

class ReadStoriesDb extends Dexie {
  readStories!: Table<ReadStoryEntry, number>;

  constructor() {
    super(READ_DB_NAME);
    this.version(1).stores({
      readStories: "storyId, readAt, updatedAt",
    });
  }
}

export const $readStoryIds = atom<ReadonlySet<number>>(new Set());
export const $readStoriesHydrated = atom(false);

let db: ReadStoriesDb | null = null;
let hydratePromise: Promise<void> | null = null;
let hasStartedSync = false;
let lastPruneAt = 0;
let pruneTimer: ReturnType<typeof setTimeout> | null = null;
let syncChannel: BroadcastChannel | null = null;

const getDb = () => {
  if (typeof window === "undefined") return null;
  db ??= new ReadStoriesDb();
  return db;
};

const setReadStoryIds = (entries: ReadStoryEntry[]) => {
  $readStoryIds.set(new Set(entries.map((entry) => entry.storyId)));
};

const notifyReadSync = () => {
  if (typeof window === "undefined") return;

  syncChannel?.postMessage(Date.now());
  try {
    window.localStorage.setItem(READ_SYNC_KEY, String(Date.now()));
  } catch {
    // Ignore storage write failures.
  }
};

const loadReadStories = async () => {
  const readDb = getDb();
  if (!readDb) return;
  setReadStoryIds(await readDb.readStories.toArray());
  $readStoriesHydrated.set(true);
};

const schedulePrune = () => {
  if (typeof window === "undefined") return;
  if (pruneTimer || Date.now() - lastPruneAt < PRUNE_THROTTLE_MS) return;

  pruneTimer = window.setTimeout(() => {
    pruneTimer = null;
    void pruneReadStories();
  }, PRUNE_DELAY_MS);
};

const startReadSync = () => {
  if (typeof window === "undefined" || hasStartedSync) return;
  hasStartedSync = true;

  const refresh = () => {
    void loadReadStories();
  };

  if ("BroadcastChannel" in window) {
    syncChannel = new BroadcastChannel(READ_SYNC_CHANNEL);
    syncChannel.addEventListener("message", refresh);
  }

  window.addEventListener("storage", (event) => {
    if (event.key === READ_SYNC_KEY) refresh();
  });
};

async function commitReadStoryIds(
  nextIds: ReadonlySet<number>,
  action: (readDb: ReadStoriesDb) => Promise<void>,
) {
  const previousIds = $readStoryIds.get();
  $readStoryIds.set(nextIds);

  try {
    const readDb = getDb();
    if (!readDb) return;
    await action(readDb);
    notifyReadSync();
    schedulePrune();
  } catch (error) {
    $readStoryIds.set(previousIds);
    throw error;
  }
}

export const isStoryRead = (storyId: number) => $readStoryIds.get().has(storyId);

export async function pruneReadStories() {
  const readDb = getDb();
  if (!readDb) return;

  lastPruneAt = Date.now();
  await readDb.readStories
    .where("updatedAt")
    .below(lastPruneAt - READ_RETENTION_MS)
    .delete();
  await loadReadStories();
}

export async function hydrateReadStories() {
  startReadSync();
  if (hydratePromise) return hydratePromise;

  hydratePromise = (async () => {
    await pruneReadStories();
    await loadReadStories();
  })().finally(() => {
    hydratePromise = null;
  });

  return hydratePromise;
}

export async function markStoryRead(storyId: number, source: ReadSource = "manual") {
  const nextIds = new Set($readStoryIds.get());
  nextIds.add(storyId);

  await commitReadStoryIds(nextIds, async (readDb) => {
    const now = Date.now();
    const previousEntry = await readDb.readStories.get(storyId);
    await readDb.readStories.put({
      storyId,
      readAt: previousEntry?.readAt ?? now,
      updatedAt: now,
      source,
    });
  });
}

export async function markStoryUnread(storyId: number) {
  const nextIds = new Set($readStoryIds.get());
  nextIds.delete(storyId);

  await commitReadStoryIds(nextIds, (readDb) => readDb.readStories.delete(storyId));
}

export async function toggleStoryRead(storyId: number) {
  if (isStoryRead(storyId)) {
    await markStoryUnread(storyId);
    return;
  }

  await markStoryRead(storyId, "manual");
}
