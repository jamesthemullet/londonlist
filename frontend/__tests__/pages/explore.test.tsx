import { render, screen, fireEvent } from '@testing-library/react';
import ExplorePage, { deriveAllCategories, buildExplorePageJsonLd } from '../../pages/explore';

jest.mock('../../context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

import { useAppContext } from '../../context/AppContext';
const mockUseAppContext = useAppContext as jest.Mock;

const LISTS = [
  {
    documentId: 'doc-1',
    name: 'Weekend Wanders',
    username: 'alice',
    itemCount: 5,
    categories: ['park', 'museum'],
  },
  {
    documentId: 'doc-2',
    name: 'Museum Trail',
    username: 'bob',
    itemCount: 8,
    categories: ['museum'],
  },
  {
    documentId: 'doc-3',
    name: 'Hidden Gems',
    username: 'alice',
    itemCount: 3,
    categories: ['restaurant', 'cafe'],
  },
];

beforeEach(() => {
  mockUseAppContext.mockReturnValue({ user: null, initialized: true });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('ExplorePage — rendering', () => {
  it('renders the page heading', () => {
    render(<ExplorePage lists={[]} />);
    expect(screen.getByRole('heading', { name: /explore london lists/i })).toBeInTheDocument();
  });

  it('renders a list card for each public list', () => {
    render(<ExplorePage lists={LISTS} />);
    expect(screen.getByText('Weekend Wanders')).toBeInTheDocument();
    expect(screen.getByText('Museum Trail')).toBeInTheDocument();
    expect(screen.getByText('Hidden Gems')).toBeInTheDocument();
  });

  it('shows author name on each card', () => {
    render(<ExplorePage lists={LISTS} />);
    expect(screen.getAllByText('by alice')).toHaveLength(2);
    expect(screen.getByText('by bob')).toBeInTheDocument();
  });

  it('links each card to /list/:username/:documentId', () => {
    render(<ExplorePage lists={LISTS} />);
    const link = screen.getByText('Weekend Wanders').closest('a');
    expect(link).toHaveAttribute('href', '/list/alice/doc-1');
  });

  it('shows the list count', () => {
    render(<ExplorePage lists={LISTS} />);
    expect(screen.getByText('3 lists')).toBeInTheDocument();
  });

  it('shows singular "list" when there is exactly one result', () => {
    render(<ExplorePage lists={[LISTS[0]]} />);
    expect(screen.getByText('1 list')).toBeInTheDocument();
  });

  it('shows empty message when there are no lists', () => {
    render(<ExplorePage lists={[]} />);
    expect(screen.getByText(/no public lists yet/i)).toBeInTheDocument();
  });
});

describe('ExplorePage — item counts', () => {
  it('shows item count on each card', () => {
    render(<ExplorePage lists={LISTS} />);
    expect(screen.getByText('5 places')).toBeInTheDocument();
    expect(screen.getByText('8 places')).toBeInTheDocument();
    expect(screen.getByText('3 places')).toBeInTheDocument();
  });

  it('shows singular "place" when item count is 1', () => {
    const singleItem = [{ ...LISTS[0], itemCount: 1, categories: [] }];
    render(<ExplorePage lists={singleItem} />);
    expect(screen.getByText('1 place')).toBeInTheDocument();
  });

  it('does not show item count for lists with 0 items', () => {
    const emptyList = [{ ...LISTS[0], itemCount: 0, categories: [] }];
    render(<ExplorePage lists={emptyList} />);
    expect(screen.queryByText(/place/)).not.toBeInTheDocument();
  });

  it('shows category list on each card', () => {
    render(<ExplorePage lists={LISTS} />);
    expect(screen.getByText('park · museum')).toBeInTheDocument();
    // "museum" appears in both a chip button and the Museum Trail card; both should be present
    expect(screen.getAllByText('museum').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('restaurant · cafe')).toBeInTheDocument();
  });

  it('caps displayed categories at 4', () => {
    const manyCategories = [
      {
        ...LISTS[0],
        categories: ['restaurant', 'cafe', 'park', 'museum', 'bar'],
      },
    ];
    render(<ExplorePage lists={manyCategories} />);
    expect(screen.getByText('restaurant · cafe · park · museum')).toBeInTheDocument();
  });

  it('does not show category line when categories array is empty', () => {
    const noCategories = [{ ...LISTS[0], categories: [] }];
    render(<ExplorePage lists={noCategories} />);
    // No category text like "park · museum" should appear in a card
    expect(screen.queryByText(/·/)).not.toBeInTheDocument();
  });
});

describe('ExplorePage — category filter', () => {
  it('renders category filter chips', () => {
    render(<ExplorePage lists={LISTS} />);
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'museum' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'park' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'restaurant' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'cafe' })).toBeInTheDocument();
  });

  it('does not render category filter when no lists have categories', () => {
    const noCatLists = LISTS.map((l) => ({ ...l, categories: [] }));
    render(<ExplorePage lists={noCatLists} />);
    expect(screen.queryByRole('button', { name: 'All' })).not.toBeInTheDocument();
  });

  it('filters lists by category when a chip is clicked', () => {
    render(<ExplorePage lists={LISTS} />);
    fireEvent.click(screen.getByRole('button', { name: 'museum' }));
    expect(screen.getByText('Weekend Wanders')).toBeInTheDocument();
    expect(screen.getByText('Museum Trail')).toBeInTheDocument();
    expect(screen.queryByText('Hidden Gems')).not.toBeInTheDocument();
  });

  it('shows all lists when "All" chip is clicked', () => {
    render(<ExplorePage lists={LISTS} />);
    fireEvent.click(screen.getByRole('button', { name: 'museum' }));
    fireEvent.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.getByText('Weekend Wanders')).toBeInTheDocument();
    expect(screen.getByText('Museum Trail')).toBeInTheDocument();
    expect(screen.getByText('Hidden Gems')).toBeInTheDocument();
  });

  it('deselects a category chip when clicked again', () => {
    render(<ExplorePage lists={LISTS} />);
    fireEvent.click(screen.getByRole('button', { name: 'museum' }));
    expect(screen.queryByText('Hidden Gems')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'museum' }));
    expect(screen.getByText('Hidden Gems')).toBeInTheDocument();
  });

  it('shows no-match message when category filter + search have no results', () => {
    render(<ExplorePage lists={LISTS} />);
    fireEvent.click(screen.getByRole('button', { name: 'park' }));
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'museum' } });
    expect(screen.getByText(/no lists match your filters/i)).toBeInTheDocument();
  });

  it('combines category filter and text search correctly', () => {
    render(<ExplorePage lists={LISTS} />);
    fireEvent.click(screen.getByRole('button', { name: 'museum' }));
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'weekend' } });
    expect(screen.getByText('Weekend Wanders')).toBeInTheDocument();
    expect(screen.queryByText('Museum Trail')).not.toBeInTheDocument();
  });

  it('updates count correctly after category filter', () => {
    render(<ExplorePage lists={LISTS} />);
    fireEvent.click(screen.getByRole('button', { name: 'museum' }));
    expect(screen.getByText('2 lists')).toBeInTheDocument();
  });
});

