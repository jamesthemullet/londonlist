import { render, screen } from '@testing-library/react';
import EmbedPage, { buildEmbedCode } from '../../../pages/embed/[username]/[listId]';

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
    target,
    rel,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    target?: string;
    rel?: string;
  }) => (
    <a href={href} className={className} target={target} rel={rel}>
      {children}
    </a>
  ),
}));

const BASE_LIST_DATA = {
  data: [
    { documentId: 'item-1', name: 'British Museum', category: 'museum', completed: false, visitedAt: null },
    { documentId: 'item-2', name: 'Borough Market', category: 'market', completed: false, visitedAt: null },
    { documentId: 'item-3', name: 'Tate Modern', category: 'museum', completed: true, visitedAt: '2026-06-01T10:00:00.000Z' },
  ],
  listName: 'My London List',
  username: 'alice',
  description: null,
};

describe('EmbedPage — not_found state', () => {
  it('renders "List not found" for not_found pageState', () => {
    render(
      <EmbedPage pageState="not_found" listData={null} username="alice" listId="list-1" />,
    );
    expect(screen.getByText('List not found.')).toBeInTheDocument();
  });
});

describe('EmbedPage — private state', () => {
  it('renders "This list is private" for private pageState', () => {
    render(
      <EmbedPage pageState="private" listData={null} username="alice" listId="list-1" />,
    );
    expect(screen.getByText('This list is private.')).toBeInTheDocument();
  });
});

describe('EmbedPage — found state', () => {
  it('renders the list title', () => {
    render(
      <EmbedPage pageState="found" listData={BASE_LIST_DATA} username="alice" listId="list-1" />,
    );
    expect(screen.getByRole('heading', { name: 'My London List', level: 1 })).toBeInTheDocument();
  });

  it('renders the username in the meta line', () => {
    render(
      <EmbedPage pageState="found" listData={BASE_LIST_DATA} username="alice" listId="list-1" />,
    );
    expect(screen.getByText('by alice')).toBeInTheDocument();
  });

  it('renders incomplete items in the To do section', () => {
    render(
      <EmbedPage pageState="found" listData={BASE_LIST_DATA} username="alice" listId="list-1" />,
    );
    expect(screen.getByText('British Museum')).toBeInTheDocument();
    expect(screen.getByText('Borough Market')).toBeInTheDocument();
  });

  it('renders completed items in the Done section', () => {
    render(
      <EmbedPage pageState="found" listData={BASE_LIST_DATA} username="alice" listId="list-1" />,
    );
    expect(screen.getByText('Tate Modern')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Done \(1\)/, level: 2 })).toBeInTheDocument();
  });

  it('renders To do count in section heading', () => {
    render(
      <EmbedPage pageState="found" listData={BASE_LIST_DATA} username="alice" listId="list-1" />,
    );
    expect(screen.getByRole('heading', { name: /To do \(2\)/, level: 2 })).toBeInTheDocument();
  });

  it('shows "empty" message when item list is empty', () => {
    const emptyList = { ...BASE_LIST_DATA, data: [] };
    render(
      <EmbedPage pageState="found" listData={emptyList} username="alice" listId="list-1" />,
    );
    expect(screen.getByText('This list is empty.')).toBeInTheDocument();
  });

  it('renders description when provided', () => {
    const listWithDesc = { ...BASE_LIST_DATA, description: 'A great weekend guide.' };
    render(
      <EmbedPage pageState="found" listData={listWithDesc} username="alice" listId="list-1" />,
    );
    expect(screen.getByText('A great weekend guide.')).toBeInTheDocument();
  });

  it('does not render description when null', () => {
    render(
      <EmbedPage pageState="found" listData={BASE_LIST_DATA} username="alice" listId="list-1" />,
    );
    expect(screen.queryByTestId('description')).not.toBeInTheDocument();
  });

  it('renders the footer link pointing to the full list page', () => {
    render(
      <EmbedPage pageState="found" listData={BASE_LIST_DATA} username="alice" listId="list-1" />,
    );
    const link = screen.getByRole('link', { name: /View full list on London List/ });
    expect(link).toHaveAttribute('href', expect.stringContaining('/list/alice/list-1'));
  });

  it('renders the title as a link to the full list page', () => {
    render(
      <EmbedPage pageState="found" listData={BASE_LIST_DATA} username="alice" listId="list-1" />,
    );
    const titleLink = screen.getByRole('heading', { level: 1 }).querySelector('a');
    expect(titleLink).toHaveAttribute('href', expect.stringContaining('/list/alice/list-1'));
  });

  it('shows category badges for items that have a category', () => {
    render(
      <EmbedPage pageState="found" listData={BASE_LIST_DATA} username="alice" listId="list-1" />,
    );
    const museumBadges = screen.getAllByText('museum');
    expect(museumBadges.length).toBeGreaterThan(0);
  });

  it('renders noindex meta tag', () => {
    render(
      <EmbedPage pageState="found" listData={BASE_LIST_DATA} username="alice" listId="list-1" />,
    );
    const meta = document.querySelector('meta[name="robots"]');
    expect(meta).toHaveAttribute('content', 'noindex');
  });
});

describe('EmbedPage — no To do items', () => {
  it('omits To do section when all items are done', () => {
    const allDone = {
      ...BASE_LIST_DATA,
      data: [
        { documentId: 'item-1', name: 'British Museum', category: 'museum', completed: true, visitedAt: '2026-06-01T10:00:00.000Z' },
      ],
    };
    render(
      <EmbedPage pageState="found" listData={allDone} username="alice" listId="list-1" />,
    );
    expect(screen.queryByRole('heading', { name: /To do/ })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Done \(1\)/ })).toBeInTheDocument();
  });
});

describe('EmbedPage — no Done items', () => {
  it('omits Done section when no items are completed', () => {
    const noneDone = {
      ...BASE_LIST_DATA,
      data: [
        { documentId: 'item-1', name: 'British Museum', category: 'museum', completed: false, visitedAt: null },
      ],
    };
    render(
      <EmbedPage pageState="found" listData={noneDone} username="alice" listId="list-1" />,
    );
    expect(screen.queryByRole('heading', { name: /Done/ })).not.toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /To do \(1\)/ })).toBeInTheDocument();
  });
});

describe('buildEmbedCode', () => {
  it('returns a valid iframe string', () => {
    const code = buildEmbedCode('alice', 'list-123', 'https://londonlist.co.uk');
    expect(code).toContain('<iframe');
    expect(code).toContain('</iframe>');
  });

  it('includes the embed route URL', () => {
    const code = buildEmbedCode('alice', 'list-123', 'https://londonlist.co.uk');
    expect(code).toContain('https://londonlist.co.uk/embed/alice/list-123');
  });

  it('includes the username in the title attribute', () => {
    const code = buildEmbedCode('alice', 'list-123', 'https://londonlist.co.uk');
    expect(code).toContain("title=\"London List — alice's list\"");
  });

  it('uses different users and listIds correctly', () => {
    const code = buildEmbedCode('bob', 'xyz-999', 'https://londonlist.co.uk');
    expect(code).toContain('/embed/bob/xyz-999');
    expect(code).toContain("bob's list");
  });

  it('includes width and height attributes', () => {
    const code = buildEmbedCode('alice', 'list-123', 'https://londonlist.co.uk');
    expect(code).toContain('width="100%"');
    expect(code).toContain('height="520"');
  });

  it('includes frameborder="0"', () => {
    const code = buildEmbedCode('alice', 'list-123', 'https://londonlist.co.uk');
    expect(code).toContain('frameborder="0"');
  });
});
