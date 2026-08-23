import { render, screen } from '@testing-library/react';
import CategoryExplorePage, {
  buildCategoryJsonLd,
  CATEGORY_META,
} from '../../../pages/explore/[category]';

jest.mock('../../../context/AppContext', () => ({
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

import { useAppContext } from '../../../context/AppContext';
const mockUseAppContext = useAppContext as jest.Mock;

const MUSEUM_META = CATEGORY_META.museum;
const RESTAURANT_META = CATEGORY_META.restaurant;

const MUSEUM_LISTS = [
  {
    documentId: 'doc-1',
    name: 'British Museum Trail',
    description: 'The best of the British Museum.',
    username: 'alice',
    itemCount: 12,
    categories: ['museum'],
  },
  {
    documentId: 'doc-2',
    name: 'South Kensington Museums',
    username: 'bob',
    itemCount: 3,
    categories: ['museum', 'gallery'],
  },
];

const SINGLE_ITEM_LIST = [
  {
    documentId: 'doc-3',
    name: 'Just One Place',
    username: 'carol',
    itemCount: 1,
    categories: ['museum'],
  },
];

function renderMuseumPage(lists = MUSEUM_LISTS) {
  return render(
    <CategoryExplorePage lists={lists} category="museum" meta={MUSEUM_META} />,
  );
}

beforeEach(() => {
  mockUseAppContext.mockReturnValue({ user: null, initialized: true });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('CategoryExplorePage — heading and metadata', () => {
  it('renders a heading with the category label', () => {
    renderMuseumPage();
    expect(screen.getByRole('heading', { name: /london museums lists/i })).toBeInTheDocument();
  });

  it('renders the category description as a subheading', () => {
    renderMuseumPage();
    expect(screen.getByText(MUSEUM_META.description)).toBeInTheDocument();
  });

  it('renders the page title tag', () => {
    renderMuseumPage();
    expect(document.querySelector('title')?.textContent).toContain('London Museums Lists');
  });
});

describe('CategoryExplorePage — breadcrumb', () => {
  it('renders a breadcrumb nav with Explore link', () => {
    renderMuseumPage();
    const nav = screen.getByRole('navigation', { name: /breadcrumb/i });
    expect(nav).toBeInTheDocument();
    const exploreLink = screen.getByRole('link', { name: /^explore$/i });
    expect(exploreLink).toHaveAttribute('href', '/explore');
  });

  it('breadcrumb shows category label as current page', () => {
    renderMuseumPage();
    const current = screen.getByText('Museums');
    expect(current).toHaveAttribute('aria-current', 'page');
  });
});

describe('CategoryExplorePage — list rendering', () => {
  it('renders a card for each list', () => {
    renderMuseumPage();
    expect(screen.getByText('British Museum Trail')).toBeInTheDocument();
    expect(screen.getByText('South Kensington Museums')).toBeInTheDocument();
  });

  it('shows list descriptions when present', () => {
    renderMuseumPage();
    expect(screen.getByText('The best of the British Museum.')).toBeInTheDocument();
  });

  it('shows author names', () => {
    renderMuseumPage();
    expect(screen.getByText('by alice')).toBeInTheDocument();
    expect(screen.getByText('by bob')).toBeInTheDocument();
  });

  it('shows item count for each list', () => {
    renderMuseumPage();
    expect(screen.getByText('12 places')).toBeInTheDocument();
    expect(screen.getByText('3 places')).toBeInTheDocument();
  });

  it('uses singular "place" for single-item lists', () => {
    render(
      <CategoryExplorePage
        lists={SINGLE_ITEM_LIST}
        category="museum"
        meta={MUSEUM_META}
      />,
    );
    expect(screen.getByText('1 place')).toBeInTheDocument();
  });

  it('each list card links to the correct list URL', () => {
    renderMuseumPage();
    const link = screen.getByRole('link', { name: /british museum trail/i });
    expect(link).toHaveAttribute('href', '/list/alice/doc-1');
  });

  it('shows count of lists displayed', () => {
    renderMuseumPage();
    expect(screen.getByText('2 lists')).toBeInTheDocument();
  });

  it('shows "1 list" in singular when only one list', () => {
    render(
      <CategoryExplorePage
        lists={SINGLE_ITEM_LIST}
        category="museum"
        meta={MUSEUM_META}
      />,
    );
    expect(screen.getByText('1 list')).toBeInTheDocument();
  });
});

describe('CategoryExplorePage — empty state', () => {
  it('shows empty state message when no lists exist for category', () => {
    render(
      <CategoryExplorePage lists={[]} category="museum" meta={MUSEUM_META} />,
    );
    expect(screen.getByText(/no public museums lists yet/i)).toBeInTheDocument();
  });

  it('empty state links to register', () => {
    render(
      <CategoryExplorePage lists={[]} category="museum" meta={MUSEUM_META} />,
    );
    const link = screen.getByRole('link', { name: /be the first/i });
    expect(link).toHaveAttribute('href', '/register');
  });

  it('does not show the grid when empty', () => {
    render(
      <CategoryExplorePage lists={[]} category="museum" meta={MUSEUM_META} />,
    );
    expect(screen.queryByRole('list')).not.toBeInTheDocument();
  });
});

describe('CategoryExplorePage — conversion CTA', () => {
  it('shows CTA banner for unauthenticated initialized users', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true });
    renderMuseumPage();
    expect(screen.getByText(/build your own list/i)).toBeInTheDocument();
  });

  it('CTA link includes the category ref param', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true });
    renderMuseumPage();
    const link = screen.getByRole('link', { name: /build your own list/i });
    expect(link).toHaveAttribute('href', '/register?ref=explore-museum');
  });

  it('CTA ref param uses the correct category slug', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true });
    render(
      <CategoryExplorePage
        lists={[]}
        category="restaurant"
        meta={RESTAURANT_META}
      />,
    );
    const link = screen.getByRole('link', { name: /build your own list/i });
    expect(link).toHaveAttribute('href', '/register?ref=explore-restaurant');
  });

  it('does not show CTA for logged-in users', () => {
    mockUseAppContext.mockReturnValue({
      user: { id: '1', documentId: 'u1', email: 'a@b.com', username: 'alice' },
      initialized: true,
    });
    renderMuseumPage();
    expect(screen.queryByText(/build your own list/i)).not.toBeInTheDocument();
  });

  it('does not show CTA before auth is initialized', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: false });
    renderMuseumPage();
    expect(screen.queryByText(/build your own list/i)).not.toBeInTheDocument();
  });
});

