import { render, screen, waitFor } from '@testing-library/react';
import { useQuery } from '@apollo/client/react';
import Home, { buildWebSiteJsonLd } from '../../pages/index';

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
}));

jest.mock('../../hooks/use-auth-header', () => ({
  useAuthHeader: () => ({}),
}));

jest.mock('../../context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

jest.mock('../../components/search/place-search', () => ({
  __esModule: true,
  default: () => <div data-testid="place-search" />,
}));

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}));

import { useAppContext } from '../../context/AppContext';
const mockUseAppContext = useAppContext as jest.Mock;
const mockUseQuery = useQuery as unknown as jest.Mock;

const PUBLIC_LISTS = [
  { documentId: 'doc-1', name: 'Weekend Wanders', username: 'alice' },
  { documentId: 'doc-2', name: 'Museums Tour', username: 'bob' },
];

function mockFetch(data: object, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: () => Promise.resolve(data),
  } as Response);
}

function mockListQueries({
  lists = [{ documentId: 'list-1' }],
  items = [],
}: {
  lists?: Array<{ documentId: string }>;
  items?: Array<{ completed: boolean; visitedAt: string | null }>;
} = {}) {
  mockUseQuery.mockImplementation((query: { definitions: [{ name: { value: string } }] }) => {
    const name = query.definitions[0]?.name?.value;
    if (name === 'GetMyLists') return { data: { myLists: lists } };
    return { data: { listItems: items } };
  });
}

beforeEach(() => {
  mockUseAppContext.mockReturnValue({ user: null, setUser: jest.fn(), initialized: true });
  mockListQueries();
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('Home page — public lists', () => {
  it('renders "Community lists" section after fetching public lists', async () => {
    mockFetch({ data: PUBLIC_LISTS });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Community lists')).toBeInTheDocument();
    });

    expect(screen.getByText('Weekend Wanders')).toBeInTheDocument();
    expect(screen.getByText('Museums Tour')).toBeInTheDocument();
  });

  it('renders author names alongside list names', async () => {
    mockFetch({ data: PUBLIC_LISTS });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('by alice')).toBeInTheDocument();
    });

    expect(screen.getByText('by bob')).toBeInTheDocument();
  });

  it('links each list to /list/:username/:documentId', async () => {
    mockFetch({ data: PUBLIC_LISTS });

    render(<Home />);

    await waitFor(() => {
      expect(screen.getByText('Weekend Wanders')).toBeInTheDocument();
    });

    const link = screen.getByText('Weekend Wanders').closest('a');
    expect(link).toHaveAttribute('href', '/list/alice/doc-1');
  });

  it('does not render "Community lists" section when the API returns an empty array', async () => {
    mockFetch({ data: [] });

    render(<Home />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(screen.queryByText('Community lists')).not.toBeInTheDocument();
  });

  it('does not render "Community lists" section when the API call fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network error'));

    render(<Home />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    expect(screen.queryByText('Community lists')).not.toBeInTheDocument();
  });

  it('fetches from the public lists endpoint', async () => {
    mockFetch({ data: [] });

    render(<Home />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/lists/public'),
      );
    });
  });
});

describe('Home page — logged-out hero', () => {
  beforeEach(() => {
    mockFetch({ data: [] });
    mockUseAppContext.mockReturnValue({ user: null, setUser: jest.fn(), initialized: true });
  });

  it('shows the marketing headline for logged-out users', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Your London bucket list, beautifully organised',
    );
  });

  it('shows "Create your free list" CTA linking to /register', () => {
    render(<Home />);
    const link = screen.getByRole('link', { name: 'Create your free list' });
    expect(link).toHaveAttribute('href', '/register');
  });

  it('shows "Log in" link for existing users', () => {
    render(<Home />);
    expect(screen.getByRole('link', { name: 'Log in' })).toHaveAttribute('href', '/login');
  });

  it('shows feature highlights', () => {
    render(<Home />);
    expect(screen.getByText('Discover London')).toBeInTheDocument();
    expect(screen.getByText('Track your visits')).toBeInTheDocument();
    expect(screen.getByText('Share with friends')).toBeInTheDocument();
  });

  it('does not show the place search box for logged-out users', () => {
    render(<Home />);
    expect(screen.queryByTestId('place-search')).not.toBeInTheDocument();
  });
});

describe('Home page — logged-in hero', () => {
  beforeEach(() => {
    mockFetch({ data: [] });
    mockUseAppContext.mockReturnValue({
      user: { id: '1', documentId: 'u1', email: 'a@b.com', username: 'alice', isPro: false },
      setUser: jest.fn(),
      initialized: true,
    });
  });

  it('shows the search prompt headline for logged-in users', () => {
    render(<Home />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'What do you want to do in London?',
    );
  });

  it('shows the place search box for logged-in users', () => {
    render(<Home />);
    expect(screen.getByTestId('place-search')).toBeInTheDocument();
  });

  it('shows "View your list" link', () => {
    render(<Home />);
    expect(screen.getByRole('link', { name: /view your list/i })).toHaveAttribute('href', '/my-list');
  });

  it('does not show the marketing headline for logged-in users', () => {
    render(<Home />);
    expect(screen.queryByText('Your London bucket list, beautifully organised')).not.toBeInTheDocument();
  });

  it('does not show feature highlights for logged-in users', () => {
    render(<Home />);
    expect(screen.queryByText('Discover London')).not.toBeInTheDocument();
  });
});

