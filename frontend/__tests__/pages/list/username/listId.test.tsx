import { render, screen } from '@testing-library/react';
import PublicListPage, { buildItemListJsonLd } from '../../../../pages/list/[username]/[listId]';

jest.mock('../../../../context/AppContext', () => ({
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

import { useAppContext } from '../../../../context/AppContext';
const mockUseAppContext = useAppContext as jest.Mock;

const TODO_ITEM = {
  documentId: 'item-1',
  name: 'British Museum',
  category: 'museum',
  completed: false,
  osm_id: '123',
  visitedAt: null,
};

const DONE_ITEM = {
  documentId: 'item-2',
  name: 'Tower of London',
  category: 'attraction',
  completed: true,
  osm_id: '456',
  visitedAt: '2026-06-15T10:00:00.000Z',
};

beforeEach(() => {
  mockUseAppContext.mockReturnValue({ user: null, initialized: true, setUser: jest.fn() });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('PublicListPage — not_found state', () => {
  it('renders "List not found" when pageState is not_found', () => {
    render(
      <PublicListPage pageState="not_found" listData={null} username="alice" listId="list-abc" />,
    );

    expect(screen.getByText('List not found.')).toBeInTheDocument();
  });
});

describe('PublicListPage — private state', () => {
  it('renders "This list is private" when pageState is private', () => {
    render(
      <PublicListPage pageState="private" listData={null} username="alice" listId="list-abc" />,
    );

    expect(screen.getByText('This list is private.')).toBeInTheDocument();
  });

  it('includes the username in the heading when private', () => {
    render(
      <PublicListPage pageState="private" listData={null} username="alice" listId="list-abc" />,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("alice's List");
  });
});

describe('PublicListPage — found state with items', () => {
  const listData = {
    data: [TODO_ITEM, DONE_ITEM],
    username: 'alice',
    listName: 'Weekend Wanders',
  };

  it('renders the list name as the page heading', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Weekend Wanders');
  });

  it('renders a "To do" section for incomplete items', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    expect(screen.getByText('To do (1)')).toBeInTheDocument();
    expect(screen.getByText('British Museum')).toBeInTheDocument();
  });

  it('renders a "Done" section for completed items', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    expect(screen.getByText('Done (1)')).toBeInTheDocument();
    expect(screen.getByText('Tower of London')).toBeInTheDocument();
  });

  it('renders the item category', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    expect(screen.getByText('museum')).toBeInTheDocument();
    expect(screen.getByText('attraction')).toBeInTheDocument();
  });

  it('renders a visited date for completed items with visitedAt', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    expect(screen.getByText(/Visited/)).toBeInTheDocument();
  });

  it('renders the subtitle with the username', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    expect(screen.getByText("alice's list")).toBeInTheDocument();
  });
});

describe('PublicListPage — found state with empty list', () => {
  const emptyListData = {
    data: [],
    username: 'alice',
    listName: 'Empty List',
  };

  it('renders an empty state message when the list has no items', () => {
    render(
      <PublicListPage pageState="found" listData={emptyListData} username="alice" listId="list-abc" />,
    );

    expect(screen.getByText('This list is empty.')).toBeInTheDocument();
  });

  it('does not render "To do" or "Done" sections when the list is empty', () => {
    render(
      <PublicListPage pageState="found" listData={emptyListData} username="alice" listId="list-abc" />,
    );

    expect(screen.queryByText(/^To do/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Done/)).not.toBeInTheDocument();
  });
});

describe('PublicListPage — conversion banner', () => {
  const listData = {
    data: [TODO_ITEM],
    username: 'alice',
    listName: 'Weekend Wanders',
  };

  it('shows the conversion banner when the visitor is not logged in', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true, setUser: jest.fn() });

    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    expect(screen.getByText("Inspired by alice's list?")).toBeInTheDocument();
  });

  it('links the conversion CTA to /register with the correct ref', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true, setUser: jest.fn() });

    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    const cta = screen.getByRole('link', { name: 'Create your list' });
    expect(cta).toHaveAttribute('href', '/register?ref=shared-list');
  });

  it('does not show the conversion banner when the visitor is logged in', () => {
    mockUseAppContext.mockReturnValue({
      user: { id: '1', documentId: 'u1', email: 'bob@example.com', username: 'bob' },
      initialized: true,
      setUser: jest.fn(),
    });

    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    expect(screen.queryByText("Inspired by alice's list?")).not.toBeInTheDocument();
  });

  it('does not show the conversion banner when context is not yet initialized', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: false, setUser: jest.fn() });

    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    expect(screen.queryByText("Inspired by alice's list?")).not.toBeInTheDocument();
  });
});

