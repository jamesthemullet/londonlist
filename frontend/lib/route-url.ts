export type RoutePlace = {
  lat: number;
  lng: number;
};

// Google Maps directions URLs accept at most 9 waypoints plus a destination.
export const MAX_ROUTE_PLACES = 10;

export function buildGoogleMapsRouteUrl(places: RoutePlace[]): string {
  if (places.length === 0) return '';
  if (places.length === 1) {
    const { lat, lng } = places[0];
    return `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;
  }
  const destination = places[places.length - 1];
  const waypoints = places.slice(0, -1);
  const waypointsStr = waypoints.map(({ lat, lng }) => `${lat},${lng}`).join('|');
  return `https://www.google.com/maps/dir/?api=1&destination=${destination.lat},${destination.lng}&waypoints=${encodeURIComponent(waypointsStr)}`;
}
