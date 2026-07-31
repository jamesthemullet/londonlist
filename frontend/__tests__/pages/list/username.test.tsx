import { render, screen } from '@testing-library/react';
import PublicProfilePage, {
  buildProfileOgDescription,
} from '../../../pages/list/[username]';

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

import { useAppContext } from '../../../context/AppContext';
const mockUseAppContext = useAppContext as jest.Mock;

const TODO_ITEM = {
  documentId: 'item-1',
  name: 'British Museum',
  category: 'museum',
  completed: false,
  osm_id: '123',
};

const DONE_ITEM = {
  documentId: 'item-2',
  name: 'Tower of London',
  category: 'attraction',
  completed: true,
  osm_id: '456',
};

beforeEach(() => {
  mockUseAppContext.mockReturnValue({ user: null, initialized: true, setUser: jest.fn() });
});

afterEach(() => {
  jest.resetAllMocks();
});

// ─── buildProfileOgDescription unit tests ─────────────────────────────────

describe('buildProfileOgDescription', () => {
  it('includes total item count', () => {
    const listData = { data: [TODO_ITEM, DONE_ITEM], username: 'alice' };
    expect(buildProfileOgDescription(listData)).toContain('2 places');
  });

  it('uses singular "place" for a single item', () => {
    const listData = { data: [TODO_ITEM], username: 'alice' };
    const desc = buildProfileOgDescription(listData);
    expect(desc).toContain('1 place');
    expect(desc).not.toContain('1 places');
  });

  it('includes todo and done counts', () => {
    const listData = { data: [TODO_ITEM, DONE_ITEM], username: 'alice' };
    const desc = buildProfileOgDescription(listData);
    expect(desc).toContain('1 to visit');
    expect(desc).toContain('1 done');
  });

  it('returns a fallback for an empty list', () => {
    const listData = { data: [], username: 'alice' };
    const desc = buildProfileOgDescription(listData);
    expect(desc).toContain("alice's London list");
  });

  it('includes the username', () => {
    const listData = { data: [TODO_ITEM], username: 'charlie' };
    expect(buildProfileOgDescription(listData)).toContain('charlie');
  });
});

// ─── Page states ──────────────────────────────────────────────────────────

describe('PublicProfilePage — not_found state', () => {
  it('renders "User not found" when pageState is not_found', () => {
    render(<PublicProfilePage pageState="not_found" listData={null} username="alice" />);
    expect(screen.getByText('User not found.')).toBeInTheDocument();
  });
});