describe('ExplorePage — search', () => {
  it('filters list cards by name', () => {
    render(<ExplorePage lists={LISTS} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'museum' } });
    expect(screen.getByText('Museum Trail')).toBeInTheDocument();
    expect(screen.queryByText('Weekend Wanders')).not.toBeInTheDocument();
    expect(screen.queryByText('Hidden Gems')).not.toBeInTheDocument();
  });

  it('filters list cards by username', () => {
    render(<ExplorePage lists={LISTS} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'bob' } });
    expect(screen.getByText('Museum Trail')).toBeInTheDocument();
    expect(screen.queryByText('Weekend Wanders')).not.toBeInTheDocument();
  });

  it('search is case-insensitive', () => {
    render(<ExplorePage lists={LISTS} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'HIDDEN' } });
    expect(screen.getByText('Hidden Gems')).toBeInTheDocument();
  });

  it('shows no-match message when search finds nothing', () => {
    render(<ExplorePage lists={LISTS} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'zzznomatch' } });
    expect(screen.getByText(/no lists match your filters/i)).toBeInTheDocument();
    expect(screen.queryByText('Weekend Wanders')).not.toBeInTheDocument();
  });

  it('updates the count as search narrows results', () => {
    render(<ExplorePage lists={LISTS} />);
    const input = screen.getByRole('searchbox');
    fireEvent.change(input, { target: { value: 'alice' } });
    expect(screen.getByText('2 lists')).toBeInTheDocument();
  });
});

