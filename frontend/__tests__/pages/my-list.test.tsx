import { render, screen, fireEvent, waitFor, act, within } from '@testing-library/react';
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

jest.mock('../../components/upgrade-modal/upgrade-modal', () => ({
  __esModule: true,
  default: ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) =>
    isOpen ? (
      <div data-testid="upgrade-modal">
        <button type="button" onClick={onClose}>
          Close modal
        </button>
      </div>
    ) : null,
}));

const mockUseQuery = useQuery as unknown as jest.Mock;
const mockUseMutation = useMutation as unknown as jest.Mock;
const mockUseAppContext = useAppContext as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

const MOCK_ROUTER = { push: jest.fn() };

const MOCK_USER = { id: '1', documentId: 'u1', email: 'a@b.com', username: 'alice', isPro: false };
const MOCK_PRO_USER = { ...MOCK_USER, isPro: true };
const PRO_USER = MOCK_PRO_USER;

const THREE_LISTS = [
  { documentId: 'list-1', name: 'My List', isPublic: false },
  { documentId: 'list-2', name: 'Weekend Plans', isPublic: true },
  { documentId: 'list-3', name: 'Museum Trail', isPublic: false },
];

const TWO_LISTS = [
  { documentId: 'list-1', name: 'My List', isPublic: false, viewCount: 0 },
  { documentId: 'list-2', name: 'Weekend Plans', isPublic: true, viewCount: 12 },
];

const ONE_LIST = [{ documentId: 'list-1', name: 'My List', isPublic: false, viewCount: 0 }];

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

describe('MyListPage — free tier list limit', () => {
  it('hides "+ New list" and shows upgrade button when free user has 3 lists', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: THREE_LISTS } });
    mockUseAppContext.mockReturnValue({ user: MOCK_USER, initialized: true });

    render(<MyListPage />);

    expect(screen.queryByRole('button', { name: '+ New list' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Upgrade to Pro to create more lists' }),
    ).toBeInTheDocument();
  });

  it('upgrade button opens the upgrade modal', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: THREE_LISTS } });
    mockUseAppContext.mockReturnValue({ user: MOCK_USER, initialized: true });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: 'Upgrade to Pro to create more lists' }));

    expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument();
    expect(MOCK_ROUTER.push).not.toHaveBeenCalled();
  });

  it('shows "+ New list" for a Pro user with 3 lists', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: THREE_LISTS } });
    mockUseAppContext.mockReturnValue({ user: PRO_USER, initialized: true });

    render(<MyListPage />);

    expect(screen.getByRole('button', { name: '+ New list' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Upgrade to Pro to create more lists' }),
    ).not.toBeInTheDocument();
  });

  it('shows "+ New list" for a free user with fewer than 3 lists', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: TWO_LISTS } });
    mockUseAppContext.mockReturnValue({ user: MOCK_USER, initialized: true });

    render(<MyListPage />);

    expect(screen.getByRole('button', { name: '+ New list' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Upgrade to Pro to create more lists' }),
    ).not.toBeInTheDocument();
  });

  it('does not show the upgrade banner for a Pro user at 3 lists', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: THREE_LISTS } });
    mockUseAppContext.mockReturnValue({ user: PRO_USER, initialized: true });

    render(<MyListPage />);

    expect(screen.queryByText(/Unlock unlimited lists/)).not.toBeInTheDocument();
  });

  it('shows the upgrade banner for a free user at 3 lists', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: THREE_LISTS } });
    mockUseAppContext.mockReturnValue({ user: MOCK_USER, initialized: true });

    render(<MyListPage />);

    expect(screen.getByText(/Unlock unlimited lists/)).toBeInTheDocument();
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
  const PUBLIC_LIST = [{ documentId: 'list-pub', name: 'My Public List', isPublic: true, viewCount: 42 }];
  const PRIVATE_LIST = [{ documentId: 'list-prv', name: 'My Private List', isPublic: false, viewCount: 0 }];

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

describe('MyListPage — upgrade banner (list count indicator)', () => {
  it('shows the list count banner for free users', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_LIST } });

    render(<MyListPage />);

    expect(screen.getByLabelText('List usage')).toBeInTheDocument();
    expect(screen.getByText(/1\/3 lists used/)).toBeInTheDocument();
  });

  it('shows remaining count for free user below limit', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: TWO_LISTS } });

    render(<MyListPage />);

    expect(screen.getByText(/2\/3 lists used/)).toBeInTheDocument();
    expect(screen.getByText(/1 remaining on the free plan/)).toBeInTheDocument();
  });

  it('shows "Upgrade now" call to action when free user is at the 3-list limit', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: THREE_LISTS } });

    render(<MyListPage />);

    expect(screen.getByText(/3\/3 lists used/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Upgrade now' })).toHaveAttribute('href', '/pricing');
  });

  it('does not show the list usage banner for Pro users', () => {
    setupMutations();
    mockUseAppContext.mockReturnValue({ user: MOCK_PRO_USER, initialized: true });
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: THREE_LISTS } });

    render(<MyListPage />);

    expect(screen.queryByLabelText('List usage')).not.toBeInTheDocument();
  });
});

