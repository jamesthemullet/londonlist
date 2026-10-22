import { buildCsvFilename, exportListToCsv } from '../../lib/export-list';
import type { ExportListItem } from '../../lib/export-list';

const ITEMS: ExportListItem[] = [
  {
    name: 'British Museum',
    category: 'museum',
    completed: true,
    visitedAt: '2024-06-15T00:00:00.000Z',
    notes: 'Loved the Egyptian mummies',
    osm_id: 'node/123',
  },
  {
    name: 'Hyde Park',
    category: 'park',
    completed: false,
    visitedAt: null,
    notes: null,
    osm_id: 'way/456',
  },
];

describe('exportListToCsv', () => {
  it('includes a meta comment row on the first line', () => {
    const csv = exportListToCsv(ITEMS, 'My List');
    const firstLine = csv.split('\n')[0];
    expect(firstLine).toMatch(/^# London List export:/);
    expect(firstLine).toContain('My List');
  });

  it('includes a header row on the second line', () => {
    const csv = exportListToCsv(ITEMS, 'My List');
    const secondLine = csv.split('\n')[1];
    expect(secondLine).toBe('Name,Category,Status,Visited At,Notes,OpenStreetMap URL');
  });

  it('outputs one data row per item plus meta and header', () => {
    const csv = exportListToCsv(ITEMS, 'My List');
    const lines = csv.split('\n');
    expect(lines).toHaveLength(4); // meta + header + 2 items
  });

  it('marks completed items as Done', () => {
    const csv = exportListToCsv(ITEMS, 'My List');
    expect(csv).toContain('Done');
  });

  it('marks incomplete items as To do', () => {
    const csv = exportListToCsv(ITEMS, 'My List');
    expect(csv).toContain('To do');
  });

  it('includes OSM URL', () => {
    const csv = exportListToCsv(ITEMS, 'My List');
    expect(csv).toContain('https://www.openstreetmap.org/node/123');
  });

  it('formats visitedAt date in British locale', () => {
    const csv = exportListToCsv(ITEMS, 'My List');
    expect(csv).toContain('15/06/2024');
  });

  it('leaves visitedAt blank when null', () => {
    const csv = exportListToCsv(ITEMS, 'My List');
    const lines = csv.split('\n');
    // lines[0] = meta, lines[1] = header, lines[2] = British Museum, lines[3] = Hyde Park
    const hydeParkRow = lines[3];
    expect(hydeParkRow).toMatch(/,,/);
  });

  it('quotes fields containing commas', () => {
    const items: ExportListItem[] = [
      {
        name: 'Cafe, London',
        category: null,
        completed: false,
        visitedAt: null,
        notes: null,
        osm_id: 'node/1',
      },
    ];
    const csv = exportListToCsv(items, 'My List');
    expect(csv).toContain('"Cafe, London"');
  });

  it('escapes double quotes in field values', () => {
    const items: ExportListItem[] = [
      {
        name: 'The "Hidden" Bar',
        category: null,
        completed: false,
        visitedAt: null,
        notes: null,
        osm_id: 'node/2',
      },
    ];
    const csv = exportListToCsv(items, 'My List');
    expect(csv).toContain('"The ""Hidden"" Bar"');
  });

  it('quotes fields containing newlines', () => {
    const items: ExportListItem[] = [
      {
        name: 'Park',
        category: null,
        completed: false,
        visitedAt: null,
        notes: 'Line one\nLine two',
        osm_id: 'node/3',
      },
    ];
    const csv = exportListToCsv(items, 'My List');
    expect(csv).toContain('"Line one\nLine two"');
  });

  it('returns meta and header rows for an empty list', () => {
    const csv = exportListToCsv([], 'Empty');
    const lines = csv.split('\n');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toContain('Empty');
    expect(lines[1]).toBe('Name,Category,Status,Visited At,Notes,OpenStreetMap URL');
  });
});

describe('buildCsvFilename', () => {
  it('lowercases the list name', () => {
    expect(buildCsvFilename('My Museums')).toBe('london-list-my-museums.csv');
  });

  it('replaces spaces with hyphens', () => {
    expect(buildCsvFilename('Hidden Pubs')).toBe('london-list-hidden-pubs.csv');
  });

  it('collapses consecutive special characters into one hyphen', () => {
    expect(buildCsvFilename('Parks & Gardens!')).toBe('london-list-parks-gardens.csv');
  });

  it('trims leading and trailing hyphens', () => {
    expect(buildCsvFilename('!List!')).toBe('london-list-list.csv');
  });

  it('adds the .csv extension', () => {
    const filename = buildCsvFilename('Anything');
    expect(filename).toMatch(/\.csv$/);
  });
});
