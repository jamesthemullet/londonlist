import { render, screen, act } from '@testing-library/react';
import { useQuery, useMutation } from '@apollo/client/react';
import MyList from '../../../components/my-list/my-list';

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock('@apollo/client', () => ({
  gql: jest.fn((strings: TemplateStringsArray) => strings[0]),
}));

jest.mock('../../../hooks/use-auth-header', () => ({
  useAuthHeader: () => ({}),
}));

jest.mock('../../../hooks/use-streak', () => ({
  useStreak: () => ({ streak: 0, atRisk: false }),
}));

jest.mock('next/dynamic', () => (fn: () => Promise<unknown>) => {
  fn();
  return () => <div data-testid="list-map" />;
});

jest.mock('../../../components/Loader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}));

jest.mock('../../../components/progress-bar/progress-bar', () => ({
  __esModule: true,
  default: () => <div data-testid="progress-bar" />,
}));

jest.mock('../../../components/streak-badge/streak-badge', () => ({
  __esModule: true,
  default: () => <div data-testid="streak-badge" />,
}));

jest.mock('../../../components/milestone-celebration/milestone-celebration', () => ({
  __esModule: true,
  default: ({ milestone, onDismiss }: { milestone: number; onDismiss: () => void }) => (
    <div data-testid="milestone-celebration" data-milestone={milestone}>
      <button type="button" onClick={onDismiss}>Dismiss</button>
    </div>
  ),
}));

const mockUseQuery = useQuery as unknown as jest.Mock;
const mockUseMutation = useMutation as unknown as jest.Mock;

const NOOP_MUTATION = [jest.fn(), {}];

function makeItem(overrides: Partial<{
  documentId: string;
  name: string;
  category: string | null;
  completed: boolean;
  osm_id: string;
  visitedAt: string | null;
  notes: string | null;
}> = {}) {
  return {
    documentId: 'item-1',
    name: 'British Museum',
    category: 'museum',
    completed: false,
    osm_id: 'relation/1525018',
    visitedAt: null,
    notes: null,
    lat: null,
    lng: null,
    ...overrides,
  };
}

function setupQuery(items: ReturnType<typeof makeItem>[], loading = false) {
  mockUseQuery.mockReturnValue({ loading, error: null, data: { listItems: items } });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseMutation.mockReturnValue(NOOP_MUTATION);
});

describe('MyList — rendering', () => {
  it('shows loader when loading and no data', () => {
    mockUseQuery.mockReturnValue({ loading: true, error: null, data: null });
    render(<MyList listId="list-1" listName="My List" />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('shows error message on query error', () => {
    mockUseQuery.mockReturnValue({ loading: false, error: new Error('fail'), data: null });
    render(<MyList listId="list-1" listName="My List" />);
    expect(screen.getByText('Error loading your list.')).toBeInTheDocument();
  });

  it('shows empty state when no items', () => {
    setupQuery([]);
    render(<MyList listId="list-1" listName="My List" />);
    expect(screen.getByText(/Your list is empty/)).toBeInTheDocument();
  });

  it('renders todo and done sections when items exist', () => {
    setupQuery([
      makeItem({ documentId: 'a', name: 'Tower of London', completed: false }),
      makeItem({ documentId: 'b', name: 'British Museum', completed: true, visitedAt: '2024-01-01T00:00:00Z' }),
    ]);
    render(<MyList listId="list-1" listName="My List" />);
    expect(screen.getByRole('heading', { name: /To do/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Done/i })).toBeInTheDocument();
  });

  it('does not show milestone celebration on initial render', () => {
    setupQuery([
      makeItem({ documentId: 'a', completed: false }),
      makeItem({ documentId: 'b', completed: false }),
    ]);
    render(<MyList listId="list-1" listName="My List" />);
    expect(screen.queryByTestId('milestone-celebration')).not.toBeInTheDocument();
  });
});

describe('MyList — milestone celebration', () => {
  it('shows celebration when completion crosses a milestone after re-render', async () => {
    const items = [
      makeItem({ documentId: 'a', name: 'Place A', completed: false }),
      makeItem({ documentId: 'b', name: 'Place B', completed: false }),
      makeItem({ documentId: 'c', name: 'Place C', completed: false }),
      makeItem({ documentId: 'd', name: 'Place D', completed: false }),
    ];

    // Initial render: 0 of 4 done
    setupQuery(items);
    const { rerender } = render(<MyList listId="list-1" listName="My List" />);
    expect(screen.queryByTestId('milestone-celebration')).not.toBeInTheDocument();

    // Rerender with 1 of 4 done — crosses 25% threshold (ceil(1) = 1)
    const updatedItems = [
      makeItem({ documentId: 'a', name: 'Place A', completed: true, visitedAt: '2024-01-01T00:00:00Z' }),
      makeItem({ documentId: 'b', name: 'Place B', completed: false }),
      makeItem({ documentId: 'c', name: 'Place C', completed: false }),
      makeItem({ documentId: 'd', name: 'Place D', completed: false }),
    ];
    setupQuery(updatedItems);
    await act(async () => {
      rerender(<MyList listId="list-1" listName="My List" />);
    });

    expect(screen.getByTestId('milestone-celebration')).toBeInTheDocument();
    expect(screen.getByTestId('milestone-celebration')).toHaveAttribute('data-milestone', '25');
  });

  it('does not show celebration when completion decreases', async () => {
    const items = [
      makeItem({ documentId: 'a', completed: true, visitedAt: '2024-01-01T00:00:00Z' }),
      makeItem({ documentId: 'b', completed: false }),
    ];

    setupQuery(items);
    const { rerender } = render(<MyList listId="list-1" listName="My List" />);
    expect(screen.queryByTestId('milestone-celebration')).not.toBeInTheDocument();

    // Uncheck item — done count decreases
    const updatedItems = [
      makeItem({ documentId: 'a', completed: false }),
      makeItem({ documentId: 'b', completed: false }),
    ];
    setupQuery(updatedItems);
    await act(async () => {
      rerender(<MyList listId="list-1" listName="My List" />);
    });

    expect(screen.queryByTestId('milestone-celebration')).not.toBeInTheDocument();
  });

  it('hides celebration when dismissed', async () => {
    const items = Array.from({ length: 4 }, (_, i) =>
      makeItem({ documentId: `item-${i}`, name: `Place ${i}`, completed: false }),
    );
    setupQuery(items);
    const { rerender } = render(<MyList listId="list-1" listName="My List" />);

    const updatedItems = items.map((item, i) =>
      i === 0 ? { ...item, completed: true, visitedAt: '2024-01-01T00:00:00Z' } : item,
    );
    setupQuery(updatedItems);
    await act(async () => {
      rerender(<MyList listId="list-1" listName="My List" />);
    });

    expect(screen.getByTestId('milestone-celebration')).toBeInTheDocument();

    await act(async () => {
      screen.getByRole('button', { name: 'Dismiss' }).click();
    });

    expect(screen.queryByTestId('milestone-celebration')).not.toBeInTheDocument();
  });
});
