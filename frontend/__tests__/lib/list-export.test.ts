import { buildCsvRows, sanitizeFilename } from '../../lib/list-export';

const item = (overrides = {}) => ({
  name: 'British Museum',
  category: 'museum',
  completed: false,
  visitedAt: null,
  notes: null,
  ...overrides,
});

describe('buildCsvRows', () => {
  it('returns header row plus one data row', () => {
    const csv = buildCsvRows([item()]);
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Name,Category,Completed,Visited At,Notes');
    expect(lines[1]).toBe('British Museum,museum,No,,');
  });

  it('marks completed items as Yes with visited date', () => {
    const csv = buildCsvRows([item({ completed: true, visitedAt: '2024-03-15T10:00:00.000Z' })]);
    const [, row] = csv.split('\n');
    expect(row).toContain('Yes');
    expect(row).toContain('15/03/2024');
  });

  it('includes notes when present', () => {
    const csv = buildCsvRows([item({ notes: 'Great hall is unmissable' })]);
    const [, row] = csv.split('\n');
    expect(row).toContain('Great hall is unmissable');
  });

  it('wraps fields containing commas in double quotes', () => {
    const csv = buildCsvRows([item({ name: 'Borough, South London' })]);
    const [, row] = csv.split('\n');
    expect(row).toContain('"Borough, South London"');
  });

  it('escapes double quotes inside fields', () => {
    const csv = buildCsvRows([item({ notes: 'He said "go early"' })]);
    const [, row] = csv.split('\n');
    expect(row).toContain('"He said ""go early"""');
  });

  it('handles null category gracefully', () => {
    const csv = buildCsvRows([item({ category: null })]);
    const [, row] = csv.split('\n');
    expect(row).toBe('British Museum,,No,,');
  });

  it('wraps fields containing newlines in double quotes', () => {
    const csv = buildCsvRows([item({ notes: 'Line one\nLine two' })]);
    const [, row] = csv.split('\n');
    expect(row).toContain('"Line one');
  });

  it('returns header only when items list is empty', () => {
    const csv = buildCsvRows([]);
    expect(csv).toBe('Name,Category,Completed,Visited At,Notes');
  });

  it('handles multiple items', () => {
    const csv = buildCsvRows([item(), item({ name: 'Hyde Park', category: 'park' })]);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(3);
    expect(lines[2]).toContain('Hyde Park');
  });
});

describe('sanitizeFilename', () => {
  it('lowercases and replaces spaces with hyphens', () => {
    expect(sanitizeFilename('My London List')).toBe('my-london-list');
  });

  it('strips special characters', () => {
    expect(sanitizeFilename('List: Summer & Winter!')).toBe('list-summer-winter');
  });

  it('collapses multiple spaces', () => {
    expect(sanitizeFilename('a  b  c')).toBe('a-b-c');
  });

  it('falls back to "list" for empty string after stripping', () => {
    expect(sanitizeFilename('!!!!')).toBe('list');
  });
});