describe('ExplorePage — conversion CTA', () => {
  it('shows CTA banner for unauthenticated initialized users', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true });
    render(<ExplorePage lists={LISTS} />);
    expect(screen.getByText(/build your own list/i)).toBeInTheDocument();
  });

  it('CTA links to /register with ref param', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true });
    render(<ExplorePage lists={LISTS} />);
    const link = screen.getByText(/build your own list/i).closest('a');
    expect(link).toHaveAttribute('href', '/register?ref=explore');
  });

  it('does not show CTA banner when user is logged in', () => {
    mockUseAppContext.mockReturnValue({
      user: { id: '1', documentId: 'u1', email: 'a@b.com', username: 'alice' },
      initialized: true,
    });
    render(<ExplorePage lists={LISTS} />);
    expect(screen.queryByText(/build your own list/i)).not.toBeInTheDocument();
  });

  it('does not show CTA banner before auth is initialized', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: false });
    render(<ExplorePage lists={LISTS} />);
    expect(screen.queryByText(/build your own list/i)).not.toBeInTheDocument();
  });
});

describe('deriveAllCategories', () => {
  it('returns sorted unique categories from all lists', () => {
    const result = deriveAllCategories(LISTS);
    expect(result).toEqual(['cafe', 'museum', 'park', 'restaurant']);
  });

  it('deduplicates categories that appear in multiple lists', () => {
    const result = deriveAllCategories(LISTS);
    expect(result.filter((c) => c === 'museum')).toHaveLength(1);
  });

  it('returns empty array when no lists have categories', () => {
    const noCats = LISTS.map((l) => ({ ...l, categories: [] }));
    expect(deriveAllCategories(noCats)).toEqual([]);
  });

  it('returns empty array for empty list', () => {
    expect(deriveAllCategories([])).toEqual([]);
  });
});

describe('buildExplorePageJsonLd', () => {
  const SITE_URL = 'https://example.com';

  it('returns a CollectionPage schema type', () => {
    const result = buildExplorePageJsonLd([], SITE_URL) as Record<string, unknown>;
    expect(result['@type']).toBe('CollectionPage');
    expect(result['@context']).toBe('https://schema.org');
  });

  it('sets the name to "Explore London Lists"', () => {
    const result = buildExplorePageJsonLd([], SITE_URL) as Record<string, unknown>;
    expect(result.name).toBe('Explore London Lists');
  });

  it('sets the url to the explore page', () => {
    const result = buildExplorePageJsonLd([], SITE_URL) as Record<string, unknown>;
    expect(result.url).toBe('https://example.com/explore');
  });

  it('returns empty hasPart when no lists are provided', () => {
    const result = buildExplorePageJsonLd([], SITE_URL) as Record<string, unknown>;
    expect(result.hasPart).toEqual([]);
  });

  it('includes an ItemList entry for each list with a username', () => {
    const result = buildExplorePageJsonLd(LISTS, SITE_URL) as Record<string, unknown>;
    const parts = result.hasPart as Array<Record<string, unknown>>;
    expect(parts).toHaveLength(3);
    expect(parts[0]['@type']).toBe('ItemList');
  });

  it('sets the correct URL for each list', () => {
    const result = buildExplorePageJsonLd([LISTS[0]], SITE_URL) as Record<string, unknown>;
    const parts = result.hasPart as Array<Record<string, unknown>>;
    expect(parts[0].url).toBe('https://example.com/list/alice/doc-1');
  });

  it('sets numberOfItems from itemCount', () => {
    const result = buildExplorePageJsonLd([LISTS[0]], SITE_URL) as Record<string, unknown>;
    const parts = result.hasPart as Array<Record<string, unknown>>;
    expect(parts[0].numberOfItems).toBe(5);
  });

  it('excludes lists without a username', () => {
    const listsWithNull = [
      ...LISTS,
      { documentId: 'doc-anon', name: 'Anon list', username: null, itemCount: 2, categories: [] },
    ];
    const result = buildExplorePageJsonLd(listsWithNull, SITE_URL) as Record<string, unknown>;
    const parts = result.hasPart as Array<Record<string, unknown>>;
    expect(parts).toHaveLength(3);
  });

  it('uses the provided siteUrl as the base for all URLs', () => {
    const result = buildExplorePageJsonLd([LISTS[0]], 'https://londonlist.co.uk') as Record<string, unknown>;
    const parts = result.hasPart as Array<Record<string, unknown>>;
    expect(parts[0].url).toContain('https://londonlist.co.uk');
    expect(result.url).toBe('https://londonlist.co.uk/explore');
  });
});
