import { act, fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import SaveListButton from './save-list-button';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
    onClick,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

type MockUser = { isPro: boolean } | null;
let mockUser: MockUser = null;

jest.mock('../../context/AppContext', () => ({
  useAppContext: () => ({ user: mockUser, setUser: jest.fn(), initialized: true }),
}));

const STORAGE_KEY = 'londonlist:savedLists:v1';

beforeEach(() => {
  mockUser = null;
  window.localStorage.clear();
});

afterEach(() => {
  jest.useRealTimers();
});

function renderButton(overrides: Partial<{ listId: string; username: string; name: string }> = {}) {
  const props = { listId: 'list-1', username: 'alice', name: 'Museums Tour', ...overrides };
  return render(<SaveListButton {...props} />);
}

describe('SaveListButton — initial state', () => {
  it('renders a "Save for later" button when not yet saved', () => {
    renderButton();
    const btn = screen.getByRole('button', { name: /save "museums tour" to view later/i });
    expect(btn).toBeInTheDocument();
    expect(btn).toHaveTextContent(/save for later/i);
    expect(btn).toHaveAttribute('aria-pressed', 'false');
  });

  it('reflects the saved state when the list is already stored', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { listId: 'list-1', username: 'alice', name: 'Museums Tour', savedAt: 'now' },
      ]),
    );
    renderButton();
    const btn = screen.getByRole('button', { name: /remove "museums tour" from your saved lists/i });
    expect(btn).toHaveAttribute('aria-pressed', 'true');
    expect(btn).toHaveTextContent(/saved · remove/i);
  });
});

describe('SaveListButton — saving', () => {
  it('adds the list to localStorage on click', () => {
    renderButton();
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(1);
    expect(stored[0]).toMatchObject({ listId: 'list-1', username: 'alice', name: 'Museums Tour' });
  });

  it('shows a confirmation message after saving', () => {
    renderButton();
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/added to your saved lists/i);
  });

  it('flips aria-pressed to true after saving', () => {
    renderButton();
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true');
  });

  it('hides the confirmation after the timeout', () => {
    jest.useFakeTimers();
    renderButton();
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(screen.getByRole('status')).toBeInTheDocument();
    act(() => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('SaveListButton — unsaving', () => {
  it('removes the entry from storage when clicked while saved', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { listId: 'list-1', username: 'alice', name: 'Museums Tour', savedAt: 'now' },
      ]),
    );
    renderButton();
    fireEvent.click(screen.getByRole('button'));
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('[]');
    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
  });
});

describe('SaveListButton — free-tier limit', () => {
  function fillFreeSlots() {
    const entries = Array.from({ length: 3 }, (_, i) => ({
      listId: `slot-${i}`,
      username: 'u',
      name: `Slot ${i}`,
      savedAt: 'now',
    }));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }

  it('opens the upgrade modal when a free user hits the limit', () => {
    fillFreeSlots();
    renderButton({ listId: 'over-limit', name: 'Over Limit' });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/hit the free limit/i);
  });

  it('does not add the entry to storage when the limit blocks the save', () => {
    fillFreeSlots();
    renderButton({ listId: 'over-limit', name: 'Over Limit' });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    expect(stored).toHaveLength(3);
    expect(stored.some((l: { listId: string }) => l.listId === 'over-limit')).toBe(false);
  });

  it('allows Pro users to save beyond the free limit', () => {
    mockUser = { isPro: true };
    fillFreeSlots();
    renderButton({ listId: 'pro-save', name: 'Pro Save' });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    const stored = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
    expect(stored.some((l: { listId: string }) => l.listId === 'pro-save')).toBe(true);
  });

  it('closes the upgrade modal when dismissed', () => {
    fillFreeSlots();
    renderButton({ listId: 'over-limit', name: 'Over Limit' });
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    fireEvent.click(screen.getByRole('button', { name: /maybe later/i }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
