import { render, screen, fireEvent } from '@testing-library/react';
import ExplorePage from '../../pages/explore';

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
  { documentId: 'doc-1', name: 'Weekend Wanders', username: 'alice' },
  { documentId: 'doc-2', name: 'Museum Trail', username: 'bob' },
  { documentId: 'doc-3', name: 'Hidden Gems', username: 'alice' },
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
    expect(screen.getByText(/no lists match/i)).toBeInTheDocument();
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
