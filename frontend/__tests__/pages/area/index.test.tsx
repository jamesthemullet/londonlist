import { render, screen } from '@testing-library/react';
import AreaIndexPage, { buildAreaIndexJsonLd } from '../../../pages/area/index';

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

const mockUser = {
  id: '1',
  documentId: 'u1',
  email: 'alice@example.com',
  username: 'alice',
  isPro: false,
};

beforeEach(() => {
  mockUseAppContext.mockReturnValue({ user: mockUser, initialized: true, setUser: jest.fn() });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('buildAreaIndexJsonLd', () => {
  it('returns a schema.org CollectionPage type', () => {
    const ld = buildAreaIndexJsonLd('https://londonlist.vercel.app') as Record<string, unknown>;
    expect(ld['@type']).toBe('CollectionPage');
  });

  it('sets the correct canonical URL', () => {
    const ld = buildAreaIndexJsonLd('https://londonlist.vercel.app') as Record<string, unknown>;
    expect(ld.url).toBe('https://londonlist.vercel.app/area');
  });

  it('sets the correct page name', () => {
    const ld = buildAreaIndexJsonLd('https://londonlist.vercel.app') as Record<string, unknown>;
    expect(ld.name).toBe('Browse London by Area');
  });

  it('includes a description', () => {
    const ld = buildAreaIndexJsonLd('https://londonlist.vercel.app') as Record<string, unknown>;
    expect(typeof ld.description).toBe('string');
    expect((ld.description as string).length).toBeGreaterThan(0);
  });

  it('uses the provided siteUrl in the canonical URL', () => {
    const ld = buildAreaIndexJsonLd('https://example.com') as Record<string, unknown>;
    expect(ld.url).toBe('https://example.com/area');
  });
});

describe('AreaIndexPage — page structure', () => {
  it('renders the main heading', () => {
    render(<AreaIndexPage />);
    expect(screen.getByRole('heading', { level: 1, name: 'Browse London by Area' })).toBeInTheDocument();
  });

  it('renders the breadcrumb with an Explore link to /explore', () => {
    render(<AreaIndexPage />);
    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(breadcrumb).toBeInTheDocument();
    const exploreLink = screen.getByRole('link', { name: 'Explore' });
    expect(exploreLink).toHaveAttribute('href', '/explore');
  });

  it('renders the areas as a list', () => {
    render(<AreaIndexPage />);
    expect(screen.getByRole('list', { name: 'London areas' })).toBeInTheDocument();
  });

  it('renders at least 10 area cards', () => {
    render(<AreaIndexPage />);
    const list = screen.getByRole('list', { name: 'London areas' });
    const items = list.querySelectorAll('li');
    expect(items.length).toBeGreaterThanOrEqual(10);
  });

  it('renders Bloomsbury as a linked area card', () => {
    render(<AreaIndexPage />);
    const link = screen.getByRole('link', { name: /bloomsbury/i });
    expect(link).toHaveAttribute('href', '/area/bloomsbury');
  });

  it('renders South Bank with a hyphenated slug', () => {
    render(<AreaIndexPage />);
    const link = screen.getByRole('link', { name: /south bank/i });
    expect(link).toHaveAttribute('href', '/area/south-bank');
  });

  it('renders Camden as a linked area card', () => {
    render(<AreaIndexPage />);
    const link = screen.getByRole('link', { name: /camden/i });
    expect(link).toHaveAttribute('href', '/area/camden');
  });
});

describe('AreaIndexPage — logged-out CTA', () => {
  it('shows the CTA banner for unauthenticated users', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true, setUser: jest.fn() });
    render(<AreaIndexPage />);
    expect(screen.getByRole('link', { name: /build your own london list/i })).toBeInTheDocument();
  });

  it('CTA link points to /register with area-index ref', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true, setUser: jest.fn() });
    render(<AreaIndexPage />);
    const link = screen.getByRole('link', { name: /build your own london list/i });
    expect(link).toHaveAttribute('href', '/register?ref=area-index');
  });

  it('does not show the CTA banner for authenticated users', () => {
    render(<AreaIndexPage />);
    expect(screen.queryByRole('link', { name: /build your own london list/i })).not.toBeInTheDocument();
  });

  it('does not show the CTA banner while context is uninitialised', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: false, setUser: jest.fn() });
    render(<AreaIndexPage />);
    expect(screen.queryByRole('link', { name: /build your own london list/i })).not.toBeInTheDocument();
  });
});
