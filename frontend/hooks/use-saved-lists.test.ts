import { act, renderHook } from '@testing-library/react';
import { FREE_SAVED_LIMIT, useSavedLists } from './use-saved-lists';

const STORAGE_KEY = 'londonlist:savedLists:v1';

function seed(entries: unknown): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
}

function readStored(): unknown {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('useSavedLists — hydration', () => {
  it('hydrates to empty when storage is empty', () => {
    const { result } = renderHook(() => useSavedLists());
    expect(result.current.savedLists).toEqual([]);
    expect(result.current.hydrated).toBe(true);
  });

  it('hydrates from valid stored entries', () => {
    seed([
      { listId: 'a', username: 'alice', name: 'Museums', savedAt: '2025-01-01T00:00:00.000Z' },
    ]);
    const { result } = renderHook(() => useSavedLists());
    expect(result.current.savedLists).toEqual([
      { listId: 'a', username: 'alice', name: 'Museums', savedAt: '2025-01-01T00:00:00.000Z' },
    ]);
  });

  it('ignores malformed storage payloads', () => {
    window.localStorage.setItem(STORAGE_KEY, '{not json');
    const { result } = renderHook(() => useSavedLists());
    expect(result.current.savedLists).toEqual([]);
  });

  it('ignores non-array payloads', () => {
    seed({ not: 'an array' });
    const { result } = renderHook(() => useSavedLists());
    expect(result.current.savedLists).toEqual([]);
  });

  it('filters out entries missing required fields', () => {
    seed([
      { listId: 'a', username: 'alice', name: 'Ok', savedAt: 'now' },
      { listId: 'b', username: 'bob' },
      'string',
      null,
      { listId: 42, username: 'x', name: 'x', savedAt: 'x' },
    ]);
    const { result } = renderHook(() => useSavedLists());
    expect(result.current.savedLists.map((l) => l.listId)).toEqual(['a']);
  });
});

describe('useSavedLists — save', () => {
  it('adds a new saved list to the front', () => {
    const { result } = renderHook(() => useSavedLists());
    let outcome: string | undefined;
    act(() => {
      outcome = result.current.save({ listId: 'a', username: 'alice', name: 'First' });
    });
    expect(outcome).toBe('saved');
    expect(result.current.savedLists).toHaveLength(1);
    expect(result.current.savedLists[0]).toMatchObject({
      listId: 'a',
      username: 'alice',
      name: 'First',
    });
    expect(result.current.savedLists[0].savedAt).toEqual(expect.any(String));
  });

  it('persists saves to localStorage', () => {
    const { result } = renderHook(() => useSavedLists());
    act(() => {
      result.current.save({ listId: 'a', username: 'alice', name: 'First' });
    });
    const stored = readStored() as Array<{ listId: string }>;
    expect(stored).toHaveLength(1);
    expect(stored[0].listId).toBe('a');
  });

  it('is idempotent — saving the same list twice keeps a single entry', () => {
    const { result } = renderHook(() => useSavedLists());
    act(() => {
      result.current.save({ listId: 'a', username: 'alice', name: 'First' });
      result.current.save({ listId: 'a', username: 'alice', name: 'First' });
    });
    expect(result.current.savedLists).toHaveLength(1);
  });

  it('adds newer entries at the front', () => {
    const { result } = renderHook(() => useSavedLists());
    act(() => {
      result.current.save({ listId: 'a', username: 'alice', name: 'A' });
    });
    act(() => {
      result.current.save({ listId: 'b', username: 'bob', name: 'B' });
    });
    expect(result.current.savedLists.map((l) => l.listId)).toEqual(['b', 'a']);
  });

  it('blocks free users at the limit and reports limit_reached', () => {
    const { result } = renderHook(() => useSavedLists());
    act(() => {
      for (let i = 0; i < FREE_SAVED_LIMIT; i++) {
        result.current.save({ listId: `l${i}`, username: 'u', name: `L${i}` });
      }
    });
    let outcome: string | undefined;
    act(() => {
      outcome = result.current.save({ listId: 'blocked', username: 'u', name: 'Nope' });
    });
    expect(outcome).toBe('limit_reached');
    expect(result.current.savedLists).toHaveLength(FREE_SAVED_LIMIT);
    expect(result.current.savedLists.some((l) => l.listId === 'blocked')).toBe(false);
  });

  it('allows Pro users to save beyond the free limit', () => {
    const { result } = renderHook(() => useSavedLists());
    act(() => {
      for (let i = 0; i < FREE_SAVED_LIMIT + 2; i++) {
        result.current.save(
          { listId: `l${i}`, username: 'u', name: `L${i}` },
          { isPro: true },
        );
      }
    });
    expect(result.current.savedLists).toHaveLength(FREE_SAVED_LIMIT + 2);
  });
});

describe('useSavedLists — isSaved and isAtLimit', () => {
  it('isSaved returns true for known ids and false for unknown', () => {
    seed([{ listId: 'a', username: 'u', name: 'A', savedAt: 'x' }]);
    const { result } = renderHook(() => useSavedLists());
    expect(result.current.isSaved('a')).toBe(true);
    expect(result.current.isSaved('missing')).toBe(false);
  });

  it('isAtLimit is true for free users at the limit', () => {
    const entries = Array.from({ length: FREE_SAVED_LIMIT }, (_, i) => ({
      listId: `l${i}`,
      username: 'u',
      name: `L${i}`,
      savedAt: 'x',
    }));
    seed(entries);
    const { result } = renderHook(() => useSavedLists());
    expect(result.current.isAtLimit(false)).toBe(true);
  });

  it('isAtLimit is false for free users below the limit', () => {
    seed([{ listId: 'a', username: 'u', name: 'A', savedAt: 'x' }]);
    const { result } = renderHook(() => useSavedLists());
    expect(result.current.isAtLimit(false)).toBe(false);
  });

  it('isAtLimit is always false for Pro users', () => {
    const entries = Array.from({ length: FREE_SAVED_LIMIT + 3 }, (_, i) => ({
      listId: `l${i}`,
      username: 'u',
      name: `L${i}`,
      savedAt: 'x',
    }));
    seed(entries);
    const { result } = renderHook(() => useSavedLists());
    expect(result.current.isAtLimit(true)).toBe(false);
  });
});

describe('useSavedLists — unsave and clear', () => {
  it('removes a saved list by id', () => {
    seed([
      { listId: 'a', username: 'u', name: 'A', savedAt: 'x' },
      { listId: 'b', username: 'u', name: 'B', savedAt: 'x' },
    ]);
    const { result } = renderHook(() => useSavedLists());
    act(() => {
      result.current.unsave('a');
    });
    expect(result.current.savedLists.map((l) => l.listId)).toEqual(['b']);
    expect((readStored() as Array<{ listId: string }>).map((l) => l.listId)).toEqual(['b']);
  });

  it('is a no-op when unsaving an unknown id', () => {
    seed([{ listId: 'a', username: 'u', name: 'A', savedAt: 'x' }]);
    const { result } = renderHook(() => useSavedLists());
    act(() => {
      result.current.unsave('missing');
    });
    expect(result.current.savedLists.map((l) => l.listId)).toEqual(['a']);
  });

  it('clear empties all saved lists and storage', () => {
    seed([
      { listId: 'a', username: 'u', name: 'A', savedAt: 'x' },
      { listId: 'b', username: 'u', name: 'B', savedAt: 'x' },
    ]);
    const { result } = renderHook(() => useSavedLists());
    act(() => {
      result.current.clear();
    });
    expect(result.current.savedLists).toEqual([]);
    expect(readStored()).toEqual([]);
  });
});

describe('useSavedLists — cross-tab sync', () => {
  it('re-reads from storage when a matching storage event fires', () => {
    const { result } = renderHook(() => useSavedLists());
    expect(result.current.savedLists).toEqual([]);

    act(() => {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify([
          { listId: 'a', username: 'u', name: 'A', savedAt: 'x' },
        ]),
      );
      window.dispatchEvent(new StorageEvent('storage', { key: STORAGE_KEY }));
    });

    expect(result.current.savedLists.map((l) => l.listId)).toEqual(['a']);
  });

  it('ignores storage events for other keys', () => {
    seed([{ listId: 'a', username: 'u', name: 'A', savedAt: 'x' }]);
    const { result } = renderHook(() => useSavedLists());
    act(() => {
      window.localStorage.setItem('another-key', 'foo');
      window.dispatchEvent(new StorageEvent('storage', { key: 'another-key' }));
    });
    expect(result.current.savedLists.map((l) => l.listId)).toEqual(['a']);
  });
});

describe('useSavedLists — resilience', () => {
  it('does not throw when localStorage.setItem throws', () => {
    const originalSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => {
      throw new Error('quota exceeded');
    };
    try {
      const { result } = renderHook(() => useSavedLists());
      expect(() => {
        act(() => {
          result.current.save({ listId: 'a', username: 'u', name: 'A' });
        });
      }).not.toThrow();
      expect(result.current.savedLists.map((l) => l.listId)).toEqual(['a']);
    } finally {
      Storage.prototype.setItem = originalSetItem;
    }
  });

  it('does not throw when reading corrupt storage on hydration', () => {
    window.localStorage.setItem(STORAGE_KEY, '{corrupt');
    expect(() => renderHook(() => useSavedLists())).not.toThrow();
  });
});