describe('MyListPage — upgrade gate when free user is at list limit', () => {
  it('shows the upgrade button instead of "+ New list" when free user has 3 lists', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: THREE_LISTS } });

    render(<MyListPage />);

    expect(screen.queryByRole('button', { name: '+ New list' })).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Upgrade to Pro to create more lists' }),
    ).toBeInTheDocument();
  });

  it('shows "+ New list" normally when free user is below the limit', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_LIST } });

    render(<MyListPage />);

    expect(screen.getByRole('button', { name: '+ New list' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Upgrade to Pro to create more lists' }),
    ).not.toBeInTheDocument();
  });

  it('opens the upgrade modal when the upgrade button is clicked', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: THREE_LISTS } });

    render(<MyListPage />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Upgrade to Pro to create more lists' }),
    );

    expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument();
    expect(MOCK_ROUTER.push).not.toHaveBeenCalled();
  });

  it('shows "+ New list" for Pro users even at 3 lists', () => {
    setupMutations();
    mockUseAppContext.mockReturnValue({ user: MOCK_PRO_USER, initialized: true });
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: THREE_LISTS } });

    render(<MyListPage />);

    expect(screen.getByRole('button', { name: '+ New list' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Upgrade to Pro to create more lists' }),
    ).not.toBeInTheDocument();
  });
});

describe('MyListPage — create list error handling', () => {
  it('opens the upgrade modal when backend returns FREE_LIST_LIMIT_REACHED', async () => {
    const limitError = {
      graphQLErrors: [{ extensions: { code: 'FREE_LIST_LIMIT_REACHED' } }],
    };
    const mockCreate = jest.fn().mockRejectedValue(limitError);
    mockUseMutation.mockImplementation((query: unknown) => {
      const str = Array.isArray(query) ? String(query[0]) : '';
      if (str.includes('CreateMyList')) return [mockCreate, {}];
      return [jest.fn().mockResolvedValue({ data: {} }), {}];
    });
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: TWO_LISTS } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: '+ New list' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'New list name' }), {
      target: { value: 'Fourth List' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument();
    });
    expect(MOCK_ROUTER.push).not.toHaveBeenCalled();
  });

  it('shows an error message when list creation fails for other reasons', async () => {
    const genericError = { graphQLErrors: [{ extensions: { code: 'INTERNAL_SERVER_ERROR' } }] };
    const mockCreate = jest.fn().mockRejectedValue(genericError);
    mockUseMutation.mockImplementation((query: unknown) => {
      const str = Array.isArray(query) ? String(query[0]) : '';
      if (str.includes('CreateMyList')) return [mockCreate, {}];
      return [jest.fn().mockResolvedValue({ data: {} }), {}];
    });
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_LIST } });

    render(<MyListPage />);

    fireEvent.click(screen.getByRole('button', { name: '+ New list' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'New list name' }), {
      target: { value: 'New List' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Create' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Could not create list/);
    });
  });
});

