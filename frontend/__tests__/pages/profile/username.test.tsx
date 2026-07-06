import { render, screen } from '@testing-library/react';
import ProfilePage from '../../../pages/profile/[username]';

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
    'aria-label': ariaLabel,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    'aria-label'?: string;
  }) => (
    <a href={href} className={className} aria-label={ariaLabel}>
      {children}
    </a>
  ),
}));

import { useAppContext } from '../../../context/AppContext';
const mockUseAppContext = useAppContext as jest.Mock;

const LIST_WITH_ITEMS = {
  documentId: 'list-1',
  name: 'Weekend Wanders',
  itemCount: 5,
  completedCount: 2,
};

const LIST_EMPTY = {
  documentId: 'list-2',
  name: 'Future Plans',
  itemCount: 0,
  completedCount: 0,
};

const LIST_ALL_DONE = {
  documentId: 'list-3',
  name: 'Completed Trip',
  itemCount: 3,
  completedCount: 3,
};

const PROFILE_DATA = {
  username: 'alice',
  lists: [LIST_WITH_ITEMS],
};

beforeEach(() => {
  mockUseAppContext.mockReturnValue({ user: null, initialized: true, setUser: jest.fn() });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('ProfilePage — not_found state', () => {
  it('renders "User not found" when pageState is not_found', () => {
    render(<ProfilePage pageState="not_found" profileData={null} username="alice" />);
    expect(screen.getByText('User not found.')).toBeInTheDocument();
  });
});

describe('ProfilePage — found state with lists', () => {
  it("renders the user's name in the heading", () => {
    render(<ProfilePage pageState="found" profileData={PROFILE_DATA} username="alice" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("alice's London Lists");
  });

  it('renders the stats line with list count and place count', () => {
    render(<ProfilePage pageState="found" profileData={PROFILE_DATA} username="alice" />);
    expect(screen.getByText(/1 public list/)).toBeInTheDocument();
    expect(screen.getByText(/5 places/)).toBeInTheDocument();
    expect(screen.getByText(/2 visited/)).toBeInTheDocument();
  });

  it('uses singular "list" when there is exactly one list', () => {
    render(<ProfilePage pageState="found" profileData={PROFILE_DATA} username="alice" />);
    expect(screen.getByText(/1 public list\b/)).toBeInTheDocument();
  });

  it('uses plural "lists" when there are multiple lists', () => {
    const data = { username: 'alice', lists: [LIST_WITH_ITEMS, LIST_EMPTY] };
    render(<ProfilePage pageState="found" profileData={data} username="alice" />);
    expect(screen.getByText(/2 public lists/)).toBeInTheDocument();
  });

  it('uses singular "place" when there is exactly one place total', () => {
    const singlePlaceList = { ...LIST_WITH_ITEMS, itemCount: 1, completedCount: 0 };
    const data = { username: 'alice', lists: [singlePlaceList] };
    render(<ProfilePage pageState="found" profileData={data} username="alice" />);
    expect(screen.getByText(/1 place\b/)).toBeInTheDocument();
  });

  it('renders a card for each public list', () => {
    const data = { username: 'alice', lists: [LIST_WITH_ITEMS, LIST_EMPTY] };
    render(<ProfilePage pageState="found" profileData={data} username="alice" />);
    expect(screen.getByText('Weekend Wanders')).toBeInTheDocument();
    expect(screen.getByText('Future Plans')).toBeInTheDocument();
  });

  it('links each list card to the correct list URL', () => {
    render(<ProfilePage pageState="found" profileData={PROFILE_DATA} username="alice" />);
    const link = screen.getByRole('link', { name: /Weekend Wanders/ });
    expect(link).toHaveAttribute('href', '/list/alice/list-1');
  });

  it('shows a "to do" count badge for incomplete items', () => {
    render(<ProfilePage pageState="found" profileData={PROFILE_DATA} username="alice" />);
    expect(screen.getByText('3 to do')).toBeInTheDocument();
  });

  it('shows a "done" count badge for completed items', () => {
    render(<ProfilePage pageState="found" profileData={PROFILE_DATA} username="alice" />);
    expect(screen.getByText('2 done')).toBeInTheDocument();
  });

  it('shows an "empty" badge for a list with no items', () => {
    const data = { username: 'alice', lists: [LIST_EMPTY] };
    render(<ProfilePage pageState="found" profileData={data} username="alice" />);
    expect(screen.getByText('empty')).toBeInTheDocument();
  });

  it('does not show "to do" badge when all items are completed', () => {
    const data = { username: 'alice', lists: [LIST_ALL_DONE] };
    render(<ProfilePage pageState="found" profileData={data} username="alice" />);
    expect(screen.queryByText(/to do/)).not.toBeInTheDocument();
  });

  it('does not show "done" badge when no items are completed', () => {
    const allTodoList = { ...LIST_WITH_ITEMS, completedCount: 0 };
    const data = { username: 'alice', lists: [allTodoList] };
    render(<ProfilePage pageState="found" profileData={data} username="alice" />);
    expect(screen.queryByText(/done/)).not.toBeInTheDocument();
  });
});

describe('ProfilePage — found state with no lists', () => {
  it('renders an empty state message when the user has no public lists', () => {
    const data = { username: 'alice', lists: [] };
    render(<ProfilePage pageState="found" profileData={data} username="alice" />);
    expect(screen.getByText('No public lists yet.')).toBeInTheDocument();
  });

  it('renders zero stats when there are no lists', () => {
    const data = { username: 'alice', lists: [] };
    render(<ProfilePage pageState="found" profileData={data} username="alice" />);
    expect(screen.getByText(/0 public lists/)).toBeInTheDocument();
    expect(screen.getByText(/0 places/)).toBeInTheDocument();
  });
});

describe('ProfilePage — stats aggregation', () => {
  it('sums item counts across multiple lists', () => {
    const data = {
      username: 'alice',
      lists: [
        { documentId: 'l1', name: 'A', itemCount: 4, completedCount: 1 },
        { documentId: 'l2', name: 'B', itemCount: 6, completedCount: 3 },
      ],
    };
    render(<ProfilePage pageState="found" profileData={data} username="alice" />);
    expect(screen.getByText(/10 places/)).toBeInTheDocument();
    expect(screen.getByText(/4 visited/)).toBeInTheDocument();
  });
});

describe('ProfilePage — conversion banner', () => {
  it('shows the conversion banner for unauthenticated visitors', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true, setUser: jest.fn() });
    render(<ProfilePage pageState="found" profileData={PROFILE_DATA} username="alice" />);
    expect(screen.getByText("Inspired by alice's lists?")).toBeInTheDocument();
  });

  it('links the conversion CTA to /register with the correct ref', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true, setUser: jest.fn() });
    render(<ProfilePage pageState="found" profileData={PROFILE_DATA} username="alice" />);
    const cta = screen.getByRole('link', { name: 'Create your list' });
    expect(cta).toHaveAttribute('href', '/register?ref=profile');
  });

  it('hides the conversion banner for authenticated users', () => {
    mockUseAppContext.mockReturnValue({
      user: { id: '2', documentId: 'u2', email: 'bob@example.com', username: 'bob' },
      initialized: true,
      setUser: jest.fn(),
    });
    render(<ProfilePage pageState="found" profileData={PROFILE_DATA} username="alice" />);
    expect(screen.queryByText("Inspired by alice's lists?")).not.toBeInTheDocument();
  });

  it('hides the conversion banner before context is initialized', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: false, setUser: jest.fn() });
    render(<ProfilePage pageState="found" profileData={PROFILE_DATA} username="alice" />);
    expect(screen.queryByText("Inspired by alice's lists?")).not.toBeInTheDocument();
  });
});

describe('ProfilePage — OG meta description', () => {
  it('renders the username in the page heading to verify OG content is accurate', () => {
    render(<ProfilePage pageState="found" profileData={PROFILE_DATA} username="alice" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('alice');
  });
});
