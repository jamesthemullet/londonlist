import { extractPlacesByArea, GET_PLACES_BY_AREA, type GetPlacesByAreaData } from '../../lib/places-by-area';

describe('GET_PLACES_BY_AREA', () => {
  it('is a query named GetPlacesByArea taking an area variable', () => {
    const definition = GET_PLACES_BY_AREA.definitions[0] as { operation: string; name?: { value: string } };
    expect(definition.operation).toBe('query');
    expect(definition.name?.value).toBe('GetPlacesByArea');
  });
});

describe('extractPlacesByArea', () => {
  const places = [
    {
      osm_id: 'relation/1525018',
      name: 'British Museum',
      category: 'museum',
      area: 'Bloomsbury',
      lat: 51.519413,
      lng: -0.126957,
    },
    {
      osm_id: 'node/12345',
      name: 'Russell Square',
      category: 'park',
      area: 'Bloomsbury',
      lat: 51.5221,
      lng: -0.1262,
    },
  ];

  it('returns the places when present in the query data', () => {
    const data: GetPlacesByAreaData = { placesByArea: places };
    expect(extractPlacesByArea(data)).toEqual(places);
  });

  it('returns an empty array when the query found no matching places', () => {
    const data: GetPlacesByAreaData = { placesByArea: null };
    expect(extractPlacesByArea(data)).toEqual([]);
  });

  it('returns an empty array when data is undefined', () => {
    expect(extractPlacesByArea(undefined)).toEqual([]);
  });

  it('returns an empty array when data is null', () => {
    expect(extractPlacesByArea(null)).toEqual([]);
  });
});