describe('MyListPage — view counts', () => {
  const PUBLIC_LIST = [{ documentId: 'list-pub', name: 'My Public List', isPublic: true, viewCount: 42 }];
  const PUBLIC_LIST_ONE_VIEW = [{ documentId: 'list-pub', name: 'My Public List', isPublic: true, viewCount: 1 }];
  const PRIVATE_LIST = [{ documentId: 'list-prv', name: 'My Private List', isPublic: false, viewCount: 0 }];

  it('shows the view count for Pro users with a public list', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PUBLIC_LIST } });
    mockUseAppContext.mockReturnValue({ user: MOCK_PRO_USER, initialized: true });

    render(<MyListPage />);

    const shareSection = screen.getByRole('region', { name: 'Share' });
    expect(within(shareSection).getByText('42')).toBeInTheDocument();
    expect(within(shareSection).getByText(/views/)).toBeInTheDocument();
  });

  it('uses singular "view" when the count is 1', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PUBLIC_LIST_ONE_VIEW } });
    mockUseAppContext.mockReturnValue({ user: MOCK_PRO_USER, initialized: true });

    render(<MyListPage />);

    const shareSection = screen.getByRole('region', { name: 'Share' });
    expect(within(shareSection).getByText('1')).toBeInTheDocument();
    expect(within(shareSection).getByText(/\bview\b/)).toBeInTheDocument();
    expect(within(shareSection).queryByText(/\bviews\b/)).not.toBeInTheDocument();
  });

  it('shows an upgrade prompt instead of view count for free users with a public list', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PUBLIC_LIST } });
    mockUseAppContext.mockReturnValue({ user: MOCK_USER, initialized: true });

    render(<MyListPage />);

    expect(screen.getByRole('link', { name: 'Upgrade to Pro' })).toBeInTheDocument();
    expect(screen.getByText(/to see how many times your list has been viewed/)).toBeInTheDocument();
  });

  it('upgrade prompt links to /pricing', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PUBLIC_LIST } });
    mockUseAppContext.mockReturnValue({ user: MOCK_USER, initialized: true });

    render(<MyListPage />);

    expect(screen.getByRole('link', { name: 'Upgrade to Pro' })).toHaveAttribute('href', '/pricing');
  });

  it('does not show view count or upgrade prompt for private lists', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PRIVATE_LIST } });
    mockUseAppContext.mockReturnValue({ user: MOCK_PRO_USER, initialized: true });

    render(<MyListPage />);

    expect(screen.queryByText(/views?/)).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Upgrade to Pro' })).not.toBeInTheDocument();
  });

  it('does not show the raw view count number for free users', () => {
    setupMutations();
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PUBLIC_LIST } });
    mockUseAppContext.mockReturnValue({ user: MOCK_USER, initialized: true });

    render(<MyListPage />);

    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });
});

