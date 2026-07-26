import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { useQuery, useMutation } from '@apollo/client/react';
import { useRouter } from 'next/router';
import { useAppContext } from '../../context/AppContext';
import MyListPage from '../../pages/my-list';

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

jest.mock('../../context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('../../components/my-list/my-list', () => ({
  __esModule: true,
  default: () => <div data-testid="my-list" />,
}));

jest.mock('../../components/search/place-search', () => ({
  __esModule: true,
  default: () => <div data-testid="place-search" />,
}));

jest.mock('../../components/list-visibility-toggle/list-visibility-toggle', () => ({
  __esModule: true,
  default: () => <div data-testid="visibility-toggle" />,
}));

const mockUseQuery = useQuery as unknown as jest.Mock;
const mockUseMutation = useMutation as unknown as jest.Mock;
const mockUseAppContext = useAppContext as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

const MOCK_ROUTER = { push: jest.fn() };

const MOCK_USER = { id: '1', documentId: 'u1', email: 'a@b.com', username: 'alice' };

const TWO_LISTS = [
  { documentId: 'list-1', name: 'My List', isPublic: false },
  { documentId: 'list-2', name: 'Weekend Plans', isPublic: true },
];

const ONE_LIST = [{ documentId: 'list-1', name: 'My List', isPublic: false }];

function setupMutations({
  createResult = { data: { createMyList: { documentId: 'list-new', name: 'New', isPublic: false } } },
  updateResult = { data: {} },
  deleteResult = { data: {} },
} = {}) {
  const mockCreate = jest.fn().mockResolvedValue(createResult);
  const mockUpdate = jest.fn().mockResolvedValue(updateResult);
  const mockDelete = jest.fn().mockResolvedValue(deleteResult);
  // Use mockImplementation so the correct mock is returned on every render cycle,
  // not just the first (mockReturnValueOnce would be exhausted after the initial render).
  mockUseMutation.mockImplementation((query: unknown) => {
    const str = Array.isArray(query) ? String(query[0]) : '';
    if (str.includes('CreateMyList')) return [mockCreate, {}];
    if (str.includes('UpdateMyList')) return [mockUpdate, {}];
    return [mockDelete, {}];
  });
  return { mockCreate, mockUpdate, mockDelete };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseRouter.mockReturnValue(MOCK_ROUTER);
  mockUseAppContext.mockReturnValue({ user: MOCK_USER, initialized: true });
});

describe('MyListPage — auth', () => {
  it('renders null while auth is not initialized', () => {
    mockUseMutation.mockReturnValue([jest.fn(), {}]);
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_LIST } });
    mockUseAppContext.mockReturnValue({ user: null, initialized: false });

    const { container } = render(<MyListPage />);
    expect(container).toBeEmptyDOMElement();
  });

  it('redirects to /login when user is null and auth is initialized', async () => {
    mockUseMutation.mockReturnValue([jest.fn(), {}]);
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: [] } });
    mockUseAppContext.mockReturnValue({ user: null, initialized: true });

    render(<MyListPage />);

    await waitFor(() => {
      expect(MOCK_ROUTER.push).toHaveBeenCalledWith('/login');
    });
  });
});

describe('MyListPage — list tabs', () => {
  it('renders a tab for each list', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: TWO_LISTS } });

    render(<MyListPage />);

    expect(screen.getByRole('tab', { name: 'My List' })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Weekend Plans' })).toBeInTheDocument();
  });

  it('marks the first tab as selected by default', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: TWO_LISTS } });

    render(<MyListPage />);

    expect(screen.getByRole('tab', { name: 'My List' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tab', { name: 'Weekend Plans' })).toHaveAttribute('aria-selected', 'false');
  });

  it('shows the "+ New list" button when not creating', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_LIST } });

    render(<MyListPage />);

    expect(screen.getByRole('button', { name: '+ New list' })).toBeInTheDocument();
  });
});

describe('MyListPage — inline new list creation', () => {
  it('shows the inline form when "+ New list" is clicked', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_LIST } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: '+ New list' }));

    expect(screen.getByRole('textbox', { name: 'New list name' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('hides the "+ New list" button while the inline form is open', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_LIST } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: '+ New list' }));

    expect(screen.queryByRole('button', { name: '+ New list' })).not.toBeInTheDocument();
  });

  it('Create button is disabled when the input is empty', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_LIST } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: '+ New list' }));

    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('Create button becomes enabled when a name is typed', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_LIST } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: '+ New list' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'New list name' }), {
      target: { value: 'Summer Eats' },
    });

    expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();
  });

  it('calls createList mutation with the typed name on form submit', async () => {
    const { mockCreate } = setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_LIST } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: '+ New list' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'New list name' }), {
      target: { value: 'Summer Eats' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith({ variables: { name: 'Summer Eats' } });
    });
  });

  it('dismisses the inline form after cancelling', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_LIST } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: '+ New list' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('textbox', { name: 'New list name' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: '+ New list' })).toBeInTheDocument();
  });

  it('dismisses the inline form when Escape is pressed in the input', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_LIST } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: '+ New list' }));
    fireEvent.keyDown(screen.getByRole('textbox', { name: 'New list name' }), { key: 'Escape' });

    expect(screen.queryByRole('textbox', { name: 'New list name' })).not.toBeInTheDocument();
  });
});

