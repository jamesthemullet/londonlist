import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PublicListPage, { buildItemListJsonLd, CopyListButton, buildOgDescription } from '../../../../pages/list/[username]/[listId]';

jest.mock('../../../../context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

jest.mock('@apollo/client/react', () => ({
  useMutation: jest.fn(),
}));

jest.mock('@apollo/client', () => ({
  gql: jest.fn((strings: TemplateStringsArray) => strings[0]),
}));

jest.mock('../../../../hooks/use-auth-header', () => ({
  useAuthHeader: jest.fn(() => ({ Authorization: 'Bearer test-token' })),
}));

import { useMutation } from '@apollo/client/react';
const mockUseMutation = useMutation as jest.Mock;

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

jest.mock('next/dynamic', () => () => {
  const MockListMap = ({ items }: { items: { documentId: string }[] }) => (
    <div data-testid="list-map-mock" data-item-count={items.length} />
  );
  MockListMap.displayName = 'ListMap';
  return MockListMap;
});

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
  mockUseMutation.mockReturnValue([jest.fn().mockResolvedValue({}), {}]);
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

  it('renders a link to the user profile in the subtitle', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    const profileLink = screen.getByRole('link', { name: "alice's lists" });
    expect(profileLink).toBeInTheDocument();
    expect(profileLink).toHaveAttribute('href', '/profile/alice');
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

    expect(screen.getByText("Copy alice's list")).toBeInTheDocument();
  });

  it('links the conversion CTA to /register with the copy ref when list has items', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true, setUser: jest.fn() });

    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    const cta = screen.getByRole('link', { name: 'Copy this list' });
    expect(cta).toHaveAttribute('href', '/register?ref=copy-list');
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

// ─── OG / Twitter meta tags ───────────────────────────────────────────────

describe('buildOgDescription — unit tests', () => {
  it('includes the item count', () => {
    const listData = {
      data: [TODO_ITEM, DONE_ITEM],
      username: 'alice',
      listName: 'Weekend Wanders',
    };
    expect(buildOgDescription(listData)).toContain('2 places');
  });

  it('uses singular "place" for a single item', () => {
    const listData = { data: [TODO_ITEM], username: 'alice', listName: 'Solo' };
    expect(buildOgDescription(listData)).toContain('1 place');
    expect(buildOgDescription(listData)).not.toContain('1 places');
  });

  it('includes the todo and done counts', () => {
    const listData = {
      data: [TODO_ITEM, DONE_ITEM],
      username: 'alice',
      listName: 'Weekend Wanders',
    };
    const desc = buildOgDescription(listData);
    expect(desc).toContain('1 to visit');
    expect(desc).toContain('1 done');
  });

  it('returns a fallback for an empty list', () => {
    const listData = { data: [], username: 'alice', listName: 'Empty' };
    expect(buildOgDescription(listData)).toContain("alice's London list");
  });

  it('includes the username', () => {
    const listData = {
      data: [TODO_ITEM],
      username: 'bob',
      listName: 'Hidden Gems',
    };
    expect(buildOgDescription(listData)).toContain('bob');
  });

  it('prefers the list description when set', () => {
    const listData = {
      data: [TODO_ITEM, DONE_ITEM],
      username: 'alice',
      listName: 'Weekend Wanders',
      description: 'My favourite spots in East London',
    };
    expect(buildOgDescription(listData)).toBe('My favourite spots in East London');
  });

  it('falls back to generated text when description is null', () => {
    const listData = {
      data: [TODO_ITEM],
      username: 'alice',
      listName: 'Solo',
      description: null,
    };
    expect(buildOgDescription(listData)).toContain('1 place');
  });
});

