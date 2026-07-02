import { render, screen } from '@testing-library/react';
import PublicListPage from '../../../../pages/list/[username]/[listId]';

jest.mock('../../../../context/AppContext', () => ({
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

import { useAppContext } from '../../../../context/AppContext';
const mockUseAppContext = useAppContext as jest.Mock;

const TODO_ITEM = {
  documentId: 'item-1',
  name: 'British Museum',
  category: 'museum',
  completed: false,
  osm_id: '123',
  visitedAt: null,
};

const DONE_ITEM = {
  documentId: 'item-2',
  name: 'Tower of London',
  category: 'attraction',
  completed: true,
  osm_id: '456',
  visitedAt: '2026-06-15T10:00:00.000Z',
};

beforeEach(() => {
  mockUseAppContext.mockReturnValue({ user: null, initialized: true, setUser: jest.fn() });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('PublicListPage — not_found state', () => {
  it('renders "List not found" when pageState is not_found', () => {
    render(
      <PublicListPage pageState="not_found" listData={null} username="alice" />,
    );

    expect(screen.getByText('List not found.')).toBeInTheDocument();
  });
});

describe('PublicListPage — private state', () => {
  it('renders "This list is private" when pageState is private', () => {
    render(
      <PublicListPage pageState="private" listData={null} username="alice" />,
    );

    expect(screen.getByText('This list is private.')).toBeInTheDocument();
  });

  it('includes the username in the heading when private', () => {
    render(
      <PublicListPage pageState="private" listData={null} username="alice" />,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("alice's List");
  });
});

describe('PublicListPage — found state with items', () => {
  const listData = {
    data: [TODO_ITEM, DONE_ITEM],
    username: 'alice',
    listName: 'Weekend Wanders',
  };

  it('renders the list name as the page heading', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" />,
    );

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Weekend Wanders');
  });

  it('renders a "To do" section for incomplete items', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" />,
    );

    expect(screen.getByText('To do (1)')).toBeInTheDocument();
    expect(screen.getByText('British Museum')).toBeInTheDocument();
  });

  it('renders a "Done" section for completed items', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" />,
    );

    expect(screen.getByText('Done (1)')).toBeInTheDocument();
    expect(screen.getByText('Tower of London')).toBeInTheDocument();
  });

  it('renders the item category', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" />,
    );

    expect(screen.getByText('museum')).toBeInTheDocument();
    expect(screen.getByText('attraction')).toBeInTheDocument();
  });

  it('renders a visited date for completed items with visitedAt', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" />,
    );

    expect(screen.getByText(/Visited/)).toBeInTheDocument();
  });

  it('renders the subtitle with the username', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" />,
    );

    expect(screen.getByText("alice's list")).toBeInTheDocument();
  });
});

describe('PublicListPage — found state with empty list', () => {
  const emptyListData = {
    data: [],
    username: 'alice',
    listName: 'Empty List',
  };

  it('renders an empty state message when the list has no items', () => {
    render(
      <PublicListPage pageState="found" listData={emptyListData} username="alice" />,
    );

    expect(screen.getByText('This list is empty.')).toBeInTheDocument();
  });

  it('does not render "To do" or "Done" sections when the list is empty', () => {
    render(
      <PublicListPage pageState="found" listData={emptyListData} username="alice" />,
    );

    expect(screen.queryByText(/^To do/)).not.toBeInTheDocument();
    expect(screen.queryByText(/^Done/)).not.toBeInTheDocument();
  });
});

describe('PublicListPage — conversion banner', () => {
  const listData = {
    data: [TODO_ITEM],
    username: 'alice',
    listName: 'Weekend Wanders',
  };

  it('shows the conversion banner when the visitor is not logged in', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true, setUser: jest.fn() });

    render(
      <PublicListPage pageState="found" listData={listData} username="alice" />,
    );

    expect(screen.getByText("Inspired by alice's list?")).toBeInTheDocument();
  });

  it('links the conversion CTA to /register with the correct ref', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true, setUser: jest.fn() });

    render(
      <PublicListPage pageState="found" listData={listData} username="alice" />,
    );

    const cta = screen.getByRole('link', { name: 'Create your list' });
    expect(cta).toHaveAttribute('href', '/register?ref=shared-list');
  });

  it('does not show the conversion banner when the visitor is logged in', () => {
    mockUseAppContext.mockReturnValue({
      user: { id: '1', documentId: 'u1', email: 'bob@example.com', username: 'bob' },
      initialized: true,
      setUser: jest.fn(),
    });

    render(
      <PublicListPage pageState="found" listData={listData} username="alice" />,
    );

    expect(screen.queryByText("Inspired by alice's list?")).not.toBeInTheDocument();
  });

  it('does not show the conversion banner when context is not yet initialized', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: false, setUser: jest.fn() });

    render(
      <PublicListPage pageState="found" listData={listData} username="alice" />,
    );

    expect(screen.queryByText("Inspired by alice's list?")).not.toBeInTheDocument();
  });
});

describe('PublicListPage — only todo items', () => {
  const listData = {
    data: [TODO_ITEM],
    username: 'alice',
    listName: 'Things to do',
  };

  it('does not render a "Done" section when all items are incomplete', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" />,
    );

    expect(screen.queryByText(/^Done/)).not.toBeInTheDocument();
  });
});

describe('PublicListPage — only done items', () => {
  const listData = {
    data: [DONE_ITEM],
    username: 'alice',
    listName: 'Completed visits',
  };

  it('does not render a "To do" section when all items are complete', () => {
    render(
      <PublicListPage pageState="found" listData={listData} username="alice" />,
    );

    expect(screen.queryByText(/^To do/)).not.toBeInTheDocument();
  });
});
