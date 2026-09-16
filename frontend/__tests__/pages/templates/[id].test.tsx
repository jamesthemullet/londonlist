import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useMutation } from '@apollo/client/react';
import TemplateDetailPage, {
  CopyButton,
  buildTemplateJsonLd,
  getStaticPaths,
  getStaticProps,
} from '../../../pages/templates/[id]';
import { TEMPLATES } from '../../../lib/templates';
import type { Template } from '../../../lib/templates';

jest.mock('@apollo/client/react', () => ({
  useMutation: jest.fn(),
}));

jest.mock('@apollo/client', () => ({
  gql: jest.fn((strings: TemplateStringsArray) => strings[0]),
}));

jest.mock('../../../hooks/use-auth-header', () => ({
  useAuthHeader: () => ({}),
}));

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
const mockUseMutation = useMutation as jest.Mock;

const SAMPLE_TEMPLATE: Template = {
  id: 'test-template',
  name: 'Test Template',
  description: 'A test template for unit testing.',
  tags: ['test', 'sample'],
  items: [
    { osm_id: 'way/1', name: 'Place One', category: 'museum' },
    { osm_id: 'way/2', name: 'Place Two', category: 'park' },
    { osm_id: 'way/3', name: 'Place Three', category: null },
  ],
};

const RELATED: Template[] = [
  {
    id: 'related-1',
    name: 'Related Template One',
    description: 'Related.',
    tags: ['r'],
    items: [{ osm_id: 'way/10', name: 'R1 Place', category: null }],
  },
];

function setupMocks({
  user = null,
  createMyListFn = jest.fn().mockResolvedValue({ data: { createMyList: { documentId: 'new-id' } } }),
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

afterEach(() => {
  jest.resetAllMocks();
});

describe('TemplateDetailPage — rendering', () => {
  it('renders the template name as H1', () => {
    setupMocks();
    render(<TemplateDetailPage template={SAMPLE_TEMPLATE} relatedTemplates={[]} />);
    expect(screen.getByRole('heading', { name: SAMPLE_TEMPLATE.name, level: 1 })).toBeInTheDocument();
  });

  it('renders the template description', () => {
    setupMocks();
    render(<TemplateDetailPage template={SAMPLE_TEMPLATE} relatedTemplates={[]} />);
    expect(screen.getByText(SAMPLE_TEMPLATE.description)).toBeInTheDocument();
  });

  it('renders all tags', () => {
    setupMocks();
    render(<TemplateDetailPage template={SAMPLE_TEMPLATE} relatedTemplates={[]} />);
    for (const tag of SAMPLE_TEMPLATE.tags) {
      expect(screen.getByText(tag)).toBeInTheDocument();
    }
  });

  it('renders all places in the list', () => {
    setupMocks();
    render(<TemplateDetailPage template={SAMPLE_TEMPLATE} relatedTemplates={[]} />);
    for (const item of SAMPLE_TEMPLATE.items) {
      expect(screen.getByText(item.name)).toBeInTheDocument();
    }
  });

  it('renders place categories when present', () => {
    setupMocks();
    render(<TemplateDetailPage template={SAMPLE_TEMPLATE} relatedTemplates={[]} />);
    expect(screen.getByText('museum')).toBeInTheDocument();
    expect(screen.getByText('park')).toBeInTheDocument();
  });

  it('renders a breadcrumb link back to /templates', () => {
    setupMocks();
    render(<TemplateDetailPage template={SAMPLE_TEMPLATE} relatedTemplates={[]} />);
    const link = screen.getByRole('link', { name: /starter lists/i }) as HTMLAnchorElement;
    expect(link.href).toContain('/templates');
  });

  it('shows the places count heading', () => {
    setupMocks();
    render(<TemplateDetailPage template={SAMPLE_TEMPLATE} relatedTemplates={[]} />);
    expect(
      screen.getByRole('heading', { name: /3 places in this list/i, level: 2 }),
    ).toBeInTheDocument();
  });

  it('renders "1 place" (singular) when only 1 item', () => {
    setupMocks();
    const single: Template = { ...SAMPLE_TEMPLATE, items: [SAMPLE_TEMPLATE.items[0]] };
    render(<TemplateDetailPage template={single} relatedTemplates={[]} />);
    expect(screen.getByRole('heading', { name: /1 place in this list/i, level: 2 })).toBeInTheDocument();
  });

  it('renders related templates section when provided', () => {
    setupMocks();
    render(<TemplateDetailPage template={SAMPLE_TEMPLATE} relatedTemplates={RELATED} />);
    expect(screen.getByRole('region', { name: /more starter lists/i })).toBeInTheDocument();
    expect(screen.getByText('Related Template One')).toBeInTheDocument();
  });

  it('does not render related section when empty', () => {
    setupMocks();
    render(<TemplateDetailPage template={SAMPLE_TEMPLATE} relatedTemplates={[]} />);
    expect(screen.queryByRole('region', { name: /more starter lists/i })).not.toBeInTheDocument();
  });

  it('related template links point to /templates/:id', () => {
    setupMocks();
    render(<TemplateDetailPage template={SAMPLE_TEMPLATE} relatedTemplates={RELATED} />);
    const link = screen.getByRole('link', { name: /related template one/i }) as HTMLAnchorElement;
    expect(link.href).toContain('/templates/related-1');
  });
});

describe('CopyButton — logged-out user', () => {
  it('shows sign-up CTA instead of copy button', () => {
    setupMocks({ user: null });
    render(<CopyButton template={SAMPLE_TEMPLATE} />);
    expect(screen.getByRole('link', { name: /sign up free to copy/i })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /copy/i })).not.toBeInTheDocument();
  });

  it('sign-up link points to /register', () => {
    setupMocks({ user: null });
    render(<CopyButton template={SAMPLE_TEMPLATE} />);
    const link = screen.getByRole('link', { name: /sign up free to copy/i }) as HTMLAnchorElement;
    expect(link.href).toContain('/register');
  });
});