describe('Home page — Pro upgrade nudge', () => {
  beforeEach(() => {
    mockFetch({ data: [] });
  });

  it('shows the upgrade nudge for free users', () => {
    mockUseAppContext.mockReturnValue({
      user: { id: '1', documentId: 'u1', email: 'a@b.com', username: 'alice', isPro: false },
      setUser: jest.fn(),
      initialized: true,
    });

    render(<Home />);

    expect(screen.getByRole('complementary', { name: /upgrade to pro/i })).toBeInTheDocument();
    expect(screen.getByText(/free plan/i)).toBeInTheDocument();
  });

  it('upgrade nudge links to the pricing page', () => {
    mockUseAppContext.mockReturnValue({
      user: { id: '1', documentId: 'u1', email: 'a@b.com', username: 'alice', isPro: false },
      setUser: jest.fn(),
      initialized: true,
    });

    render(<Home />);

    const link = screen.getByRole('link', { name: /upgrade to pro for unlimited lists/i });
    expect(link).toHaveAttribute('href', '/pricing');
  });

  it('does not show the upgrade nudge for Pro users', () => {
    mockUseAppContext.mockReturnValue({
      user: { id: '2', documentId: 'u2', email: 'b@b.com', username: 'bob', isPro: true },
      setUser: jest.fn(),
      initialized: true,
    });

    render(<Home />);

    expect(screen.queryByRole('complementary', { name: /upgrade to pro/i })).not.toBeInTheDocument();
  });

  it('does not show the upgrade nudge for logged-out users', () => {
    mockUseAppContext.mockReturnValue({
      user: null,
      setUser: jest.fn(),
      initialized: true,
    });

    render(<Home />);

    expect(screen.queryByRole('complementary', { name: /upgrade to pro/i })).not.toBeInTheDocument();
  });
});

describe('Home page — welcome back banner', () => {
  beforeEach(() => {
    mockFetch({ data: [] });
    mockUseAppContext.mockReturnValue({
      user: { id: '1', documentId: 'u1', email: 'a@b.com', username: 'alice', isPro: false },
      setUser: jest.fn(),
      initialized: true,
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('shows no banner when the user has no items yet', () => {
    mockListQueries({ lists: [], items: [] });

    render(<Home />);

    expect(screen.queryByText(/streak/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/places from/i)).not.toBeInTheDocument();
  });

  it('shows the at-risk streak message when the streak is at risk', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-25T12:00:00Z'));
    mockListQueries({
      lists: [{ documentId: 'list-1' }],
      items: [{ completed: true, visitedAt: '2026-05-10T12:00:00Z' }],
    });

    render(<Home />);

    expect(
      screen.getByText(/Your 1-month streak is at risk — visit somewhere before the end of the month!/),
    ).toBeInTheDocument();
  });

  it('shows the streak badge when there is an active streak with no milestone left', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-15T12:00:00Z'));
    mockListQueries({
      lists: [{ documentId: 'list-1' }],
      items: [
        { completed: true, visitedAt: '2026-06-05T12:00:00Z' },
        { completed: true, visitedAt: '2026-06-06T12:00:00Z' },
      ],
    });

    render(<Home />);

    expect(screen.getByText('1-month streak')).toBeInTheDocument();
    expect(screen.queryByText(/places from/i)).not.toBeInTheDocument();
  });

  it('shows the next-milestone message when there is progress but no active streak', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-15T12:00:00Z'));
    mockListQueries({
      lists: [{ documentId: 'list-1' }],
      items: [
        { completed: true, visitedAt: '2026-01-10T12:00:00Z' },
        { completed: false, visitedAt: null },
        { completed: false, visitedAt: null },
        { completed: false, visitedAt: null },
      ],
    });

    render(<Home />);

    expect(screen.getByText("You're 1 place from 50% of your list.")).toBeInTheDocument();
  });

  it('links the banner to /my-list', () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-06-15T12:00:00Z'));
    mockListQueries({
      lists: [{ documentId: 'list-1' }],
      items: [
        { completed: true, visitedAt: '2026-01-10T12:00:00Z' },
        { completed: false, visitedAt: null },
        { completed: false, visitedAt: null },
        { completed: false, visitedAt: null },
      ],
    });

    render(<Home />);

    const banner = screen.getByText("You're 1 place from 50% of your list.").closest('a');
    expect(banner).toHaveAttribute('href', '/my-list');
  });
});

describe('buildWebSiteJsonLd', () => {
  const SITE = 'https://londonlist.vercel.app';

  it('returns a schema with @context of https://schema.org', () => {
    const result = buildWebSiteJsonLd(SITE) as Record<string, unknown>;
    expect(result['@context']).toBe('https://schema.org');
  });

  it('includes a WebSite node with the provided siteUrl', () => {
    const result = buildWebSiteJsonLd(SITE) as Record<string, unknown>;
    const graph = result['@graph'] as Array<Record<string, unknown>>;
    const website = graph.find((n) => n['@type'] === 'WebSite');
    expect(website).toBeDefined();
    expect(website?.url).toBe(SITE);
    expect(website?.name).toBe('London List');
  });

  it('includes a SearchAction pointing to the explore page', () => {
    const result = buildWebSiteJsonLd(SITE) as Record<string, unknown>;
    const graph = result['@graph'] as Array<Record<string, unknown>>;
    const website = graph.find((n) => n['@type'] === 'WebSite') as Record<string, unknown>;
    const action = website?.potentialAction as Record<string, unknown>;
    expect(action?.['@type']).toBe('SearchAction');
    expect(action?.target).toContain('/explore?q=');
  });

  it('includes an Organization node', () => {
    const result = buildWebSiteJsonLd(SITE) as Record<string, unknown>;
    const graph = result['@graph'] as Array<Record<string, unknown>>;
    const org = graph.find((n) => n['@type'] === 'Organization');
    expect(org).toBeDefined();
    expect(org?.name).toBe('London List');
    expect(org?.url).toBe(SITE);
  });
});
