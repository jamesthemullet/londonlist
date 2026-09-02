import { extractPlace, GET_PLACE, type GetPlaceData } from '../../lib/place';

describe('GET_PLACE', () => {
  it('is a query named GetPlace taking an osm_id variable', () => {
    const definition = GET_PLACE.definitions[0] as { operation: string; name?: { value: string } };
    expect(definition.operation).toBe('query');
    expect(definition.name?.value).toBe('GetPlace');
  });
});

describe('extractPlace', () => {
  const place = {
    osm_id: 'relation/1525018',
    name: 'British Museum',
    category: 'museum',
    lat: 51.519413,
    lng: -0.126957,
  };

  it('returns the place when present in the query data', () => {
    const data: GetPlaceData = { place };
    expect(extractPlace(data)).toEqual(place);
  });

  it('returns null when the query found no matching place', () => {
    const data: GetPlaceData = { place: null };
    expect(extractPlace(data)).toBeNull();
  });

  it('returns null when data is undefined', () => {
    expect(extractPlace(undefined)).toBeNull();
  });

  it('returns null when data is null', () => {
    expect(extractPlace(null)).toBeNull();
  });
});