describe('PublicListPage — OG / Twitter meta tags', () => {
  const listData = {
    data: [TODO_ITEM, DONE_ITEM],
    username: 'alice',
    listName: 'Weekend Wanders',
  };

  // React 19 hoists <meta> to document.head, so we query there rather than the container div.
  function getMeta(attr: string, value: string) {
    return document.querySelector(`meta[${attr}="${value}"]`);
  }

  it('renders og:type "article"', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(getMeta('property', 'og:type')).toHaveAttribute('content', 'article');
  });

  it('renders og:site_name "London List"', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(getMeta('property', 'og:site_name')).toHaveAttribute('content', 'London List');
  });

  it('renders og:title including the list name and username', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    const ogTitle = getMeta('property', 'og:title');
    expect(ogTitle?.getAttribute('content')).toContain('Weekend Wanders');
    expect(ogTitle?.getAttribute('content')).toContain('alice');
  });

  it('renders og:description with item count', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(getMeta('property', 'og:description')?.getAttribute('content')).toContain('2 places');
  });

  it('renders og:url with the canonical list URL', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(getMeta('property', 'og:url')?.getAttribute('content')).toContain('/list/alice/list-abc');
  });

  it('renders twitter:card "summary_large_image"', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(getMeta('name', 'twitter:card')).toHaveAttribute('content', 'summary_large_image');
  });

  it('renders twitter:title including the list name', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(getMeta('name', 'twitter:title')?.getAttribute('content')).toContain('Weekend Wanders');
  });

  it('renders twitter:description with item count', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(getMeta('name', 'twitter:description')?.getAttribute('content')).toContain('2 places');
  });

  it('uses the list description in meta when set', () => {
    const withDescription = { ...listData, description: 'Hidden gems of Shoreditch' };
    render(
      <PublicListPage pageState="found" listData={withDescription} username="alice" listId="list-abc" />,
    );
    expect(getMeta('name', 'description')?.getAttribute('content')).toBe('Hidden gems of Shoreditch');
  });
});

