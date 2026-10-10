import { render, screen } from '@testing-library/react';
import PlaceDetailPage, { buildPlaceJsonLd } from '../../../../pages/place/[type]/[id]';

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

jest.mock('../../../../components/related-places/related-places', () => ({
  __esModule: true,
  default: ({ places }: { places: { osm_id: string; name: string }[] }) => (
    <ul aria-label="related-places-mock">
      {places.map((p) => (
        <li key={p.osm_id}>{p.name}</li>
      ))}
    </ul>
  ),
}));

jest.mock('../../../../components/add-to-list-button/add-to-list-button', () => ({
  __esModule: true,
  default: () => <div data-testid="add-to-list-button-mock" />,
}));

jest.mock('../../../../components/booking-links/booking-links', () => ({
  __esModule: true,
  default: () => null,
}));

const MUSEUM = {
  osm_id: 'relation/1525018',
  name: 'British Museum',
  category: 'museum',
  lat: 51.519413,
  lng: -0.126957,
};

const MARKET = {
  osm_id: 'way/60381740',
  name: 'Borough Market',
  category: 'market',
  lat: 51.505,
  lng: -0.091,
};

const NO_COORDS = {
  osm_id: 'node/123',
  name: 'Mystery Spot',
  category: null,
  lat: null,
  lng: null,
};

describe('PlaceDetailPage', () => {
  it('renders the place name as h1', () => {
    render(<PlaceDetailPage place={MUSEUM} relatedPlaces={[]} />);
    expect(screen.getByRole('heading', { name: 'British Museum', level: 1 })).toBeInTheDocument();
  });

  it('renders the category badge when present', () => {
    render(<PlaceDetailPage place={MUSEUM} relatedPlaces={[]} />);
    expect(screen.getByText('museum')).toBeInTheDocument();
  });

  it('does not render a category badge when category is null', () => {
    render(<PlaceDetailPage place={NO_COORDS} relatedPlaces={[]} />);
    expect(screen.queryByText('museum')).not.toBeInTheDocument();
  });

  it('renders an OpenStreetMap link when coordinates are present', () => {
    render(<PlaceDetailPage place={MUSEUM} relatedPlaces={[]} />);
    const link = screen.getByRole('link', { name: /openstreetmap/i }) as HTMLAnchorElement;
    expect(link.href).toBe('https://www.openstreetmap.org/relation/1525018');
  });

  it('does not render an OpenStreetMap link when coordinates are missing', () => {
    render(<PlaceDetailPage place={NO_COORDS} relatedPlaces={[]} />);
    expect(screen.queryByRole('link', { name: /openstreetmap/i })).not.toBeInTheDocument();
  });

  it('renders a breadcrumb link to /explore', () => {
    render(<PlaceDetailPage place={MUSEUM} relatedPlaces={[]} />);
    const link = screen.getByRole('link', { name: 'Explore' }) as HTMLAnchorElement;
    expect(link.href).toContain('/explore');
  });

  it('renders a breadcrumb with the place name', () => {
    render(<PlaceDetailPage place={MUSEUM} relatedPlaces={[]} />);
    expect(screen.getByText('British Museum', { selector: '[aria-current="page"]' })).toBeInTheDocument();
  });

  it('passes related places to the RelatedPlaces component', () => {
    const related = [MARKET];
    render(<PlaceDetailPage place={MUSEUM} relatedPlaces={related} />);
    expect(screen.getByText('Borough Market')).toBeInTheDocument();
  });

  it('marks the breadcrumb current page span with the place name', () => {
    render(<PlaceDetailPage place={MARKET} relatedPlaces={[]} />);
    expect(screen.getByText('Borough Market', { selector: '[aria-current="page"]' })).toBeInTheDocument();
  });
});

describe('buildPlaceJsonLd', () => {
  it('returns a schema.org TouristAttraction', () => {
    const ld = buildPlaceJsonLd(MUSEUM, 'https://londonlist.vercel.app') as Record<string, unknown>;
    expect(ld['@type']).toBe('TouristAttraction');
  });

  it('includes the canonical URL', () => {
    const ld = buildPlaceJsonLd(MUSEUM, 'https://londonlist.vercel.app') as { url: string };
    expect(ld.url).toBe('https://londonlist.vercel.app/place/relation/1525018');
  });

  it('includes geo coordinates when lat/lng are present', () => {
    const ld = buildPlaceJsonLd(MUSEUM, 'https://londonlist.vercel.app') as {
      geo: { '@type': string; latitude: number; longitude: number };
    };
    expect(ld.geo['@type']).toBe('GeoCoordinates');
    expect(ld.geo.latitude).toBe(51.519413);
    expect(ld.geo.longitude).toBe(-0.126957);
  });

  it('omits geo when coordinates are null', () => {
    const ld = buildPlaceJsonLd(NO_COORDS, 'https://londonlist.vercel.app') as { geo?: unknown };
    expect(ld.geo).toBeUndefined();
  });

  it('includes a description from the category when present', () => {
    const ld = buildPlaceJsonLd(MUSEUM, 'https://londonlist.vercel.app') as { description: string };
    expect(ld.description).toBe('A museum in London');
  });

  it('omits description when category is null', () => {
    const ld = buildPlaceJsonLd(NO_COORDS, 'https://londonlist.vercel.app') as { description?: string };
    expect(ld.description).toBeUndefined();
  });

  it('includes containedInPlace pointing to London', () => {
    const ld = buildPlaceJsonLd(MUSEUM, 'https://londonlist.vercel.app') as {
      containedInPlace: { '@type': string; name: string };
    };
    expect(ld.containedInPlace.name).toBe('London');
  });
});