describe('CopyButton — logged-in user', () => {
  it('renders the copy button', () => {
    setupMocks({ user: { username: 'alice', isPro: false } });
    render(<CopyButton template={SAMPLE_TEMPLATE} />);
    expect(screen.getByRole('button', { name: /\+ copy this list/i })).toBeInTheDocument();
  });

  it('copies list and shows done state', async () => {
    const createMyListFn = jest.fn().mockResolvedValue({
      data: { createMyList: { documentId: 'new-id' } },
    });
    const createListItemFn = jest.fn().mockResolvedValue({ data: {} });
    setupMocks({ user: { username: 'alice', isPro: false }, createMyListFn, createListItemFn });

    render(<CopyButton template={SAMPLE_TEMPLATE} />);
    fireEvent.click(screen.getByRole('button', { name: /\+ copy this list/i }));

    await waitFor(() => {
      expect(screen.getByText(/list copied!/i)).toBeInTheDocument();
    });

    expect(createMyListFn).toHaveBeenCalledWith(
      expect.objectContaining({ variables: { name: SAMPLE_TEMPLATE.name } }),
    );
    expect(createListItemFn).toHaveBeenCalledTimes(SAMPLE_TEMPLATE.items.length);
  });

  it('shows error state when copy fails', async () => {
    const createMyListFn = jest.fn().mockRejectedValue(new Error('Network error'));
    setupMocks({ user: { username: 'alice', isPro: false }, createMyListFn });

    render(<CopyButton template={SAMPLE_TEMPLATE} />);
    fireEvent.click(screen.getByRole('button', { name: /\+ copy this list/i }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });

  it('shows copying… state while in-progress', () => {
    let resolve: (v: unknown) => void = () => {};
    const createMyListFn = jest.fn().mockReturnValue(new Promise((r) => { resolve = r; }));
    setupMocks({ user: { username: 'alice', isPro: false }, createMyListFn });

    render(<CopyButton template={SAMPLE_TEMPLATE} />);
    fireEvent.click(screen.getByRole('button', { name: /\+ copy this list/i }));

    expect(screen.getByRole('button', { name: /copying…/i })).toBeDisabled();
    resolve({ data: { createMyList: { documentId: 'id' } } });
  });

  it('shows view lists link after successful copy', async () => {
    setupMocks({ user: { username: 'alice', isPro: false } });
    render(<CopyButton template={SAMPLE_TEMPLATE} />);
    fireEvent.click(screen.getByRole('button', { name: /\+ copy this list/i }));

    await waitFor(() => {
      const link = screen.getByRole('link', { name: /view your lists/i }) as HTMLAnchorElement;
      expect(link.href).toContain('/my-list');
    });
  });

  it('shows error when createMyList returns no documentId', async () => {
    const createMyListFn = jest.fn().mockResolvedValue({
      data: { createMyList: { documentId: null } },
    });
    setupMocks({ user: { username: 'alice', isPro: false }, createMyListFn });

    render(<CopyButton template={SAMPLE_TEMPLATE} />);
    fireEvent.click(screen.getByRole('button', { name: /\+ copy this list/i }));

    await waitFor(() => {
      expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
    });
  });
});

describe('buildTemplateJsonLd', () => {
  const SITE_URL = 'https://londonlist.co.uk';

  it('returns an ItemList schema object', () => {
    const jsonLd = buildTemplateJsonLd(SAMPLE_TEMPLATE, SITE_URL);
    expect((jsonLd as Record<string, unknown>)['@type']).toBe('ItemList');
  });

  it('includes the template name and description', () => {
    const jsonLd = buildTemplateJsonLd(SAMPLE_TEMPLATE, SITE_URL) as Record<string, unknown>;
    expect((jsonLd.name as string)).toMatch(/test template/i);
    expect(jsonLd.description).toBe(SAMPLE_TEMPLATE.description);
  });

  it('sets the correct URL', () => {
    const jsonLd = buildTemplateJsonLd(SAMPLE_TEMPLATE, SITE_URL) as Record<string, unknown>;
    expect(jsonLd.url).toBe(`${SITE_URL}/templates/${SAMPLE_TEMPLATE.id}`);
  });

  it('includes all items as ListItem entries', () => {
    const jsonLd = buildTemplateJsonLd(SAMPLE_TEMPLATE, SITE_URL) as Record<string, unknown>;
    const elements = jsonLd.itemListElement as Array<Record<string, unknown>>;
    expect(elements).toHaveLength(SAMPLE_TEMPLATE.items.length);
    expect(elements[0]['@type']).toBe('ListItem');
    expect(elements[0].position).toBe(1);
    expect(elements[0].name).toBe(SAMPLE_TEMPLATE.items[0].name);
  });

  it('sets numberOfItems correctly', () => {
    const jsonLd = buildTemplateJsonLd(SAMPLE_TEMPLATE, SITE_URL) as Record<string, unknown>;
    expect(jsonLd.numberOfItems).toBe(SAMPLE_TEMPLATE.items.length);
  });
});

type StaticPathsResult = { paths: Array<{ params: { id: string } }>; fallback: boolean };

describe('getStaticPaths', () => {
  it('returns a path for every template', () => {
    const result = getStaticPaths({}) as StaticPathsResult;
    expect(result.paths).toHaveLength(TEMPLATES.length);
    for (const t of TEMPLATES) {
      expect(result.paths.some((p) => p.params.id === t.id)).toBe(true);
    }
  });

  it('sets fallback to false', () => {
    const result = getStaticPaths({}) as StaticPathsResult;
    expect(result.fallback).toBe(false);
  });
});

describe('getStaticProps', () => {
  it('returns the correct template for a valid id', () => {
    const first = TEMPLATES[0];
    const result = getStaticProps({ params: { id: first.id } } as Parameters<typeof getStaticProps>[0]);
    expect((result as { props: { template: Template } }).props.template.id).toBe(first.id);
  });

  it('returns notFound for an unknown id', () => {
    const result = getStaticProps({ params: { id: 'does-not-exist' } } as Parameters<typeof getStaticProps>[0]);
    expect((result as { notFound: boolean }).notFound).toBe(true);
  });

  it('returns up to 3 related templates (excluding the current one)', () => {
    const first = TEMPLATES[0];
    const result = getStaticProps({ params: { id: first.id } } as Parameters<typeof getStaticProps>[0]);
    const related = (result as { props: { relatedTemplates: Template[] } }).props.relatedTemplates;
    expect(related.length).toBeLessThanOrEqual(3);
    expect(related.every((t) => t.id !== first.id)).toBe(true);
  });
});
