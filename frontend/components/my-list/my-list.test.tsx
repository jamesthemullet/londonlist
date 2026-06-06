import { render, screen, fireEvent } from '@testing-library/react';
import { useQuery, useMutation } from '@apollo/client/react';
import MyList from './my-list';

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock('@apollo/client', () => ({
  gql: (strings: TemplateStringsArray) => strings,
}));

jest.mock('../../hooks/use-auth-header', () => ({
  useAuthHeader: () => ({}),
}));

jest.mock('../Loader', () => () => <div data-testid="loader" />);
jest.mock('../progress-bar/progress-bar', () => () => null);

const mockUseQuery = useQuery as unknown as jest.Mock;
const mockUseMutation = useMutation as unknown as jest.Mock;

const TODO_ITEMS = [
  { documentId: 'item-1', name: 'British Museum', category: 'museum', completed: false, osm_id: '123' },
  { documentId: 'item-2', name: 'Hyde Park', category: 'park', completed: false, osm_id: '456' },
];

const DONE_ITEMS = [
  { documentId: 'item-3', name: 'Tower of London', category: 'attraction', completed: true, osm_id: '789' },
];

function setupMutations() {
  const mockToggle = jest.fn().mockResolvedValue({});
  const mockDelete = jest.fn().mockResolvedValue({});
  mockUseMutation
    .mockReturnValueOnce([mockToggle, {}])
    .mockReturnValueOnce([mockDelete, {}]);
  return { mockToggle, mockDelete };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('MyList — loading and error states', () => {
  it('shows a loader while the query is in flight', () => {
    mockUseMutation.mockReturnValue([jest.fn(), {}]);
    mockUseQuery.mockReturnValue({ loading: true, data: undefined, error: undefined });

    render(<MyList listId="list-1" />);

    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('shows an error message when the query fails', () => {
    mockUseMutation.mockReturnValue([jest.fn(), {}]);
    mockUseQuery.mockReturnValue({ loading: false, data: undefined, error: new Error('Network error') });

    render(<MyList listId="list-1" />);

    expect(screen.getByText('Error loading your list.')).toBeInTheDocument();
  });

  it('shows the empty-state prompt when there are no items', () => {
    mockUseMutation.mockReturnValue([jest.fn(), {}]);
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: [] }, error: undefined });

    render(<MyList listId="list-1" />);

    expect(screen.getByText(/your list is empty/i)).toBeInTheDocument();
  });
});

describe('MyList — rendering items', () => {
  it('renders the "To do" section with uncompleted items', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: TODO_ITEMS }, error: undefined });

    render(<MyList listId="list-1" />);

    expect(screen.getByText('To do (2)')).toBeInTheDocument();
    expect(screen.getByText('British Museum')).toBeInTheDocument();
    expect(screen.getByText('Hyde Park')).toBeInTheDocument();
  });

  it('renders the "Done" section with completed items', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: DONE_ITEMS }, error: undefined });

    render(<MyList listId="list-1" />);

    expect(screen.getByText('Done (1)')).toBeInTheDocument();
    expect(screen.getByText('Tower of London')).toBeInTheDocument();
  });

  it('renders both sections when there is a mix of completed and incomplete items', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({
      loading: false,
      data: { listItems: [...TODO_ITEMS, ...DONE_ITEMS] },
      error: undefined,
    });

    render(<MyList listId="list-1" />);

    expect(screen.getByText('To do (2)')).toBeInTheDocument();
    expect(screen.getByText('Done (1)')).toBeInTheDocument();
  });

  it('does not render a "Done" section when all items are incomplete', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: TODO_ITEMS }, error: undefined });

    render(<MyList listId="list-1" />);

    expect(screen.queryByText(/^Done/)).not.toBeInTheDocument();
  });

  it('does not render a "To do" section when all items are complete', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: DONE_ITEMS }, error: undefined });

    render(<MyList listId="list-1" />);

    expect(screen.queryByText(/^To do/)).not.toBeInTheDocument();
  });

  it('renders the item category when present', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: TODO_ITEMS }, error: undefined });

    render(<MyList listId="list-1" />);

    expect(screen.getByText('museum')).toBeInTheDocument();
    expect(screen.getByText('park')).toBeInTheDocument();
  });
});

describe('MyList — interactions', () => {
  it('calls toggleComplete with completed: true when a todo item is checked', () => {
    const { mockToggle } = setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: TODO_ITEMS }, error: undefined });

    render(<MyList listId="list-1" />);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(mockToggle).toHaveBeenCalledWith({
      variables: { documentId: 'item-1', completed: true },
    });
  });

  it('calls toggleComplete with completed: false when a done item is unchecked', () => {
    const { mockToggle } = setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: DONE_ITEMS }, error: undefined });

    render(<MyList listId="list-1" />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockToggle).toHaveBeenCalledWith({
      variables: { documentId: 'item-3', completed: false },
    });
  });

  it('calls deleteItem with the correct documentId when Remove is clicked', () => {
    const { mockDelete } = setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: TODO_ITEMS }, error: undefined });

    render(<MyList listId="list-1" />);

    const deleteButtons = screen.getAllByRole('button', { name: 'Remove' });
    fireEvent.click(deleteButtons[0]);

    expect(mockDelete).toHaveBeenCalledWith({
      variables: { documentId: 'item-1' },
    });
  });
});
