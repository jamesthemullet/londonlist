import { buildCsvString, triggerCsvDownload } from '../../lib/export-csv';
import type { ExportableListItem } from '../../lib/export-csv';

beforeAll(() => {
  global.URL.createObjectURL = jest.fn(() => 'blob:mock-url');
  global.URL.revokeObjectURL = jest.fn();
});

afterEach(() => {
  jest.clearAllMocks();
});

const ITEMS: ExportableListItem[] = [
  {
    name: 'British Museum',
    category: 'museum',
    completed: true,
    visitedAt: '2026-01-15T00:00:00.000Z',
    notes: 'Amazing collection',
    lat: 51.5194,
    lng: -0.1269,
  },
  {
    name: 'Dishoom, Covent Garden',
    category: 'restaurant',
    completed: false,
    visitedAt: null,
    notes: null,
    lat: null,
    lng: null,
  },
];

describe('buildCsvString', () => {
  it('includes a header row', () => {
    const csv = buildCsvString([], 'My List');
    expect(csv.startsWith('Name,Category,Completed,Visited At,Notes,Latitude,Longitude')).toBe(true);
  });

  it('renders a completed item with all fields', () => {
    const csv = buildCsvString([ITEMS[0]], 'My List');
    const lines = csv.split('\n');
    expect(lines[1]).toBe(
      'British Museum,museum,Yes,2026-01-15T00:00:00.000Z,Amazing collection,51.5194,-0.1269',
    );
  });

  it('renders an incomplete item with empty optional fields', () => {
    const csv = buildCsvString([ITEMS[1]], 'My List');
    const lines = csv.split('\n');
    expect(lines[1]).toBe('"Dishoom, Covent Garden",restaurant,No,,,,');
  });

  it('escapes commas in field values', () => {
    const item: ExportableListItem = {
      name: 'Place, with comma',
      category: null,
      completed: false,
      visitedAt: null,
      notes: null,
    };
    const csv = buildCsvString([item], 'Test');
    expect(csv).toContain('"Place, with comma"');
  });

  it('escapes double quotes in field values', () => {
    const item: ExportableListItem = {
      name: 'The "best" pub',
      category: 'bar',
      completed: false,
      visitedAt: null,
      notes: null,
    };
    const csv = buildCsvString([item], 'Test');
    expect(csv).toContain('"The ""best"" pub"');
  });

  it('escapes newlines in notes', () => {
    const item: ExportableListItem = {
      name: 'Park',
      category: 'park',
      completed: false,
      visitedAt: null,
      notes: 'Line one\nLine two',
    };
    const csv = buildCsvString([item], 'Test');
    expect(csv).toContain('"Line one\nLine two"');
  });

  it('handles a null category as an empty string', () => {
    const item: ExportableListItem = {
      name: 'Unknown place',
      category: null,
      completed: false,
      visitedAt: null,
      notes: null,
    };
    const csv = buildCsvString([item], 'Test');
    const lines = csv.split('\n');
    expect(lines[1]).toMatch(/^Unknown place,,/);
  });

  it('returns only a header row for an empty item list', () => {
    const csv = buildCsvString([], 'Empty List');
    expect(csv.split('\n')).toHaveLength(1);
  });
});

describe('triggerCsvDownload', () => {
  it('creates and removes a temporary anchor element', () => {
    const appendSpy = jest.spyOn(document.body, 'appendChild');
    const removeSpy = jest.spyOn(document.body, 'removeChild');

    triggerCsvDownload('Name,Category\nFoo,bar', 'my-list');

    expect(appendSpy).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledTimes(1);
  });

  it('uses a sanitised filename based on the list name', () => {
    const appendSpy = jest.spyOn(document.body, 'appendChild');
    triggerCsvDownload('data', 'My Favourite Places!');
    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.download).toBe('my_favourite_places.csv');
  });

  it('falls back to "my-list.csv" when name sanitises to empty', () => {
    const appendSpy = jest.spyOn(document.body, 'appendChild');
    triggerCsvDownload('data', '!@#$%');
    const anchor = appendSpy.mock.calls[0][0] as HTMLAnchorElement;
    expect(anchor.download).toBe('my-list.csv');
  });
});
