import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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
