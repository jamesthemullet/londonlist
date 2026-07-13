import { render, screen, waitFor } from '@testing-library/react';
import Home from '../../pages/index';

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