describe('CategoryExplorePage — back link', () => {
  it('renders a back link to the explore page', () => {
    renderMuseumPage();
    const back = screen.getByRole('link', { name: /← all lists/i });
    expect(back).toHaveAttribute('href', '/explore');
  });
});

describe('buildCategoryJsonLd', () => {
  const SITE_URL = 'https://londonlist.vercel.app';

  it('returns a CollectionPage schema type', () => {
    const result = buildCategoryJsonLd('museum', MUSEUM_META, MUSEUM_LISTS, SITE_URL);
    expect((result as Record<string, unknown>)['@type']).toBe('CollectionPage');
  });

  it('includes the category URL', () => {
    const result = buildCategoryJsonLd('museum', MUSEUM_META, MUSEUM_LISTS, SITE_URL) as Record<
      string,
      unknown
    >;
    expect(result.url).toBe(`${SITE_URL}/explore/museum`);
  });

  it('includes the correct page name', () => {
    const result = buildCategoryJsonLd('museum', MUSEUM_META, MUSEUM_LISTS, SITE_URL) as Record<
      string,
      unknown
    >;
    expect(result.name).toBe('London Museums Lists');
  });

  it('mainEntity numberOfItems matches list length', () => {
    const result = buildCategoryJsonLd('museum', MUSEUM_META, MUSEUM_LISTS, SITE_URL) as {
      mainEntity: { numberOfItems: number };
    };
    expect(result.mainEntity.numberOfItems).toBe(MUSEUM_LISTS.length);
  });

  it('itemListElement positions are 1-indexed', () => {
    const result = buildCategoryJsonLd('museum', MUSEUM_META, MUSEUM_LISTS, SITE_URL) as {
      mainEntity: { itemListElement: Array<{ position: number; name: string }> };
    };
    const elements = result.mainEntity.itemListElement;
    expect(elements[0].position).toBe(1);
    expect(elements[1].position).toBe(2);
  });

  it('itemListElement names match list names', () => {
    const result = buildCategoryJsonLd('museum', MUSEUM_META, MUSEUM_LISTS, SITE_URL) as {
      mainEntity: { itemListElement: Array<{ name: string }> };
    };
    expect(result.mainEntity.itemListElement[0].name).toBe('British Museum Trail');
    expect(result.mainEntity.itemListElement[1].name).toBe('South Kensington Museums');
  });

  it('itemListElement URLs are correctly formed', () => {
    const result = buildCategoryJsonLd('museum', MUSEUM_META, MUSEUM_LISTS, SITE_URL) as {
      mainEntity: { itemListElement: Array<{ url: string }> };
    };
    expect(result.mainEntity.itemListElement[0].url).toBe(
      `${SITE_URL}/list/alice/doc-1`,
    );
  });

  it('returns empty itemListElement for empty lists', () => {
    const result = buildCategoryJsonLd('museum', MUSEUM_META, [], SITE_URL) as {
      mainEntity: { itemListElement: unknown[]; numberOfItems: number };
    };
    expect(result.mainEntity.itemListElement).toHaveLength(0);
    expect(result.mainEntity.numberOfItems).toBe(0);
  });
});

describe('CATEGORY_META', () => {
  it('defines metadata for all expected categories', () => {
    const expected = [
      'museum',
      'restaurant',
      'cafe',
      'bar',
      'park',
      'gallery',
      'theatre',
      'cinema',
      'hotel',
      'library',
    ];
    for (const cat of expected) {
      expect(CATEGORY_META[cat]).toBeDefined();
      expect(CATEGORY_META[cat].label).toBeTruthy();
      expect(CATEGORY_META[cat].description).toBeTruthy();
    }
  });
});