describe('PublicListPage — list description display', () => {
  it('renders the list description when provided', () => {
    const listData = {
      data: [],
      username: 'alice',
      listName: 'Weekend Wanders',
      description: 'A guide to East London markets',
    };
    const { getByText } = render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(getByText('A guide to East London markets')).toBeInTheDocument();
  });

  it('does not render a description element when description is null', () => {
    const listData = {
      data: [],
      username: 'alice',
      listName: 'Weekend Wanders',
      description: null,
    };
    const { queryByText } = render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(queryByText(/A guide/)).not.toBeInTheDocument();
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

describe('PublicListPage — view count', () => {
  it('shows the view count when it is greater than zero', () => {
    const listData = {
      data: [TODO_ITEM],
      username: 'alice',
      listName: 'Weekend Wanders',
      viewCount: 42,
    };

    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    expect(screen.getByText('42 views')).toBeInTheDocument();
  });

  it('uses singular "view" for a count of 1', () => {
    const listData = {
      data: [TODO_ITEM],
      username: 'alice',
      listName: 'Weekend Wanders',
      viewCount: 1,
    };

    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    expect(screen.getByText('1 view')).toBeInTheDocument();
  });

  it('hides the view count when it is zero', () => {
    const listData = {
      data: [TODO_ITEM],
      username: 'alice',
      listName: 'Weekend Wanders',
      viewCount: 0,
    };

    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    expect(screen.queryByText(/views?$/)).not.toBeInTheDocument();
  });

  it('hides the view count when viewCount is not provided', () => {
    const listData = {
      data: [TODO_ITEM],
      username: 'alice',
      listName: 'Weekend Wanders',
    };

    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    expect(screen.queryByText(/views?$/)).not.toBeInTheDocument();
  });

  it('formats large view counts with locale separators', () => {
    const listData = {
      data: [TODO_ITEM],
      username: 'alice',
      listName: 'Weekend Wanders',
      viewCount: 1234567,
    };

    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    const badge = screen.getByText(/views$/);
    expect(badge.textContent).toMatch(/1[,.]234[,.]567/);
  });

  it('renders the emoji icon as aria-hidden so screen readers skip it', () => {
    const listData = {
      data: [TODO_ITEM],
      username: 'alice',
      listName: 'Weekend Wanders',
      viewCount: 42,
    };

    const { container } = render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    const hiddenEmoji = container.querySelector('[aria-hidden="true"]');
    expect(hiddenEmoji).toBeInTheDocument();
    expect(hiddenEmoji?.textContent).toBe('👁');
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

describe('CopyListButton', () => {
  const ITEMS = [
    {
      documentId: 'item-1',
      name: 'British Museum',
      category: 'museum',
      completed: false,
      osm_id: 'node/123',
      visitedAt: null,
    },
    {
      documentId: 'item-2',
      name: 'Tate Modern',
      category: 'gallery',
      completed: false,
      osm_id: 'way/456',
      visitedAt: null,
    },
  ];

  it('renders the copy button in idle state', () => {
    render(<CopyListButton items={ITEMS} listName="Weekend Wanders" />);
    expect(screen.getByRole('button', { name: '+ Copy this list' })).toBeInTheDocument();
  });

  it('button is enabled by default', () => {
    render(<CopyListButton items={ITEMS} listName="Weekend Wanders" />);
    expect(screen.getByRole('button', { name: '+ Copy this list' })).not.toBeDisabled();
  });

  it('shows "Copying…" and disables button while copying', async () => {
    let resolveCreate!: (value: unknown) => void;
    const createListMock = jest.fn(
      () => new Promise((resolve) => { resolveCreate = resolve; }),
    );
    mockUseMutation
      .mockReturnValueOnce([createListMock, {}])
      .mockReturnValueOnce([jest.fn(), {}]);

    render(<CopyListButton items={ITEMS} listName="Weekend Wanders" />);

    fireEvent.click(screen.getByRole('button', { name: '+ Copy this list' }));

    expect(await screen.findByRole('button', { name: 'Copying…' })).toBeDisabled();

    resolveCreate({ data: { createMyList: { documentId: 'new-list-1' } } });
  });

  it('shows success message with a link after copy completes', async () => {
    const createListMock = jest
      .fn()
      .mockResolvedValue({ data: { createMyList: { documentId: 'new-list-1' } } });
    const createItemMock = jest.fn().mockResolvedValue({ data: { createListItem: { documentId: 'new-item-1' } } });

    mockUseMutation
      .mockReturnValueOnce([createListMock, {}])
      .mockReturnValueOnce([createItemMock, {}]);

    render(<CopyListButton items={ITEMS} listName="Weekend Wanders" />);

    fireEvent.click(screen.getByRole('button', { name: '+ Copy this list' }));

    await waitFor(() => {
      expect(screen.getByText('List copied!')).toBeInTheDocument();
    });

    const link = screen.getByRole('link', { name: 'View your lists →' });
    expect(link).toHaveAttribute('href', '/my-list');
  });

  it('calls createMyList with the list name', async () => {
    const createListMock = jest
      .fn()
      .mockResolvedValue({ data: { createMyList: { documentId: 'new-list-1' } } });
    const createItemMock = jest.fn().mockResolvedValue({ data: { createListItem: { documentId: 'new-item-1' } } });

    mockUseMutation
      .mockReturnValueOnce([createListMock, {}])
      .mockReturnValueOnce([createItemMock, {}]);

    render(<CopyListButton items={ITEMS} listName="Weekend Wanders" />);
    fireEvent.click(screen.getByRole('button', { name: '+ Copy this list' }));

    await waitFor(() => expect(createListMock).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { name: 'Weekend Wanders' } }),
    ));
  });

  it('calls createListItem once for each item', async () => {
    const createListMock = jest
      .fn()
      .mockResolvedValue({ data: { createMyList: { documentId: 'new-list-1' } } });
    const createItemMock = jest.fn().mockResolvedValue({ data: { createListItem: { documentId: 'new-item-1' } } });

    mockUseMutation
      .mockReturnValueOnce([createListMock, {}])
      .mockReturnValueOnce([createItemMock, {}]);

    render(<CopyListButton items={ITEMS} listName="Weekend Wanders" />);
    fireEvent.click(screen.getByRole('button', { name: '+ Copy this list' }));

    await waitFor(() => expect(createItemMock).toHaveBeenCalledTimes(ITEMS.length));
  });

  it('shows an error message when the copy fails', async () => {
    const createListMock = jest.fn().mockRejectedValue(new Error('Network error'));
    mockUseMutation
      .mockReturnValueOnce([createListMock, {}])
      .mockReturnValueOnce([jest.fn(), {}]);

    render(<CopyListButton items={ITEMS} listName="Weekend Wanders" />);
    fireEvent.click(screen.getByRole('button', { name: '+ Copy this list' }));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });
  });

  it('shows an error when createMyList returns no documentId', async () => {
    const createListMock = jest.fn().mockResolvedValue({ data: { createMyList: null } });
    mockUseMutation
      .mockReturnValueOnce([createListMock, {}])
      .mockReturnValueOnce([jest.fn(), {}]);

    render(<CopyListButton items={ITEMS} listName="Weekend Wanders" />);
    fireEvent.click(screen.getByRole('button', { name: '+ Copy this list' }));

    await waitFor(() => {
      expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
    });
  });
});

describe('PublicListPage — copy list integration', () => {
  const listData = {
    data: [
      {
        documentId: 'item-1',
        name: 'British Museum',
        category: 'museum',
        completed: false,
        osm_id: 'node/123',
        visitedAt: null,
      },
    ],
    username: 'alice',
    listName: 'Weekend Wanders',
  };

  it('shows "Copy this list" button for authenticated users with items', () => {
    mockUseAppContext.mockReturnValue({
      user: { id: '1', username: 'bob' },
      initialized: true,
    });

    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    expect(screen.getByRole('button', { name: '+ Copy this list' })).toBeInTheDocument();
  });

  it('does not show "Copy this list" button for unauthenticated users', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true });

    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    expect(screen.queryByRole('button', { name: '+ Copy this list' })).not.toBeInTheDocument();
  });

  it('shows "Copy this list" CTA in conversion banner for unauthenticated users when list has items', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true });

    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    const ctaLink = screen.getByRole('link', { name: 'Copy this list' });
    expect(ctaLink).toHaveAttribute('href', '/register?ref=copy-list');
  });

  it('shows generic CTA for unauthenticated users when list is empty', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true });
    const emptyListData = { data: [], username: 'alice', listName: 'Empty List' };

    render(
      <PublicListPage
        pageState="found"
        listData={emptyListData}
        username="alice"
        listId="list-abc"
      />,
    );

    expect(screen.getByRole('link', { name: 'Create your list' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Copy this list' })).not.toBeInTheDocument();
  });

  it('does not show copy button when not yet initialized (avoids flash)', () => {
    mockUseAppContext.mockReturnValue({
      user: { id: '1', username: 'bob' },
      initialized: false,
    });

    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );

    expect(screen.queryByRole('button', { name: '+ Copy this list' })).not.toBeInTheDocument();
  });
});

