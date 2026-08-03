import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const THIS_MONTH_DATE = new Date();
THIS_MONTH_DATE.setDate(1);
const THIS_MONTH_ISO = THIS_MONTH_DATE.toISOString();

const TODO_ITEMS = [
  { documentId: 'item-1', name: 'British Museum', category: 'museum', completed: false, osm_id: '123', visitedAt: null },
  { documentId: 'item-2', name: 'Hyde Park', category: 'park', completed: false, osm_id: '456', visitedAt: null },
];

const DONE_ITEMS = [
  { documentId: 'item-3', name: 'Tower of London', category: 'attraction', completed: true, osm_id: '789', visitedAt: THIS_MONTH_ISO },
];

function setupMutations() {
  const mockToggle = jest.fn().mockResolvedValue({});
  const mockDelete = jest.fn().mockResolvedValue({});
  const mockUpdateNotes = jest.fn().mockResolvedValue({});
  mockUseMutation
    .mockReturnValueOnce([mockToggle, {}])
    .mockReturnValueOnce([mockDelete, {}])
    .mockReturnValueOnce([mockUpdateNotes, {}]);
  return { mockToggle, mockDelete, mockUpdateNotes };
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

describe('MyList — visit diary', () => {
  it('renders a visited date beneath a completed item that has visitedAt', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: DONE_ITEMS }, error: undefined });

    render(<MyList listId="list-1" />);

    expect(screen.getByText(/^Visited /)).toBeInTheDocument();
  });

  it('does not render a visited date when visitedAt is null', () => {
    setupMutations();
    const itemWithoutDate = [{ ...DONE_ITEMS[0], visitedAt: null }];
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: itemWithoutDate }, error: undefined });

    render(<MyList listId="list-1" />);

    expect(screen.queryByText(/^Visited /)).not.toBeInTheDocument();
  });

  it('shows the monthly summary when completed items were visited this month', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: DONE_ITEMS }, error: undefined });

    render(<MyList listId="list-1" />);

    expect(screen.getByText(/place.*visited this month/i)).toBeInTheDocument();
  });

  it('does not show the monthly summary when no items were visited this month', () => {
    setupMutations();
    const oldDate = new Date(2000, 0, 1).toISOString();
    const itemOldVisit = [{ ...DONE_ITEMS[0], visitedAt: oldDate }];
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: itemOldVisit }, error: undefined });

    render(<MyList listId="list-1" />);

    expect(screen.queryByText(/visited this month/i)).not.toBeInTheDocument();
  });
});

describe('MyList — interactions', () => {
  it('calls toggleComplete with completed: true and a visitedAt timestamp when a todo item is checked', () => {
    const { mockToggle } = setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: TODO_ITEMS }, error: undefined });

    render(<MyList listId="list-1" />);

    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);

    expect(mockToggle).toHaveBeenCalledWith({
      variables: { documentId: 'item-1', completed: true, visitedAt: expect.any(String) },
    });
  });

  it('calls toggleComplete with completed: false and visitedAt: null when a done item is unchecked', () => {
    const { mockToggle } = setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: DONE_ITEMS }, error: undefined });

    render(<MyList listId="list-1" />);

    const checkbox = screen.getByRole('checkbox');
    fireEvent.click(checkbox);

    expect(mockToggle).toHaveBeenCalledWith({
      variables: { documentId: 'item-3', completed: false, visitedAt: null },
    });
  });

  it('calls deleteItem with the correct documentId when Remove is clicked', () => {
    const { mockDelete } = setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: TODO_ITEMS }, error: undefined });

    render(<MyList listId="list-1" />);

    const deleteButtons = screen.getAllByRole('button', { name: /^Remove / });
    fireEvent.click(deleteButtons[0]);

    expect(mockDelete).toHaveBeenCalledWith({
      variables: { documentId: 'item-1' },
    });
  });
});

describe('MyList — interactions (done items)', () => {
  it('calls deleteItem with the correct documentId when Remove is clicked on a done item', () => {
    const { mockDelete } = setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: DONE_ITEMS }, error: undefined });

    render(<MyList listId="list-1" />);

    const deleteButton = screen.getByRole('button', { name: /^Remove / });
    fireEvent.click(deleteButton);

    expect(mockDelete).toHaveBeenCalledWith({
      variables: { documentId: 'item-3' },
    });
  });
});

describe('MyList — notes integration', () => {
  const TODO_WITH_NOTES = [
    { documentId: 'item-notes-1', name: 'Tate Modern', category: 'gallery', completed: false, osm_id: 'n1', visitedAt: null, notes: null },
  ];
  const DONE_WITH_NOTES = [
    { documentId: 'item-notes-2', name: 'Borough Market', category: 'market', completed: true, osm_id: 'n2', visitedAt: new Date().toISOString(), notes: null },
  ];

  it('calls updateNotes with the correct documentId and text when saving notes on a todo item', async () => {
    const user = userEvent.setup();
    const { mockUpdateNotes } = setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: TODO_WITH_NOTES }, error: undefined });

    render(<MyList listId="list-1" />);

    await user.click(screen.getByRole('button', { name: '+ Add note' }));
    await user.type(screen.getByRole('textbox', { name: 'Notes for Tate Modern' }), 'Must see Turbine Hall');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockUpdateNotes).toHaveBeenCalledWith({
      variables: { documentId: 'item-notes-1', notes: 'Must see Turbine Hall' },
    });
  });

  it('calls updateNotes with the correct documentId and text when saving notes on a done item', async () => {
    const user = userEvent.setup();
    const { mockUpdateNotes } = setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { listItems: DONE_WITH_NOTES }, error: undefined });

    render(<MyList listId="list-1" />);

    await user.click(screen.getByRole('button', { name: '+ Add note' }));
    await user.type(screen.getByRole('textbox', { name: 'Notes for Borough Market' }), 'Go early on Saturday');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(mockUpdateNotes).toHaveBeenCalledWith({
      variables: { documentId: 'item-notes-2', notes: 'Go early on Saturday' },
    });
  });
});
