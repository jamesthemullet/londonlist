import { render, screen, waitFor } from '@testing-library/react';
import Home from '../../pages/index';

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@apollo/client', () => ({
  gql: (strings: TemplateStringsArray) => strings,
}));

jest.mock('../../hooks/use-auth-header', () => ({
  useAuthHeader: () => ({}),
}));

jest.mock('../../hooks/use-streak', () => ({
  useStreak: jest.fn(),
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

import { useQuery } from '@apollo/client/react';
import { useAppContext } from '../../context/AppContext';
import { useStreak } from '../../hooks/use-streak';

const mockUseQuery = useQuery as unknown as jest.Mock;
const mockUseAppContext = useAppContext as jest.Mock;
const mockUseStreak = useStreak as unknown as jest.Mock;

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

beforeEach(() => {
  mockUseAppContext.mockReturnValue({ user: null, setUser: jest.fn(), initialized: true });
  mockUseQuery.mockReturnValue({ data: { listItems: [] }, loading: false });
  mockUseStreak.mockReturnValue({ streak: 0, atRisk: false });
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
      user: { id: '1', documentId: 'u1', email: 'a@b.com', username: 'alice' },
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

describe('Home page — welcome back banner', () => {
  beforeEach(() => {
    mockFetch({ data: [] });
    mockUseAppContext.mockReturnValue({
      user: { id: '1', documentId: 'u1', email: 'a@b.com', username: 'alice' },
      setUser: jest.fn(),
      initialized: true,
    });
  });

  it('does not show the banner when user has no list items', () => {
    mockUseQuery.mockReturnValue({ data: { listItems: [] }, loading: false });
    mockUseStreak.mockReturnValue({ streak: 0, atRisk: false });

    render(<Home />);

    expect(screen.queryByRole('region', { name: 'Your progress' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Continue exploring/)).not.toBeInTheDocument();
  });

  it('shows the banner when user has list items', () => {
    mockUseQuery.mockReturnValue({
      data: { listItems: [{ completed: false, visitedAt: null }] },
      loading: false,
    });
    mockUseStreak.mockReturnValue({ streak: 0, atRisk: false });

    render(<Home />);

    expect(screen.getByRole('region', { name: 'Your progress' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /continue exploring/i })).toHaveAttribute('href', '/my-list');
  });

  it('shows the streak badge when user has an active streak', () => {
    mockUseQuery.mockReturnValue({
      data: { listItems: [{ completed: true, visitedAt: '2026-07-15T00:00:00.000Z' }] },
      loading: false,
    });
    mockUseStreak.mockReturnValue({ streak: 3, atRisk: false });

    render(<Home />);

    expect(screen.getByText('3-month streak')).toBeInTheDocument();
  });

  it('shows the at-risk warning when the streak is at risk', () => {
    mockUseQuery.mockReturnValue({
      data: { listItems: [{ completed: true, visitedAt: '2026-06-20T00:00:00.000Z' }] },
      loading: false,
    });
    mockUseStreak.mockReturnValue({ streak: 2, atRisk: true });

    render(<Home />);

    expect(screen.getByText(/Your 2-month streak is at risk/)).toBeInTheDocument();
  });

  it('shows a milestone message when user is approaching a progress milestone', () => {
    const items = [
      { completed: true, visitedAt: '2026-07-01T00:00:00.000Z' },
      { completed: false, visitedAt: null },
      { completed: false, visitedAt: null },
      { completed: false, visitedAt: null },
    ];
    mockUseQuery.mockReturnValue({ data: { listItems: items }, loading: false });
    mockUseStreak.mockReturnValue({ streak: 0, atRisk: false });

    render(<Home />);

    expect(screen.getByText("You're 1 place from 50% of your list")).toBeInTheDocument();
  });

  it('shows a plural milestone message when multiple places are needed', () => {
    const items = [
      { completed: false, visitedAt: null },
      { completed: false, visitedAt: null },
      { completed: false, visitedAt: null },
      { completed: false, visitedAt: null },
      { completed: false, visitedAt: null },
      { completed: false, visitedAt: null },
      { completed: false, visitedAt: null },
      { completed: false, visitedAt: null },
      { completed: false, visitedAt: null },
      { completed: false, visitedAt: null },
    ];
    mockUseQuery.mockReturnValue({ data: { listItems: items }, loading: false });
    mockUseStreak.mockReturnValue({ streak: 0, atRisk: false });

    render(<Home />);

    expect(screen.getByText("You're 3 places from 25% of your list")).toBeInTheDocument();
  });

  it('shows a "conquered" message when user has completed all items', () => {
    const items = [
      { completed: true, visitedAt: '2026-07-01T00:00:00.000Z' },
      { completed: true, visitedAt: '2026-07-02T00:00:00.000Z' },
    ];
    mockUseQuery.mockReturnValue({ data: { listItems: items }, loading: false });
    mockUseStreak.mockReturnValue({ streak: 0, atRisk: false });

    render(<Home />);

    expect(screen.getByText('London conquered — every place ticked off!')).toBeInTheDocument();
  });

  it('shows the banner when atRisk is true even if there are no items loaded yet', () => {
    mockUseQuery.mockReturnValue({ data: { listItems: [] }, loading: false });
    mockUseStreak.mockReturnValue({ streak: 1, atRisk: true });

    render(<Home />);

    expect(screen.getByRole('region', { name: 'Your progress' })).toBeInTheDocument();
  });

  it('does not show the banner for logged-out users', () => {
    mockUseAppContext.mockReturnValue({ user: null, setUser: jest.fn(), initialized: true });

    render(<Home />);

    expect(screen.queryByRole('region', { name: 'Your progress' })).not.toBeInTheDocument();
  });
});
