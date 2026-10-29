export type RoutePlace = {
  lat: number;
  lng: number;
};

// Google Maps directions URLs accept at most 9 waypoints plus a destination.
export const MAX_ROUTE_PLACES = 10;

// Greedy nearest-neighbour ordering starting from the first place, so a list
// added in random order doesn't produce a zig-zag route.
export function orderRoute(places: RoutePlace[]): RoutePlace[] {
  if (places.length <= 2) return [...places];
  const remaining = places.slice(1);
  const ordered = [places[0]];
  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    const lngScale = Math.cos((current.lat * Math.PI) / 180);
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    remaining.forEach(({ lat, lng }, i) => {
      const distance = (lat - current.lat) ** 2 + ((lng - current.lng) * lngScale) ** 2;
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = i;
      }
    });
    ordered.push(remaining.splice(nearestIndex, 1)[0]);
  }
  return ordered;
}

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
