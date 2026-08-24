import { fireEvent, render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import SavedListsWidget from './saved-lists-widget';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const STORAGE_KEY = 'londonlist:savedLists:v1';

function seed(entries: Array<{ listId: string; username: string; name: string; savedAt?: string }>) {
  const withSavedAt = entries.map((e) => ({ savedAt: 'now', ...e }));
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(withSavedAt));
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('SavedListsWidget', () => {
  it('renders nothing when no lists are saved', () => {
    const { container } = render(<SavedListsWidget />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders each saved list as a link to its public list page', () => {
    seed([
      { listId: 'a', username: 'alice', name: 'Museums' },
      { listId: 'b', username: 'bob', name: 'Pubs' },
    ]);
    render(<SavedListsWidget />);
    expect(screen.getByRole('link', { name: /museums/i })).toHaveAttribute(
      'href',
      '/list/alice/a',
    );
    expect(screen.getByRole('link', { name: /pubs/i })).toHaveAttribute(
      'href',
      '/list/bob/b',
    );
  });

  it('shows author names alongside each list', () => {
    seed([{ listId: 'a', username: 'alice', name: 'Museums' }]);
    render(<SavedListsWidget />);
    expect(screen.getByText(/by alice/i)).toBeInTheDocument();
  });

  it('uses singular subheading for a single saved list', () => {
    seed([{ listId: 'a', username: 'alice', name: 'Museums' }]);
    render(<SavedListsWidget />);
    expect(screen.getByText(/one list bookmarked/i)).toBeInTheDocument();
  });

  it('uses plural subheading with the count for multiple saved lists', () => {
    seed([
      { listId: 'a', username: 'alice', name: 'Museums' },
      { listId: 'b', username: 'bob', name: 'Pubs' },
    ]);
    render(<SavedListsWidget />);
    expect(screen.getByText(/2 lists bookmarked/i)).toBeInTheDocument();
  });

  it('lets the user remove a saved list', () => {
    seed([
      { listId: 'a', username: 'alice', name: 'Museums' },
      { listId: 'b', username: 'bob', name: 'Pubs' },
    ]);
    render(<SavedListsWidget />);
    fireEvent.click(screen.getByRole('button', { name: /remove "museums" from saved lists/i }));
    expect(screen.queryByRole('link', { name: /museums/i })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /pubs/i })).toBeInTheDocument();
  });

  it('truncates to the given limit and shows an overflow note', () => {
    seed([
      { listId: 'a', username: 'u', name: 'A' },
      { listId: 'b', username: 'u', name: 'B' },
      { listId: 'c', username: 'u', name: 'C' },
      { listId: 'd', username: 'u', name: 'D' },
      { listId: 'e', username: 'u', name: 'E' },
    ]);
    render(<SavedListsWidget limit={3} />);
    expect(screen.getAllByRole('link')).toHaveLength(3);
    expect(screen.getByText(/showing 3 of 5/i)).toBeInTheDocument();
  });

  it('does not render the overflow note when everything fits', () => {
    seed([
      { listId: 'a', username: 'u', name: 'A' },
      { listId: 'b', username: 'u', name: 'B' },
    ]);
    render(<SavedListsWidget limit={5} />);
    expect(screen.queryByText(/showing/i)).not.toBeInTheDocument();
  });

  it('labels the section for assistive tech', () => {
    seed([{ listId: 'a', username: 'alice', name: 'Museums' }]);
    render(<SavedListsWidget />);
    expect(screen.getByRole('region', { name: /your saved lists/i })).toBeInTheDocument();
  });
});
