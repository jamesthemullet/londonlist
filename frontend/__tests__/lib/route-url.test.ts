import { buildGoogleMapsRouteUrl, MAX_ROUTE_PLACES, orderRoute } from '../../lib/route-url';

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

describe('orderRoute', () => {
  it('returns an empty array for no places', () => {
    expect(orderRoute([])).toEqual([]);
  });

  it('leaves one or two places unchanged', () => {
    const places = [
      { lat: 51.5, lng: -0.1 },
      { lat: 51.6, lng: -0.2 },
    ];
    expect(orderRoute(places)).toEqual(places);
  });

  it('keeps the first place as the start', () => {
    const places = [
      { lat: 51.5, lng: 0 },
      { lat: 51.5, lng: 0.03 },
      { lat: 51.5, lng: 0.01 },
    ];
    expect(orderRoute(places)[0]).toEqual(places[0]);
  });

  it('visits the nearest unvisited place next', () => {
    const start = { lat: 51.5, lng: 0 };
    const far = { lat: 51.5, lng: 0.03 };
    const near = { lat: 51.5, lng: 0.01 };
    const middle = { lat: 51.5, lng: 0.02 };
    expect(orderRoute([start, far, near, middle])).toEqual([start, near, middle, far]);
  });

  it('does not mutate the input', () => {
    const places = [
      { lat: 51.5, lng: 0 },
      { lat: 51.5, lng: 0.03 },
      { lat: 51.5, lng: 0.01 },
    ];
    const copy = [...places];
    orderRoute(places);
    expect(places).toEqual(copy);
  });
});
