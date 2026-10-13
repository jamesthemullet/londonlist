import { render, screen } from '@testing-library/react';
import PlaceDetailPage, { buildPlaceJsonLd, getServerSideProps } from '../../../../pages/place/[type]/[id]';

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

jest.mock('../../../../components/booking-links/booking-links', () => ({
  __esModule: true,
  default: ({ name, category }: { name: string; category: string | null }) => (
    <div data-testid="booking-links" data-name={name} data-category={category ?? ''} />
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

  it('renders BookingLinks with the place name and category', () => {
    render(<PlaceDetailPage place={MUSEUM} relatedPlaces={[]} />);
    const bookingLinks = screen.getByTestId('booking-links');
    expect(bookingLinks).toHaveAttribute('data-name', 'British Museum');
    expect(bookingLinks).toHaveAttribute('data-category', 'museum');
  });

  it('renders BookingLinks with null category when category is absent', () => {
    render(<PlaceDetailPage place={NO_COORDS} relatedPlaces={[]} />);
    const bookingLinks = screen.getByTestId('booking-links');
    expect(bookingLinks).toHaveAttribute('data-name', 'Mystery Spot');
    expect(bookingLinks).toHaveAttribute('data-category', '');
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

describe('getServerSideProps', () => {
  const makeContext = (type: string, id: string) => ({
    params: { type, id },
    req: {},
    res: {},
    query: {},
    resolvedUrl: `/place/${type}/${id}`,
  // biome-ignore lint/suspicious/noExplicitAny: minimal context mock
  }) as any;

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('returns the place and related places on success', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { place: MUSEUM } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { relatedPlaces: [MARKET] } }),
      });

    const result = await getServerSideProps(makeContext('relation', '1525018'));
    expect(result).toEqual({ props: { place: MUSEUM, relatedPlaces: [MARKET] } });
  });

  it('returns notFound when the API response is not ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });

    const result = await getServerSideProps(makeContext('relation', '1525018'));
    expect(result).toEqual({ notFound: true });
  });

  it('returns notFound when the place is null in the response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: { place: null } }),
    });

    const result = await getServerSideProps(makeContext('node', '999'));
    expect(result).toEqual({ notFound: true });
  });

  it('returns notFound when fetch throws', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const result = await getServerSideProps(makeContext('way', '123'));
    expect(result).toEqual({ notFound: true });
  });

  it('returns place with empty relatedPlaces when the related fetch fails', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { place: MUSEUM } }),
      })
      .mockRejectedValueOnce(new Error('Related places unavailable'));

    const result = await getServerSideProps(makeContext('relation', '1525018'));
    expect(result).toEqual({ props: { place: MUSEUM, relatedPlaces: [] } });
  });

  it('returns place with empty relatedPlaces when the related fetch is not ok', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { place: MUSEUM } }),
      })
      .mockResolvedValueOnce({ ok: false });

    const result = await getServerSideProps(makeContext('relation', '1525018'));
    expect(result).toEqual({ props: { place: MUSEUM, relatedPlaces: [] } });
  });

  it('returns empty relatedPlaces when the related response has no data', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { place: MUSEUM } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });

    const result = await getServerSideProps(makeContext('relation', '1525018'));
    expect(result).toEqual({ props: { place: MUSEUM, relatedPlaces: [] } });
  });

  it('constructs the osm_id from type and id params', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { place: MARKET } }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { relatedPlaces: [] } }),
      });

    await getServerSideProps(makeContext('way', '60381740'));

    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
    expect(body.variables.osm_id).toBe('way/60381740');
  });
});
