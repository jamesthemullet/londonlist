import { useCallback, useEffect, useRef, useState } from 'react';

type SavedList = {
  listId: string;
  username: string;
  name: string;
  savedAt: string;
};

const STORAGE_KEY = 'londonlist:savedLists:v1';
export const FREE_SAVED_LIMIT = 3;
const MAX_ENTRIES = 50;

function readFromStorage(): SavedList[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isValidSavedList).slice(0, MAX_ENTRIES);
  } catch {
    return [];
  }
}

function writeToStorage(list: SavedList[]): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // storage may be full or blocked; silently ignore
  }
}

function isValidSavedList(value: unknown): value is SavedList {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.listId === 'string' &&
    typeof v.username === 'string' &&
    typeof v.name === 'string' &&
    typeof v.savedAt === 'string'
  );
}

export type UseSavedListsResult = {
  savedLists: SavedList[];
  isSaved: (listId: string) => boolean;
  isAtLimit: (isPro: boolean) => boolean;
  save: (entry: Omit<SavedList, 'savedAt'>, opts?: { isPro?: boolean }) => 'saved' | 'limit_reached';
  unsave: (listId: string) => void;
  clear: () => void;
  hydrated: boolean;
};

export function useSavedLists(): UseSavedListsResult {
  const [savedLists, setSavedLists] = useState<SavedList[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const savedListsRef = useRef<SavedList[]>([]);

  const applyUpdate = useCallback((next: SavedList[]) => {
    savedListsRef.current = next;
    writeToStorage(next);
    setSavedLists(next);
  }, []);

  useEffect(() => {
    const initial = readFromStorage();
    savedListsRef.current = initial;
    setSavedLists(initial);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      const next = readFromStorage();
      savedListsRef.current = next;
      setSavedLists(next);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const isSaved = useCallback(
    (listId: string) => savedLists.some((l) => l.listId === listId),
    [savedLists],
  );

  const isAtLimit = useCallback(
    (isPro: boolean) => !isPro && savedLists.length >= FREE_SAVED_LIMIT,
    [savedLists.length],
  );

  const save = useCallback(
    (entry: Omit<SavedList, 'savedAt'>, opts?: { isPro?: boolean }) => {
      const isPro = opts?.isPro ?? false;
      const current = savedListsRef.current;
      if (current.some((l) => l.listId === entry.listId)) return 'saved';
      if (!isPro && current.length >= FREE_SAVED_LIMIT) return 'limit_reached';
      const next = [
        { ...entry, savedAt: new Date().toISOString() },
        ...current,
      ].slice(0, MAX_ENTRIES);
      applyUpdate(next);
      return 'saved';
    },
    [applyUpdate],
  );

  const unsave = useCallback(
    (listId: string) => {
      const current = savedListsRef.current;
      if (!current.some((l) => l.listId === listId)) return;
      applyUpdate(current.filter((l) => l.listId !== listId));
    },
    [applyUpdate],
  );

  const clear = useCallback(() => {
    applyUpdate([]);
  }, [applyUpdate]);

  return { savedLists, isSaved, isAtLimit, save, unsave, clear, hydrated };
}