describe('PublicListPage — only todo items', () => {
  const listData = {
    data: [TODO_ITEM],
    username: 'alice',
    listName: 'Things to do',
  };

  it('does not render a "Done" section when all items are incomplete', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    expect(screen.queryByText(/^Done/)).not.toBeInTheDocument();
  });
});

describe('PublicListPage — only done items', () => {
  const listData = {
    data: [DONE_ITEM],
    username: 'alice',
    listName: 'Completed visits',
  };

  it('does not render a "To do" section when all items are complete', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    expect(screen.queryByText(/^To do/)).not.toBeInTheDocument();
  });
});

// ─── JSON-LD structured data ───────────────────────────────────────────────

describe('buildItemListJsonLd — unit tests', () => {
  const listData = {
    data: [TODO_ITEM, DONE_ITEM],
    username: 'alice',
    listName: 'Weekend Wanders',
  };

  it('returns @type ItemList', () => {
    const jsonLd = buildItemListJsonLd(listData, 'alice', 'list-abc') as Record<string, unknown>;
    expect(jsonLd['@type']).toBe('ItemList');
  });

  it('returns @context https://schema.org', () => {
    const jsonLd = buildItemListJsonLd(listData, 'alice', 'list-abc') as Record<string, unknown>;
    expect(jsonLd['@context']).toBe('https://schema.org');
  });

  it('includes the list name in the name field', () => {
    const jsonLd = buildItemListJsonLd(listData, 'alice', 'list-abc') as Record<string, unknown>;
    expect(jsonLd.name as string).toContain('Weekend Wanders');
  });

  it('includes the username in the name field', () => {
    const jsonLd = buildItemListJsonLd(listData, 'alice', 'list-abc') as Record<string, unknown>;
    expect(jsonLd.name as string).toContain('alice');
  });

  it('sets numberOfItems to the total item count', () => {
    const jsonLd = buildItemListJsonLd(listData, 'alice', 'list-abc') as Record<string, unknown>;
    expect(jsonLd.numberOfItems).toBe(2);
  });

  it('sets the author name to the username', () => {
    const jsonLd = buildItemListJsonLd(listData, 'alice', 'list-abc') as Record<
      string,
      { name: string }
    >;
    expect(jsonLd.author.name).toBe('alice');
  });

  it('sets the author @type to Person', () => {
    const jsonLd = buildItemListJsonLd(listData, 'alice', 'list-abc') as Record<
      string,
      { '@type': string }
    >;
    expect(jsonLd.author['@type']).toBe('Person');
  });

  it('includes the canonical URL', () => {
    const jsonLd = buildItemListJsonLd(listData, 'alice', 'list-abc') as Record<string, unknown>;
    expect(jsonLd.url as string).toContain('/list/alice/list-abc');
  });

  it('generates itemListElement with correct positions', () => {
    const jsonLd = buildItemListJsonLd(listData, 'alice', 'list-abc') as Record<
      string,
      Array<{ position: number; name: string }>
    >;
    expect(jsonLd.itemListElement[0].position).toBe(1);
    expect(jsonLd.itemListElement[0].name).toBe('British Museum');
    expect(jsonLd.itemListElement[1].position).toBe(2);
    expect(jsonLd.itemListElement[1].name).toBe('Tower of London');
  });

  it('maps museum category to Museum schema type', () => {
    const jsonLd = buildItemListJsonLd(listData, 'alice', 'list-abc') as Record<
      string,
      Array<{ item: { '@type': string } }>
    >;
    expect(jsonLd.itemListElement[0].item['@type']).toBe('Museum');
  });

  it('falls back to TouristAttraction for unknown category', () => {
    const waterfallData = {
      data: [{ ...TODO_ITEM, category: 'waterfall' }],
      username: 'alice',
      listName: 'Wonders',
    };
    const jsonLd = buildItemListJsonLd(waterfallData, 'alice', 'list-abc') as Record<
      string,
      Array<{ item: { '@type': string } }>
    >;
    expect(jsonLd.itemListElement[0].item['@type']).toBe('TouristAttraction');
  });

  it('falls back to TouristAttraction when category is null', () => {
    const nullCatData = {
      data: [{ ...TODO_ITEM, category: null }],
      username: 'alice',
      listName: 'Places',
    };
    const jsonLd = buildItemListJsonLd(nullCatData, 'alice', 'list-abc') as Record<
      string,
      Array<{ item: { '@type': string } }>
    >;
    expect(jsonLd.itemListElement[0].item['@type']).toBe('TouristAttraction');
  });

  it('includes OSM URL for each item', () => {
    const jsonLd = buildItemListJsonLd(listData, 'alice', 'list-abc') as Record<
      string,
      Array<{ item: { url: string } }>
    >;
    expect(jsonLd.itemListElement[0].item.url).toBe('https://www.openstreetmap.org/123');
  });

  it('generates a description mentioning todo and done counts', () => {
    const jsonLd = buildItemListJsonLd(listData, 'alice', 'list-abc') as Record<string, unknown>;
    expect(jsonLd.description as string).toMatch(/1 to do/);
    expect(jsonLd.description as string).toMatch(/1 done/);
  });

  it('uses singular "place" in description for a single item', () => {
    const singleItemData = {
      data: [TODO_ITEM],
      username: 'alice',
      listName: 'Solo',
    };
    const jsonLd = buildItemListJsonLd(singleItemData, 'alice', 'list-abc') as Record<
      string,
      unknown
    >;
    expect(jsonLd.description as string).toContain('1 place');
    expect(jsonLd.description as string).not.toContain('1 places');
  });

  it('uses plural "places" in description for multiple items', () => {
    const jsonLd = buildItemListJsonLd(listData, 'alice', 'list-abc') as Record<string, unknown>;
    expect(jsonLd.description as string).toContain('2 places');
  });

  it('maps known categories correctly', () => {
    const categories = [
      { cat: 'restaurant', expected: 'Restaurant' },
      { cat: 'cafe', expected: 'CafeOrCoffeeShop' },
      { cat: 'bar', expected: 'BarOrPub' },
      { cat: 'park', expected: 'Park' },
      { cat: 'hotel', expected: 'Hotel' },
      { cat: 'theatre', expected: 'PerformingArtsTheater' },
      { cat: 'cinema', expected: 'MovieTheater' },
      { cat: 'gallery', expected: 'ArtGallery' },
      { cat: 'library', expected: 'Library' },
    ];
    for (const { cat, expected } of categories) {
      const catData = {
        data: [{ ...TODO_ITEM, category: cat }],
        username: 'alice',
        listName: 'Places',
      };
      const jsonLd = buildItemListJsonLd(catData, 'alice', 'list-abc') as Record<
        string,
        Array<{ item: { '@type': string } }>
      >;
      expect(jsonLd.itemListElement[0].item['@type']).toBe(expected);
    }
  });
});

describe('PublicListPage — JSON-LD script tag in DOM', () => {
  const listData = {
    data: [TODO_ITEM, DONE_ITEM],
    username: 'alice',
    listName: 'Weekend Wanders',
  };

  it('renders a JSON-LD script tag when pageState is found', () => {
    const { container } = render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).toBeInTheDocument();
  });

  it('does not render JSON-LD when pageState is not_found', () => {
    const { container } = render(
      <PublicListPage pageState="not_found" listData={null} username="alice" listId="list-abc" />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeInTheDocument();
  });

  it('does not render JSON-LD when pageState is private', () => {
    const { container } = render(
      <PublicListPage pageState="private" listData={null} username="alice" listId="list-abc" />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeInTheDocument();
  });

  it('JSON-LD script content is valid parseable JSON', () => {
    const { container } = render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    const script = container.querySelector('script[type="application/ld+json"]');
    expect(script).not.toBeNull();
    expect(() => JSON.parse(script?.textContent ?? '')).not.toThrow();
  });
});