describe('MyListPage — inline rename', () => {
  it('shows the rename form when "Rename list" is clicked', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_LIST } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Rename list' }));

    expect(screen.getByRole('textbox', { name: /New name for "My List"/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('pre-fills the rename input with the current list name', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_LIST } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Rename list' }));

    expect(screen.getByRole('textbox', { name: /New name for "My List"/ })).toHaveValue('My List');
  });

  it('calls updateList with the new name when Save is clicked', async () => {
    const { mockUpdate } = setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_LIST } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Rename list' }));
    fireEvent.change(screen.getByRole('textbox', { name: /New name for "My List"/ }), {
      target: { value: 'Hidden Gems' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(mockUpdate).toHaveBeenCalledWith({
        variables: { documentId: 'list-1', name: 'Hidden Gems' },
      });
    });
  });

  it('dismisses the rename form on Cancel', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_LIST } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Rename list' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByRole('textbox', { name: /New name/ })).not.toBeInTheDocument();
  });

  it('dismisses the rename form when Escape is pressed', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_LIST } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Rename list' }));
    fireEvent.keyDown(screen.getByRole('textbox', { name: /New name for "My List"/ }), {
      key: 'Escape',
    });

    expect(screen.queryByRole('textbox', { name: /New name/ })).not.toBeInTheDocument();
  });
});

describe('MyListPage — inline delete confirmation', () => {
  it('does not show Delete list button when there is only one list', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_LIST } });

    render(<MyListPage />);

    expect(screen.queryByRole('button', { name: 'Delete list' })).not.toBeInTheDocument();
  });

  it('shows Delete list button when there are multiple lists', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: TWO_LISTS } });

    render(<MyListPage />);

    expect(screen.getByRole('button', { name: 'Delete list' })).toBeInTheDocument();
  });

  it('shows the confirmation UI when "Delete list" is clicked', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: TWO_LISTS } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete list' }));

    expect(screen.getByRole('button', { name: 'Yes, delete' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument();
  });

  it('includes the list name in the confirmation message', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: TWO_LISTS } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete list' }));

    expect(screen.getByText(/Delete "My List"/)).toBeInTheDocument();
  });

  it('hides the delete button while confirmation is shown', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: TWO_LISTS } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete list' }));

    expect(screen.queryByRole('button', { name: 'Delete list' })).not.toBeInTheDocument();
  });

  it('calls deleteList when "Yes, delete" is confirmed', async () => {
    const { mockDelete } = setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: TWO_LISTS } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete list' }));
    fireEvent.click(screen.getByRole('button', { name: 'Yes, delete' }));

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith({
        variables: { documentId: 'list-1' },
      });
    });
  });

  it('dismisses the confirmation without deleting when Cancel is clicked', () => {
    const { mockDelete } = setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: TWO_LISTS } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete list' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(mockDelete).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Delete list' })).toBeInTheDocument();
  });

  it('uses role="alertdialog" for the confirmation panel', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: TWO_LISTS } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Delete list' }));

    expect(screen.getByRole('alertdialog')).toBeInTheDocument();
  });
});

describe('MyListPage — share section', () => {
  const PUBLIC_LIST = [{ documentId: 'list-pub', name: 'My Public List', isPublic: true }];
  const PRIVATE_LIST = [{ documentId: 'list-prv', name: 'My Private List', isPublic: false }];

  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
  });

  it('shows the public URL input when the list is public', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PUBLIC_LIST } });

    render(<MyListPage />);

    const urlInput = screen.getByRole('textbox', { name: 'Public list URL' });
    expect(urlInput).toBeInTheDocument();
    expect((urlInput as HTMLInputElement).value).toContain('/list/alice/list-pub');
  });

  it('shows a "Copy link" button when the list is public', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PUBLIC_LIST } });

    render(<MyListPage />);

    expect(screen.getByRole('button', { name: 'Copy link to clipboard' })).toBeInTheDocument();
  });

  it('calls clipboard.writeText with the correct URL when "Copy link" is clicked', async () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PUBLIC_LIST } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy link to clipboard' }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        expect.stringContaining('/list/alice/list-pub'),
      );
    });
  });

  it('changes button text to "Copied!" after clicking', async () => {
    jest.useFakeTimers();
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PUBLIC_LIST } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Copy link to clipboard' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Link copied' })).toBeInTheDocument();
    });

    await act(async () => {
      jest.runAllTimers();
    });

    expect(screen.getByRole('button', { name: 'Copy link to clipboard' })).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('shows "Make this list public" message when the list is private', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PRIVATE_LIST } });

    render(<MyListPage />);

    expect(screen.getByText(/Make this list public to share it/)).toBeInTheDocument();
  });

  it('does not show the URL input when the list is private', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PRIVATE_LIST } });

    render(<MyListPage />);

    expect(screen.queryByRole('textbox', { name: 'Public list URL' })).not.toBeInTheDocument();
  });

  it('does not show the "Make public" prompt when the list is public', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PUBLIC_LIST } });

    render(<MyListPage />);

    expect(screen.queryByText(/Make this list public to share it/)).not.toBeInTheDocument();
  });

  it('renders the Share section heading', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PUBLIC_LIST } });

    render(<MyListPage />);

    expect(screen.getByRole('heading', { name: 'Share' })).toBeInTheDocument();
  });
});
