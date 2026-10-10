import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useQuery, useMutation } from '@apollo/client/react';
import AddToListButton from './add-to-list-button';

jest.mock('@apollo/client', () => ({
  gql: (strings: TemplateStringsArray) => strings,
}));

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

jest.mock('../../context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

jest.mock('../../hooks/use-auth-header', () => ({
  useAuthHeader: () => ({ Authorization: 'Bearer test-token' }),
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
const mockUseQuery = useQuery as jest.Mock;
const mockUseMutation = useMutation as jest.Mock;

const DEFAULT_PROPS = {
  osm_id: 'way/12345',
  name: 'British Museum',
  category: 'museum',
  lat: 51.5194,
  lng: -0.127,
};

beforeEach(() => {
  jest.clearAllMocks();
  mockUseMutation.mockReturnValue([jest.fn(), {}]);
  mockUseQuery.mockReturnValue({ data: { myLists: [{ documentId: 'list-1', name: 'My List' }] } });
});

describe('AddToListButton — unauthenticated', () => {
  it('renders nothing while auth is not yet initialized', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: false });
    const { container } = render(<AddToListButton {...DEFAULT_PROPS} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the sign-up CTA for logged-out users', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true });
    render(<AddToListButton {...DEFAULT_PROPS} />);
    expect(screen.getByText(/create a free account/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /create a free account/i })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('renders the CTA as a complementary landmark (aside)', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true });
    render(<AddToListButton {...DEFAULT_PROPS} />);
    expect(screen.getByRole('complementary', { name: /save this place/i })).toBeInTheDocument();
  });

  it('includes "save this place" text in the CTA', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true });
    render(<AddToListButton {...DEFAULT_PROPS} />);
    expect(screen.getByText(/save this place to your london list/i)).toBeInTheDocument();
  });
});

describe('AddToListButton — authenticated', () => {
  const LOGGED_IN_USER = {
    id: '1',
    documentId: 'u1',
    email: 'alice@example.com',
    username: 'alice',
    isPro: false,
  };

  beforeEach(() => {
    mockUseAppContext.mockReturnValue({ user: LOGGED_IN_USER, initialized: true });
  });

  it('renders the "Add to my list" button', () => {
    render(<AddToListButton {...DEFAULT_PROPS} />);
    expect(screen.getByRole('button', { name: /add british museum to my list/i })).toBeInTheDocument();
  });

  it('shows "Adding…" while the mutation is in flight', async () => {
    const createListItemFn = jest.fn().mockReturnValue(new Promise(() => {}));
    mockUseMutation.mockReturnValue([createListItemFn, {}]);
    render(<AddToListButton {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText(/adding/i)).toBeInTheDocument();
    });
  });

  it('shows "Added to your list" and a link to /my-list after a successful add', async () => {
    const createListItemFn = jest.fn().mockResolvedValue({
      data: { createListItem: { documentId: 'item-1', name: 'British Museum' } },
    });
    mockUseMutation.mockReturnValue([createListItemFn, {}]);
    render(<AddToListButton {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByText(/added to your list/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /view my list/i })).toHaveAttribute('href', '/my-list');
  });

  it('shows an error message when createListItem returns null', async () => {
    const createListItemFn = jest.fn().mockResolvedValue({
      data: { createListItem: null },
    });
    mockUseMutation.mockReturnValue([createListItemFn, {}]);
    render(<AddToListButton {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/could not add to list/i);
    });
  });

  it('shows an item limit error when FREE_ITEM_LIMIT_REACHED is returned', async () => {
    const createListItemFn = jest.fn().mockRejectedValue({
      graphQLErrors: [{ extensions: { code: 'FREE_ITEM_LIMIT_REACHED' } }],
    });
    mockUseMutation.mockReturnValue([createListItemFn, {}]);
    render(<AddToListButton {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/reached the free item limit/i);
    });
  });

  it('shows a generic error on an unexpected mutation failure', async () => {
    const createListItemFn = jest.fn().mockRejectedValue(new Error('Network error'));
    mockUseMutation.mockReturnValue([createListItemFn, {}]);
    render(<AddToListButton {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/could not add to list/i);
    });
  });

  it('calls createListItem with the correct variables', async () => {
    const createListItemFn = jest.fn().mockResolvedValue({
      data: { createListItem: { documentId: 'item-1', name: 'British Museum' } },
    });
    mockUseMutation.mockReturnValue([createListItemFn, {}]);
    render(<AddToListButton {...DEFAULT_PROPS} />);
    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => {
      expect(createListItemFn).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            osm_id: 'way/12345',
            name: 'British Museum',
            category: 'museum',
            lat: 51.5194,
            lng: -0.127,
            list: 'list-1',
          }),
        }),
      );
    });
  });
});
