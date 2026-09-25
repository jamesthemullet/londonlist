import { buildCsvContent, sanitizeFilename, type ExportableListItem } from '../../lib/export-list';

const ITEMS: ExportableListItem[] = [
  { name: 'British Museum', category: 'museum', completed: true, visitedAt: '2024-06-15T12:00:00Z', notes: 'Free entry' },
  { name: 'Dishoom, Covent Garden', category: 'restaurant', completed: false, visitedAt: null, notes: null },
  { name: 'Hyde Park', category: 'park', completed: false, visitedAt: null, notes: 'Great for picnics\nand sunsets' },
  { name: 'Say "hello, world"', category: null, completed: true, visitedAt: '2024-07-01T00:00:00Z', notes: null },
];

describe('buildCsvContent', () => {
  it('includes a comment row with the list name as the first line', () => {
    const csv = buildCsvContent(ITEMS, 'My London List');
    expect(csv.split('\n')[0]).toBe('# My London List');
  });

  it('includes a header row as the second line', () => {
    const csv = buildCsvContent(ITEMS, 'Test');
    expect(csv.split('\n')[1]).toBe('Name,Category,Status,Visited On,Notes');
  });

  it('outputs Done for completed items', () => {
    const csv = buildCsvContent(ITEMS, 'Test');
    const rows = csv.split('\n');
    expect(rows[2]).toContain('Done');
  });

  it('outputs To Do for incomplete items', () => {
    const csv = buildCsvContent(ITEMS, 'Test');
    const rows = csv.split('\n');
    expect(rows[3]).toContain('To Do');
  });

  it('formats visitedAt as a UK date string', () => {
    const csv = buildCsvContent(ITEMS, 'Test');
    expect(csv).toContain('15/06/2024');
  });

  it('leaves Visited On blank when visitedAt is null', () => {
    const csv = buildCsvContent(ITEMS, 'Test');
    const rows = csv.split('\n');
    expect(rows[3]).toMatch(/To Do,,/);
  });

  it('quotes fields containing commas', () => {
    const csv = buildCsvContent(ITEMS, 'Test');
    expect(csv).toContain('"Dishoom, Covent Garden"');
  });

  it('quotes fields containing double-quotes and escapes them', () => {
    const csv = buildCsvContent(ITEMS, 'Test');
    expect(csv).toContain('"Say ""hello, world"""');
  });

  it('quotes fields containing newlines', () => {
    const csv = buildCsvContent(ITEMS, 'Test');
    expect(csv).toContain('"Great for picnics\nand sunsets"');
  });

  it('leaves category blank when null', () => {
    const csv = buildCsvContent(ITEMS, 'Test');
    const sayHelloRow = csv.split('\n').find((r) => r.includes('hello'));
    expect(sayHelloRow).toBeDefined();
    expect(sayHelloRow).toMatch(/^"Say ""hello, world""",/);
  });

  it('returns only header rows for an empty item list', () => {
    const csv = buildCsvContent([], 'Empty');
    expect(csv.split('\n')).toHaveLength(2);
  });

  it('includes notes when present', () => {
    const csv = buildCsvContent(ITEMS, 'Test');
    expect(csv).toContain('Free entry');
  });
});

describe('sanitizeFilename', () => {
  it('lowercases the name', () => {
    expect(sanitizeFilename('My List')).toBe('my-list');
  });

  it('replaces spaces with hyphens', () => {
    expect(sanitizeFilename('weekend museums')).toBe('weekend-museums');
  });

  it('removes special characters', () => {
    expect(sanitizeFilename("Alice's List!")).toBe('alice-s-list-');
  });

  it('collapses consecutive hyphens', () => {
    expect(sanitizeFilename('A  B')).toBe('a-b');
  });

  it('preserves hyphens and underscores', () => {
    expect(sanitizeFilename('my-list_2024')).toBe('my-list_2024');
  });
});