describe('PublicProfilePage — private state', () => {
  it('renders "This list is private" when pageState is private', () => {
    render(<PublicProfilePage pageState="private" listData={null} username="alice" />);
    expect(screen.getByText('This list is private.')).toBeInTheDocument();
  });

  it('includes the username in the heading', () => {
    render(<PublicProfilePage pageState="private" listData={null} username="alice" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("alice's List");
  });
});

describe('PublicProfilePage — found state', () => {
  const listData = { data: [TODO_ITEM, DONE_ITEM], username: 'alice' };

  it('renders the username as the page heading', () => {
    render(<PublicProfilePage pageState="found" listData={listData} username="alice" />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent("alice's List");
  });

  it('renders a "To do" section for incomplete items', () => {
    render(<PublicProfilePage pageState="found" listData={listData} username="alice" />);
    expect(screen.getByText('To do (1)')).toBeInTheDocument();
    expect(screen.getByText('British Museum')).toBeInTheDocument();
  });

  it('renders a "Done" section for completed items', () => {
    render(<PublicProfilePage pageState="found" listData={listData} username="alice" />);
    expect(screen.getByText('Done (1)')).toBeInTheDocument();
    expect(screen.getByText('Tower of London')).toBeInTheDocument();
  });

  it('renders item categories', () => {
    render(<PublicProfilePage pageState="found" listData={listData} username="alice" />);
    expect(screen.getByText('museum')).toBeInTheDocument();
    expect(screen.getByText('attraction')).toBeInTheDocument();
  });

  it('renders an empty state message when the list has no items', () => {
    render(
      <PublicProfilePage
        pageState="found"
        listData={{ data: [], username: 'alice' }}
        username="alice"
      />,
    );
    expect(screen.getByText('This list is empty.')).toBeInTheDocument();
  });
});

// ─── Conversion banner ────────────────────────────────────────────────────

describe('PublicProfilePage — conversion banner', () => {
  const listData = { data: [TODO_ITEM], username: 'alice' };

  it('shows the conversion banner when the visitor is not logged in', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true, setUser: jest.fn() });
    render(<PublicProfilePage pageState="found" listData={listData} username="alice" />);
    expect(screen.getByText("Inspired by alice's list?")).toBeInTheDocument();
  });

  it('links the conversion CTA to /register with the correct ref', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true, setUser: jest.fn() });
    render(<PublicProfilePage pageState="found" listData={listData} username="alice" />);
    const cta = screen.getByRole('link', { name: 'Create your list' });
    expect(cta).toHaveAttribute('href', '/register?ref=shared-profile');
  });

  it('does not show the conversion banner when the visitor is logged in', () => {
    mockUseAppContext.mockReturnValue({
      user: { id: '1', documentId: 'u1', email: 'bob@example.com', username: 'bob' },
      initialized: true,
      setUser: jest.fn(),
    });
    render(<PublicProfilePage pageState="found" listData={listData} username="alice" />);
    expect(screen.queryByText("Inspired by alice's list?")).not.toBeInTheDocument();
  });

  it('does not show the conversion banner before context is initialized', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: false, setUser: jest.fn() });
    render(<PublicProfilePage pageState="found" listData={listData} username="alice" />);
    expect(screen.queryByText("Inspired by alice's list?")).not.toBeInTheDocument();
  });
});

// ─── OG / Twitter meta tags ──────────────────────────────────────────────

describe('PublicProfilePage — OG / Twitter meta tags', () => {
  const listData = { data: [TODO_ITEM, DONE_ITEM], username: 'alice' };

  // React 19 hoists <meta> to document.head, so we query there rather than the container div.
  function getMeta(attr: string, value: string) {
    return document.querySelector(`meta[${attr}="${value}"]`);
  }

  it('renders og:type "website"', () => {
    render(<PublicProfilePage pageState="found" listData={listData} username="alice" />);
    expect(getMeta('property', 'og:type')).toHaveAttribute('content', 'website');
  });

  it('renders og:site_name "London List"', () => {
    render(<PublicProfilePage pageState="found" listData={listData} username="alice" />);
    expect(getMeta('property', 'og:site_name')).toHaveAttribute('content', 'London List');
  });

  it('renders og:title including the username', () => {
    render(<PublicProfilePage pageState="found" listData={listData} username="alice" />);
    expect(getMeta('property', 'og:title')?.getAttribute('content')).toContain('alice');
  });

  it('renders og:description with item count', () => {
    render(<PublicProfilePage pageState="found" listData={listData} username="alice" />);
    expect(getMeta('property', 'og:description')?.getAttribute('content')).toContain('2 places');
  });

  it('renders og:url with the canonical profile URL', () => {
    render(<PublicProfilePage pageState="found" listData={listData} username="alice" />);
    expect(getMeta('property', 'og:url')?.getAttribute('content')).toContain('/list/alice');
  });

  it('renders twitter:card "summary"', () => {
    render(<PublicProfilePage pageState="found" listData={listData} username="alice" />);
    expect(getMeta('name', 'twitter:card')).toHaveAttribute('content', 'summary');
  });

  it('renders twitter:title including the username', () => {
    render(<PublicProfilePage pageState="found" listData={listData} username="alice" />);
    expect(getMeta('name', 'twitter:title')?.getAttribute('content')).toContain('alice');
  });

  it('renders twitter:description with item count', () => {
    render(<PublicProfilePage pageState="found" listData={listData} username="alice" />);
    expect(getMeta('name', 'twitter:description')?.getAttribute('content')).toContain('2 places');
  });
});
