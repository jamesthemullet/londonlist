import { render, screen } from '@testing-library/react';
import { useQuery } from '@apollo/client/react';
import { useRouter } from 'next/router';
import PlaceDetailPage, { buildOsmId } from '../../../../pages/place/[type]/[id]';

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const mockUseQuery = useQuery as unknown as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

function setupRouter(type: string | undefined, id: string | undefined) {
  mockUseRouter.mockReturnValue({ query: { type, id } });
}

afterEach(() => {
  jest.resetAllMocks();
});

describe('buildOsmId', () => {
  it('joins a type and id into an osm_id', () => {
    expect(buildOsmId('relation', '1525018')).toBe('relation/1525018');
  });

  it('returns null when type is missing', () => {
    expect(buildOsmId(undefined, '1525018')).toBeNull();
  });

  it('returns null when id is missing', () => {
    expect(buildOsmId('relation', undefined)).toBeNull();
  });

  it('unwraps array query values', () => {
    expect(buildOsmId(['relation'], ['1525018'])).toBe('relation/1525018');
  });
});

describe('PlaceDetailPage', () => {
  it('shows a loader while the query is in flight', () => {
    setupRouter('relation', '1525018');
    mockUseQuery.mockReturnValue({ loading: true, error: undefined, data: undefined });
    render(<PlaceDetailPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows an error message when the query fails', () => {
    setupRouter('relation', '1525018');
    mockUseQuery.mockReturnValue({ loading: false, error: new Error('boom'), data: undefined });
    render(<PlaceDetailPage />);
    expect(screen.getByText('Error loading this place.')).toBeInTheDocument();
  });

  it('shows a not-found message when no place matches', () => {
    setupRouter('relation', '1525018');
    mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: { place: null } });
    render(<PlaceDetailPage />);
    expect(screen.getByText('Place not found.')).toBeInTheDocument();
  });

  it('renders the place name as H1', () => {
    setupRouter('relation', '1525018');
    mockUseQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: { place: { osm_id: 'relation/1525018', name: 'British Museum', category: 'museum', lat: 51.5, lng: -0.1 } },
    });
    render(<PlaceDetailPage />);
    expect(screen.getByRole('heading', { name: 'British Museum', level: 1 })).toBeInTheDocument();
  });

  it('renders the category when present', () => {
    setupRouter('relation', '1525018');
    mockUseQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: { place: { osm_id: 'relation/1525018', name: 'British Museum', category: 'museum', lat: 51.5, lng: -0.1 } },
    });
    render(<PlaceDetailPage />);
    expect(screen.getByText('museum')).toBeInTheDocument();
  });

  it('renders an OpenStreetMap link when coordinates are present', () => {
    setupRouter('way', '60381740');
    mockUseQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: { place: { osm_id: 'way/60381740', name: 'Borough Market', category: 'market', lat: 51.5, lng: -0.09 } },
    });
    render(<PlaceDetailPage />);
    const link = screen.getByRole('link', { name: /view on openstreetmap/i }) as HTMLAnchorElement;
    expect(link.href).toBe('https://www.openstreetmap.org/way/60381740');
  });

  it('does not render an OpenStreetMap link when coordinates are missing', () => {
    setupRouter('way', '60381740');
    mockUseQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: { place: { osm_id: 'way/60381740', name: 'Borough Market', category: null, lat: null, lng: null } },
    });
    render(<PlaceDetailPage />);
    expect(screen.queryByRole('link', { name: /view on openstreetmap/i })).not.toBeInTheDocument();
  });

  it('renders a breadcrumb link back to /explore', () => {
    setupRouter('way', '60381740');
    mockUseQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: { place: { osm_id: 'way/60381740', name: 'Borough Market', category: 'market', lat: 51.5, lng: -0.09 } },
    });
    render(<PlaceDetailPage />);
    const link = screen.getByRole('link', { name: 'Explore' }) as HTMLAnchorElement;
    expect(link.href).toContain('/explore');
  });

  it('shows a loader when the route params are not yet available', () => {
    setupRouter(undefined, undefined);
    mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: undefined });
    render(<PlaceDetailPage />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
