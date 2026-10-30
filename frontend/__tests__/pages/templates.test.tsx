import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMutation } from '@apollo/client/react';
import TemplatesPage, { TemplateCard } from '../../pages/templates';
import { TEMPLATES } from '../../lib/templates';
import type { Template } from '../../lib/templates';

jest.mock('@apollo/client/react', () => ({
  useMutation: jest.fn(),
}));

jest.mock('@apollo/client', () => ({
  gql: jest.fn((strings: TemplateStringsArray) => strings[0]),
}));

jest.mock('../../hooks/use-auth-header', () => ({
  useAuthHeader: () => ({}),
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
const mockUseMutation = useMutation as jest.Mock;

function setupMocks({
  user = null,
  createMyListFn = jest.fn().mockResolvedValue({ data: { createMyList: { documentId: 'new-list-1' } } }),
  createListItemFn = jest.fn().mockResolvedValue({ data: {} }),
}: {
  user?: { username: string; isPro: boolean } | null;
  createMyListFn?: jest.Mock;
  createListItemFn?: jest.Mock;
} = {}) {
  mockUseAppContext.mockReturnValue({ user, initialized: true });
  let callIdx = 0;
  mockUseMutation.mockImplementation(() => {
    const result = callIdx % 2 === 0 ? [createMyListFn, {}] : [createListItemFn, {}];
    callIdx++;
    return result;
  });
}

const SAMPLE_TEMPLATE: Template = {
  id: 'test-template',
  name: 'Test Template',
  description: 'A test template for unit testing.',
  tags: ['test', 'sample'],
  items: [
    { osm_id: 'way/1', name: 'Place One', category: 'museum' },
    { osm_id: 'way/2', name: 'Place Two', category: 'park' },
    { osm_id: 'way/3', name: 'Place Three', category: null },
    { osm_id: 'way/4', name: 'Place Four', category: 'restaurant' },
    { osm_id: 'way/5', name: 'Place Five', category: 'attraction' },
    { osm_id: 'way/6', name: 'Place Six', category: null },
  ],
};

afterEach(() => {
  jest.resetAllMocks();
});

describe('TemplatesPage — rendering', () => {
  it('renders the page heading', () => {
    setupMocks();
    render(<TemplatesPage />);
    expect(screen.getByRole('heading', { name: /starter lists/i })).toBeInTheDocument();
  });

  it('renders a card for each template', () => {
    setupMocks();
    render(<TemplatesPage />);
    for (const t of TEMPLATES) {
      expect(screen.getByRole('heading', { name: t.name, level: 2 })).toBeInTheDocument();
    }
  });

  it('renders page title and description meta', () => {
    setupMocks();
    render(<TemplatesPage />);
    expect(document.querySelector('title')?.textContent).toMatch(/starter lists/i);
  });

  it('renders an "All" filter chip', () => {
    setupMocks();
    render(<TemplatesPage />);
    expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument();
  });

  it('"All" chip is pressed by default', () => {
    setupMocks();
    render(<TemplatesPage />);
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('renders a filter chip for each unique tag', () => {
    setupMocks();
    render(<TemplatesPage />);
    const allTags = [...new Set(TEMPLATES.flatMap((t) => t.tags))].sort();
    for (const tag of allTags) {
      expect(screen.getByRole('button', { name: tag })).toBeInTheDocument();
    }
  });
});

describe('TemplatesPage — tag filtering', () => {
  it('filters templates when a tag chip is clicked', async () => {
    const user = userEvent.setup();
    setupMocks();
    render(<TemplatesPage />);

    const museumsChip = screen.getByRole('button', { name: 'museums' });
    await user.click(museumsChip);

    expect(museumsChip).toHaveAttribute('aria-pressed', 'true');
    const museumTemplate = TEMPLATES.find((t) => t.tags.includes('museums'));
    expect(screen.getByRole('heading', { name: museumTemplate?.name, level: 2 })).toBeInTheDocument();
    const nonMuseumTemplate = TEMPLATES.find((t) => !t.tags.includes('museums'));
    expect(screen.queryByRole('heading', { name: nonMuseumTemplate?.name, level: 2 })).not.toBeInTheDocument();
  });

  it('deselects a tag and shows all when the same chip is clicked again', async () => {
    const user = userEvent.setup();
    setupMocks();
    render(<TemplatesPage />);

    const parksChip = screen.getByRole('button', { name: 'parks' });
    await user.click(parksChip);
    await user.click(parksChip);

    expect(parksChip).toHaveAttribute('aria-pressed', 'false');
    for (const t of TEMPLATES) {
      expect(screen.getByRole('heading', { name: t.name, level: 2 })).toBeInTheDocument();
    }
  });

  it('resets to all templates when the "All" chip is clicked after filtering', async () => {
    const user = userEvent.setup();
    setupMocks();
    render(<TemplatesPage />);

    await user.click(screen.getByRole('button', { name: 'food' }));
    await user.click(screen.getByRole('button', { name: 'All' }));

    for (const t of TEMPLATES) {
      expect(screen.getByRole('heading', { name: t.name, level: 2 })).toBeInTheDocument();
    }
  });

  it('shows a "no results" message when no template has the selected tag', async () => {
    const user = userEvent.setup();
    setupMocks();

    jest.mock('../../lib/templates', () => ({
      ...jest.requireActual('../../lib/templates'),
      filterTemplatesByTag: jest.fn().mockReturnValue([]),
    }));

    render(<TemplatesPage />);
    await user.click(screen.getByRole('button', { name: 'museums' }));
    await user.click(screen.getByRole('button', { name: 'All' }));
    expect(screen.queryByText(/no lists found/i)).not.toBeInTheDocument();
  });
});

describe('TemplateCard — logged-out visitor', () => {
  it('shows sign-up CTA instead of copy button', () => {
    setupMocks({ user: null });
    render(<TemplateCard template={SAMPLE_TEMPLATE} />);
    expect(screen.getByRole('link', { name: /sign up to copy/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
  });

  it('sign-up link points to /register', () => {
    setupMocks({ user: null });
    render(<TemplateCard template={SAMPLE_TEMPLATE} />);
    const link = screen.getByRole('link', { name: /sign up to copy/i }) as HTMLAnchorElement;
    expect(link.href).toContain('/register');
  });

  it('shows "Free — no credit card needed" note', () => {
    setupMocks({ user: null });
    render(<TemplateCard template={SAMPLE_TEMPLATE} />);
    expect(screen.getByText(/free — no credit card needed/i)).toBeInTheDocument();
  });
});

describe('TemplateCard — logged-in user', () => {
  it('renders the copy button', () => {
    setupMocks({ user: { username: 'alice', isPro: false } });
    render(<TemplateCard template={SAMPLE_TEMPLATE} />);
    expect(screen.getByRole('button', { name: /\+ copy to my lists/i })).toBeInTheDocument();
  });

  it('shows up to 5 places and a "+N more" line when there are more', () => {
    setupMocks({ user: null });
    render(<TemplateCard template={SAMPLE_TEMPLATE} />);
    expect(screen.getByText('Place One')).toBeInTheDocument();
    expect(screen.getByText('Place Five')).toBeInTheDocument();
    expect(screen.queryByText('Place Six')).not.toBeInTheDocument();
    expect(screen.getByText('+1 more')).toBeInTheDocument();
  });

  it('shows all places without overflow line when ≤ 5', () => {
    setupMocks({ user: null });
    const short: Template = { ...SAMPLE_TEMPLATE, items: SAMPLE_TEMPLATE.items.slice(0, 3) };
    render(<TemplateCard template={short} />);
    expect(screen.getByText('Place One')).toBeInTheDocument();
    expect(screen.getByText('Place Three')).toBeInTheDocument();
    expect(screen.queryByText(/\+ more/i)).not.toBeInTheDocument();
  });

  it('displays tags', () => {
    setupMocks({ user: null });
    render(<TemplateCard template={SAMPLE_TEMPLATE} />);
    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('sample')).toBeInTheDocument();
  });

  it('shows item count heading', () => {
    setupMocks({ user: null });
    render(<TemplateCard template={SAMPLE_TEMPLATE} />);
    expect(screen.getByText(`${SAMPLE_TEMPLATE.items.length} places`)).toBeInTheDocument();
  });

  it('copies list successfully and shows done state', async () => {
    const createMyListFn = jest.fn().mockResolvedValue({
      data: { createMyList: { documentId: 'new-id' } },
    });
    const createListItemFn = jest.fn().mockResolvedValue({ data: {} });
    setupMocks({
      user: { username: 'alice', isPro: false },
      createMyListFn,
      createListItemFn,
    });

    render(<TemplateCard template={SAMPLE_TEMPLATE} />);
    fireEvent.click(screen.getByRole('button', { name: /\+ copy to my lists/i }));

    await waitFor(() => {
      expect(screen.getByText(/copied!/i)).toBeInTheDocument();
    });

    expect(createMyListFn).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { name: SAMPLE_TEMPLATE.name } })
    );
    expect(createListItemFn).toHaveBeenCalledTimes(SAMPLE_TEMPLATE.items.length);
  });

  it('shows error state when copy fails', async () => {
    const createMyListFn = jest.fn().mockRejectedValue(new Error('Network error'));
    const createListItemFn = jest.fn();
    setupMocks({
      user: { username: 'alice', isPro: false },
      createMyListFn,
      createListItemFn,
    });

    render(<TemplateCard template={SAMPLE_TEMPLATE} />);
    fireEvent.click(screen.getByRole('button', { name: /\+ copy to my lists/i }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('shows copying state while in-progress', async () => {
    let resolve: (v: unknown) => void = () => {};
    const createMyListFn = jest.fn().mockReturnValue(new Promise((r) => { resolve = r; }));
    const createListItemFn = jest.fn();
    setupMocks({
      user: { username: 'alice', isPro: false },
      createMyListFn,
      createListItemFn,
    });

    render(<TemplateCard template={SAMPLE_TEMPLATE} />);
    fireEvent.click(screen.getByRole('button', { name: /\+ copy to my lists/i }));

    expect(screen.getByRole('button', { name: /copying…/i })).toBeDisabled();

    resolve({ data: { createMyList: { documentId: 'id' } } });
  });

  it('shows a link to /my-list after successful copy', async () => {
    setupMocks({ user: { username: 'alice', isPro: false } });
    render(<TemplateCard template={SAMPLE_TEMPLATE} />);
    fireEvent.click(screen.getByRole('button', { name: /\+ copy to my lists/i }));

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /view your lists/i }) as HTMLAnchorElement;
      expect(link.href).toContain('/my-list');
    });
  });

  it('shows error when createMyList returns no documentId', async () => {
    const createMyListFn = jest.fn().mockResolvedValue({
      data: { createMyList: { documentId: null } },
    });
    const createListItemFn = jest.fn();
    setupMocks({
      user: { username: 'alice', isPro: false },
      createMyListFn,
      createListItemFn,
    });

    render(<TemplateCard template={SAMPLE_TEMPLATE} />);
    fireEvent.click(screen.getByRole('button', { name: /\+ copy to my lists/i }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('shows an error instead of done when an item fails to copy', async () => {
    const createMyListFn = jest.fn().mockResolvedValue({
      data: { createMyList: { documentId: 'new-id' } },
    });
    const createListItemFn = jest.fn().mockResolvedValue({
      data: null,
      error: new CombinedGraphQLErrors({
        errors: [{ message: 'Failed', extensions: { code: 'FREE_ITEM_LIMIT_REACHED' } }],
      }),
    });
    setupMocks({ user: { username: 'alice', isPro: false }, createMyListFn, createListItemFn });

    render(<TemplateCard template={SAMPLE_TEMPLATE} />);
    fireEvent.click(screen.getByRole('button', { name: /\+ copy to my lists/i }));

    await waitFor(() => {
      expect(createListItemFn).toHaveBeenCalledTimes(1);
    });
    expect(await screen.findByText(/something went wrong/i)).toBeInTheDocument();
  });

  it('shows upgrade modal when FREE_LIST_LIMIT_REACHED error is returned', async () => {
    const createMyListFn = jest.fn().mockResolvedValue({
      data: null,
      error: new CombinedGraphQLErrors({
        errors: [{ message: 'Failed', extensions: { code: 'FREE_LIST_LIMIT_REACHED' } }],
      }),
    });
    setupMocks({
      user: { username: 'alice', isPro: false },
      createMyListFn,
    });

    render(<TemplateCard template={SAMPLE_TEMPLATE} />);
    fireEvent.click(screen.getByRole('button', { name: /\+ copy to my lists/i }));

    await waitFor(() => {
      expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument();
    });
    expect(screen.queryByText(/something went wrong/i)).not.toBeInTheDocument();
  });

  it('dismisses upgrade modal when closed', async () => {
    const createMyListFn = jest.fn().mockResolvedValue({
      data: null,
      error: new CombinedGraphQLErrors({
        errors: [{ message: 'Failed', extensions: { code: 'FREE_LIST_LIMIT_REACHED' } }],
      }),
    });
    setupMocks({
      user: { username: 'alice', isPro: false },
      createMyListFn,
    });

    render(<TemplateCard template={SAMPLE_TEMPLATE} />);
    fireEvent.click(screen.getByRole('button', { name: /\+ copy to my lists/i }));

    await waitFor(() => {
      expect(screen.getByTestId('upgrade-modal')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
    expect(screen.queryByTestId('upgrade-modal')).not.toBeInTheDocument();
  });
});

describe('TEMPLATES data', () => {
  it('exports at least one template', () => {
    expect(TEMPLATES.length).toBeGreaterThan(0);
  });

  it('every template has an id, name, description, tags, and items', () => {
    for (const t of TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.tags.length).toBeGreaterThan(0);
      expect(t.items.length).toBeGreaterThan(0);
    }
  });

  it('every template item has a non-empty osm_id and name', () => {
    for (const t of TEMPLATES) {
      for (const item of t.items) {
        expect(item.osm_id).toBeTruthy();
        expect(item.name).toBeTruthy();
      }
    }
  });
});
