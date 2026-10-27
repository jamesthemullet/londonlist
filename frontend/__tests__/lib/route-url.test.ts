import { buildGoogleMapsRouteUrl, MAX_ROUTE_PLACES } from '../../lib/route-url';

describe('buildGoogleMapsRouteUrl', () => {
  it('returns empty string for empty array', () => {
    expect(buildGoogleMapsRouteUrl([])).toBe('');
  });

  it('returns a search URL for a single place', () => {
    const url = buildGoogleMapsRouteUrl([{ lat: 51.5, lng: -0.1 }]);
    expect(url).toBe('https://www.google.com/maps/search/?api=1&query=51.5,-0.1');
  });

  it('returns a directions URL for two places', () => {
    const url = buildGoogleMapsRouteUrl([
      { lat: 51.5, lng: -0.1 },
      { lat: 51.51, lng: -0.08 },
    ]);
    expect(url).toBe(
      'https://www.google.com/maps/dir/?api=1&destination=51.51,-0.08&waypoints=51.5%2C-0.1',
    );
  });

  it('puts all but the last place as waypoints', () => {
    const url = buildGoogleMapsRouteUrl([
      { lat: 51.5, lng: -0.1 },
      { lat: 51.51, lng: -0.08 },
      { lat: 51.52, lng: -0.05 },
    ]);
    expect(url).toContain('destination=51.52,-0.05');
    expect(url).toContain('waypoints=');
    expect(url).toContain('51.5%2C-0.1');
    expect(url).toContain('51.51%2C-0.08');
  });

  it('separates multiple waypoints with encoded pipe', () => {
    const url = buildGoogleMapsRouteUrl([
      { lat: 51.5, lng: -0.1 },
      { lat: 51.51, lng: -0.08 },
      { lat: 51.52, lng: -0.05 },
    ]);
    expect(url).toContain('%7C');
  });
});

describe('MAX_ROUTE_PLACES', () => {
  it('allows 9 waypoints plus a destination', () => {
    expect(MAX_ROUTE_PLACES).toBe(10);
  });
});