describe('MyListPage — Pro analytics stats card', () => {
  const PUBLIC_LISTS_TWO = [
    { documentId: 'list-1', name: 'Hidden Pubs', isPublic: true, viewCount: 52, itemCount: 8, completedCount: 4 },
    { documentId: 'list-2', name: 'Museum Trail', isPublic: true, viewCount: 35, itemCount: 5, completedCount: 5 },
  ];
  const ONE_PUBLIC = [
    { documentId: 'list-1', name: 'Hidden Pubs', isPublic: true, viewCount: 42, itemCount: 10, completedCount: 3 },
  ];
  const ALL_PRIVATE = [
    { documentId: 'list-1', name: 'My List', isPublic: false, viewCount: 0, itemCount: 0, completedCount: 0 },
  ];
  const ALL_PRIVATE_WITH_ITEMS = [
    { documentId: 'list-1', name: 'My List', isPublic: false, viewCount: 0, itemCount: 12, completedCount: 6 },
  ];

  it('shows "Your stats" heading for Pro users with public lists', () => {
    setupMutations();
    mockUseAppContext.mockReturnValue({ user: MOCK_PRO_USER, initialized: true });
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_PUBLIC } });

    render(<MyListPage />);

    const statsCard = screen.getByRole('complementary', { name: 'List analytics' });
    expect(within(statsCard).getByRole('heading', { name: 'Your stats' })).toBeInTheDocument();
  });

  it('shows total views for Pro users', () => {
    setupMutations();
    mockUseAppContext.mockReturnValue({ user: MOCK_PRO_USER, initialized: true });
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PUBLIC_LISTS_TWO } });

    render(<MyListPage />);

    const statsCard = screen.getByRole('complementary', { name: 'List analytics' });
    expect(within(statsCard).getByText('87')).toBeInTheDocument();
  });

  it('shows the most viewed list when there are multiple public lists', () => {
    setupMutations();
    mockUseAppContext.mockReturnValue({ user: MOCK_PRO_USER, initialized: true });
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PUBLIC_LISTS_TWO } });

    render(<MyListPage />);

    const statsCard = screen.getByRole('complementary', { name: 'List analytics' });
    expect(within(statsCard).getByText(/Hidden Pubs/)).toBeInTheDocument();
  });

  it('does not show most viewed for a single public list', () => {
    setupMutations();
    mockUseAppContext.mockReturnValue({ user: MOCK_PRO_USER, initialized: true });
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_PUBLIC } });

    render(<MyListPage />);

    const statsCard = screen.getByRole('complementary', { name: 'List analytics' });
    expect(within(statsCard).queryByText('Most viewed')).not.toBeInTheDocument();
  });

  it('does not render the stats card when all lists are private (Pro user)', () => {
    setupMutations();
    mockUseAppContext.mockReturnValue({ user: MOCK_PRO_USER, initialized: true });
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ALL_PRIVATE } });

    render(<MyListPage />);

    expect(screen.queryByRole('complementary', { name: 'List analytics' })).not.toBeInTheDocument();
  });

  it('shows upgrade teaser for free users with a public list', () => {
    setupMutations();
    mockUseAppContext.mockReturnValue({ user: MOCK_USER, initialized: true });
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_PUBLIC } });

    render(<MyListPage />);

    const statsCard = screen.getByRole('complementary', { name: 'List analytics' });
    expect(
      within(statsCard).getByRole('link', { name: 'Upgrade to Pro to unlock list analytics' }),
    ).toBeInTheDocument();
  });

  it('upgrade teaser links to /pricing', () => {
    setupMutations();
    mockUseAppContext.mockReturnValue({ user: MOCK_USER, initialized: true });
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_PUBLIC } });

    render(<MyListPage />);

    const statsCard = screen.getByRole('complementary', { name: 'List analytics' });
    expect(
      within(statsCard).getByRole('link', { name: 'Upgrade to Pro to unlock list analytics' }),
    ).toHaveAttribute('href', '/pricing');
  });

  it('does not render the stats card for free users with no public lists', () => {
    setupMutations();
    mockUseAppContext.mockReturnValue({ user: MOCK_USER, initialized: true });
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ALL_PRIVATE } });

    render(<MyListPage />);

    expect(screen.queryByRole('complementary', { name: 'List analytics' })).not.toBeInTheDocument();
  });

  it('does not show raw view count numbers in the teaser for free users', () => {
    setupMutations();
    mockUseAppContext.mockReturnValue({ user: MOCK_USER, initialized: true });
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ONE_PUBLIC } });

    render(<MyListPage />);

    const statsCard = screen.getByRole('complementary', { name: 'List analytics' });
    expect(within(statsCard).queryByText('42')).not.toBeInTheDocument();
  });

  it('shows "Places saved" stat for Pro users with items', () => {
    setupMutations();
    mockUseAppContext.mockReturnValue({ user: MOCK_PRO_USER, initialized: true });
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PUBLIC_LISTS_TWO } });

    render(<MyListPage />);

    const statsCard = screen.getByRole('complementary', { name: 'List analytics' });
    expect(within(statsCard).getByText('Places saved')).toBeInTheDocument();
    expect(within(statsCard).getByText('13')).toBeInTheDocument();
  });

  it('shows "Completed" stat with count and percentage for Pro users', () => {
    setupMutations();
    mockUseAppContext.mockReturnValue({ user: MOCK_PRO_USER, initialized: true });
    // 4 + 5 = 9 completed out of 13 total = 69%
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PUBLIC_LISTS_TWO } });

    render(<MyListPage />);

    const statsCard = screen.getByRole('complementary', { name: 'List analytics' });
    expect(within(statsCard).getByText('Completed')).toBeInTheDocument();
    expect(within(statsCard).getByText('9')).toBeInTheDocument();
    expect(within(statsCard).getByText('(69%)')).toBeInTheDocument();
  });

  it('shows stats card for Pro users with only private lists that have items', () => {
    setupMutations();
    mockUseAppContext.mockReturnValue({ user: MOCK_PRO_USER, initialized: true });
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ALL_PRIVATE_WITH_ITEMS } });

    render(<MyListPage />);

    const statsCard = screen.getByRole('complementary', { name: 'List analytics' });
    expect(within(statsCard).getByRole('heading', { name: 'Your stats' })).toBeInTheDocument();
    expect(within(statsCard).getByText('12')).toBeInTheDocument();
    expect(within(statsCard).queryByText('Total views')).not.toBeInTheDocument();
  });

  it('shows 50% completion rate when half the items are done', () => {
    setupMutations();
    mockUseAppContext.mockReturnValue({ user: MOCK_PRO_USER, initialized: true });
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: ALL_PRIVATE_WITH_ITEMS } });

    render(<MyListPage />);

    const statsCard = screen.getByRole('complementary', { name: 'List analytics' });
    expect(within(statsCard).getByText('(50%)')).toBeInTheDocument();
  });

  it('does not show "Places saved" or "Completed" when all lists are empty', () => {
    setupMutations();
    mockUseAppContext.mockReturnValue({ user: MOCK_PRO_USER, initialized: true });
    // ONE_PUBLIC has itemCount: 10
    const PUBLIC_EMPTY = [
      { documentId: 'list-1', name: 'Empty List', isPublic: true, viewCount: 5, itemCount: 0, completedCount: 0 },
    ];
    mockUseQuery.mockReturnValue({ loading: false, data: { myLists: PUBLIC_EMPTY } });

    render(<MyListPage />);

    const statsCard = screen.getByRole('complementary', { name: 'List analytics' });
    expect(within(statsCard).queryByText('Places saved')).not.toBeInTheDocument();
    expect(within(statsCard).queryByText('Completed')).not.toBeInTheDocument();
    expect(within(statsCard).getByText('Total views')).toBeInTheDocument();
  });
});
