import {
  extractPlace,
  extractRelatedPlaces,
  GET_PLACE,
  GET_RELATED_PLACES,
  type GetPlaceData,
  type GetRelatedPlacesData,
} from '../../lib/place';

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

describe('GET_RELATED_PLACES', () => {
  it('is a query named GetRelatedPlaces taking osm_id and limit variables', () => {
    const definition = GET_RELATED_PLACES.definitions[0] as unknown as {
      operation: string;
      name?: { value: string };
      variableDefinitions: { variable: { name: { value: string } } }[];
    };
    expect(definition.operation).toBe('query');
    expect(definition.name?.value).toBe('GetRelatedPlaces');
    const vars = definition.variableDefinitions.map((v) => v.variable.name.value);
    expect(vars).toContain('osm_id');
    expect(vars).toContain('limit');
  });
});

describe('extractRelatedPlaces', () => {
  const places = [
    { osm_id: 'relation/123', name: 'Natural History Museum', category: 'museum', lat: 51.496, lng: -0.176 },
    { osm_id: 'relation/456', name: 'Science Museum', category: 'museum', lat: 51.497, lng: -0.174 },
  ];

  it('returns the related places array when present', () => {
    const data: GetRelatedPlacesData = { relatedPlaces: places };
    expect(extractRelatedPlaces(data)).toEqual(places);
  });

  it('returns an empty array when relatedPlaces is empty', () => {
    const data: GetRelatedPlacesData = { relatedPlaces: [] };
    expect(extractRelatedPlaces(data)).toEqual([]);
  });

  it('returns an empty array when data is undefined', () => {
    expect(extractRelatedPlaces(undefined)).toEqual([]);
  });

  it('returns an empty array when data is null', () => {
    expect(extractRelatedPlaces(null)).toEqual([]);
  });
});