const TODO_ITEM_WITH_COORDS = {
  documentId: 'item-1',
  name: 'British Museum',
  category: 'museum',
  completed: false,
  osm_id: '123',
  visitedAt: null,
  lat: 51.5194,
  lng: -0.1269,
};

const DONE_ITEM_WITH_COORDS = {
  documentId: 'item-2',
  name: 'Tower of London',
  category: 'attraction',
  completed: true,
  osm_id: '456',
  visitedAt: null,
  lat: 51.5081,
  lng: -0.0759,
};

describe('PublicListPage — map view', () => {
  it('renders the map when items have coordinates', () => {
    const listData = {
      data: [TODO_ITEM_WITH_COORDS],
      username: 'alice',
      listName: 'My London List',
    };
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(screen.getByTestId('list-map-mock')).toBeInTheDocument();
  });

  it('passes the correct item count to the map', () => {
    const listData = {
      data: [TODO_ITEM_WITH_COORDS, DONE_ITEM_WITH_COORDS],
      username: 'alice',
      listName: 'My London List',
    };
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(screen.getByTestId('list-map-mock')).toHaveAttribute('data-item-count', '2');
  });

  it('does not render the map when no items have coordinates', () => {
    const listData = {
      data: [{ ...TODO_ITEM_WITH_COORDS, lat: null, lng: null }],
      username: 'alice',
      listName: 'My London List',
    };
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(screen.queryByTestId('list-map-mock')).not.toBeInTheDocument();
  });

  it('does not render the map when the list is empty', () => {
    const listData = { data: [], username: 'alice', listName: 'Empty List' };
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(screen.queryByTestId('list-map-mock')).not.toBeInTheDocument();
  });

  it('only passes items with valid coordinates to the map', () => {
    const noCoords = { ...TODO_ITEM_WITH_COORDS, documentId: 'item-3', lat: null, lng: null };
    const listData = {
      data: [TODO_ITEM_WITH_COORDS, noCoords],
      username: 'alice',
      listName: 'Mixed List',
    };
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(screen.getByTestId('list-map-mock')).toHaveAttribute('data-item-count', '1');
  });

  it('renders the map legend when map is shown', () => {
    const listData = {
      data: [TODO_ITEM_WITH_COORDS],
      username: 'alice',
      listName: 'My London List',
    };
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(screen.getByText('To do')).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('does not render the map legend when no items have coordinates', () => {
    const listData = {
      data: [{ ...TODO_ITEM_WITH_COORDS, lat: null, lng: null }],
      username: 'alice',
      listName: 'My London List',
    };
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(screen.queryByText('To do')).not.toBeInTheDocument();
    expect(screen.queryByText('Done')).not.toBeInTheDocument();
  });
});

// ─── Notes on public list pages ───────────────────────────────────────────

describe('PublicListPage — item notes', () => {
  it('renders notes for a todo item that has them', () => {
    const listData = {
      data: [{ ...TODO_ITEM, notes: 'Book tickets in advance' }],
      username: 'alice',
      listName: 'Weekend Wanders',
    };
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(screen.getByText('Book tickets in advance')).toBeInTheDocument();
  });

  it('renders notes for a done item that has them', () => {
    const listData = {
      data: [{ ...DONE_ITEM, notes: 'Loved the Crown Jewels exhibit' }],
      username: 'alice',
      listName: 'Done Places',
    };
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(screen.getByText('Loved the Crown Jewels exhibit')).toBeInTheDocument();
  });

  it('does not render a notes element when notes is null', () => {
    const listData = {
      data: [{ ...TODO_ITEM, notes: null }],
      username: 'alice',
      listName: 'Plain List',
    };
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(screen.queryByText('Book tickets in advance')).not.toBeInTheDocument();
  });

  it('does not render a notes element when notes is absent from the item', () => {
    const listData = {
      data: [TODO_ITEM],
      username: 'alice',
      listName: 'Old Format List',
    };
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    const notesParagraphs = document.querySelectorAll('p');
    for (const p of notesParagraphs) {
      expect(p.textContent).not.toBe('');
    }
  });

  it('renders notes for multiple items independently', () => {
    const listData = {
      data: [
        { ...TODO_ITEM, notes: 'First tip' },
        { ...DONE_ITEM, notes: 'Second tip' },
      ],
      username: 'alice',
      listName: 'Two Items',
    };
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" listId="list-abc" />,
    );
    expect(screen.getByText('First tip')).toBeInTheDocument();
    expect(screen.getByText('Second tip')).toBeInTheDocument();
  });
});
