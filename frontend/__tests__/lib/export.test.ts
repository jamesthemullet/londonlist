import { buildCsvContent, buildCsvFilename, downloadCsv, type ExportItem } from '../../lib/export';

const ITEMS: ExportItem[] = [
  { name: 'British Museum', category: 'museum', completed: false, visitedAt: null, notes: null },
  {
    name: 'Borough Market',
    category: 'market',
    completed: true,
    visitedAt: '2024-06-15T10:00:00.000Z',
    notes: 'Amazing food stalls',
  },
  {
    name: 'The Ritz, London',
    category: 'restaurant',
    completed: false,
    visitedAt: null,
    notes: 'Book well in advance',
  },
  {
    name: 'Café with "quotes"',
    category: 'cafe',
    completed: false,
    visitedAt: null,
    notes: null,
  },
  {
    name: 'Place with, comma',
    category: null,
    completed: false,
    visitedAt: null,
    notes: 'Note with, comma',
  },
];

describe('buildCsvContent', () => {
  it('produces a header row', () => {
    const csv = buildCsvContent([]);
    expect(csv).toBe('Name,Category,Status,Visited Date,Notes');
  });

  it('includes one data row per item', () => {
    const csv = buildCsvContent(ITEMS);
    const lines = csv.split('\n');
    expect(lines).toHaveLength(ITEMS.length + 1);
  });

  it('sets status to "To Do" for incomplete items', () => {
    const csv = buildCsvContent([ITEMS[0]]);
    const [, row] = csv.split('\n');
    expect(row).toContain('To Do');
  });

  it('sets status to "Done" for completed items', () => {
    const csv = buildCsvContent([ITEMS[1]]);
    const [, row] = csv.split('\n');
    expect(row).toContain('Done');
  });

  it('formats visitedAt as a date string', () => {
    const csv = buildCsvContent([ITEMS[1]]);
    const [, row] = csv.split('\n');
    expect(row).toContain('15/06/2024');
  });

  it('leaves visitedAt blank when null', () => {
    const csv = buildCsvContent([ITEMS[0]]);
    const [, row] = csv.split('\n');
    const fields = row.split(',');
    expect(fields[3]).toBe('');
  });

  it('includes notes when present', () => {
    const csv = buildCsvContent([ITEMS[1]]);
    expect(csv).toContain('Amazing food stalls');
  });

  it('leaves notes blank when null', () => {
    const csv = buildCsvContent([ITEMS[0]]);
    const [, row] = csv.split('\n');
    const fields = row.split(',');
    expect(fields[4]).toBe('');
  });

  it('leaves category blank when null', () => {
    const csv = buildCsvContent([ITEMS[4]]);
    const lines = csv.split('\n');
    expect(lines[1]).toContain('Place with');
  });

  it('wraps fields containing commas in quotes', () => {
    const csv = buildCsvContent([ITEMS[4]]);
    expect(csv).toContain('"Place with, comma"');
    expect(csv).toContain('"Note with, comma"');
  });

  it('wraps fields containing double-quotes and escapes them', () => {
    const csv = buildCsvContent([ITEMS[3]]);
    expect(csv).toContain('"Café with ""quotes"""');
  });

  it('handles empty item list', () => {
    const csv = buildCsvContent([]);
    expect(csv).toBe('Name,Category,Status,Visited Date,Notes');
  });
});

describe('buildCsvFilename', () => {
  it('converts spaces to hyphens', () => {
    expect(buildCsvFilename('My London List')).toBe('My-London-List.csv');
  });

  it('strips special characters', () => {
    expect(buildCsvFilename('List (2024)!')).toBe('List-2024.csv');
  });

  it('handles names with only alphanumerics', () => {
    expect(buildCsvFilename('Museums')).toBe('Museums.csv');
  });

  it('collapses multiple spaces into a single hyphen', () => {
    expect(buildCsvFilename('A  B')).toBe('A-B.csv');
  });

  it('trims leading and trailing whitespace', () => {
    expect(buildCsvFilename('  My List  ')).toBe('My-List.csv');
  });
});

describe('downloadCsv', () => {
  let createObjectURLSpy: jest.SpyInstance;
  let revokeObjectURLSpy: jest.SpyInstance;
  let appendChildSpy: jest.SpyInstance;
  let removeChildSpy: jest.SpyInstance;
  let clickSpy: jest.Mock;

  beforeEach(() => {
    // JSDOM does not implement URL.createObjectURL, so we assign a stub first
    URL.createObjectURL = jest.fn();
    URL.revokeObjectURL = jest.fn();
    createObjectURLSpy = jest.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    revokeObjectURLSpy = jest.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
    clickSpy = jest.fn();

    const mockLink = {
      href: '',
      download: '',
      click: clickSpy,
    };

    jest.spyOn(document, 'createElement').mockReturnValue(mockLink as unknown as HTMLElement);
    appendChildSpy = jest.spyOn(document.body, 'appendChild').mockReturnValue(mockLink as unknown as Node);
    removeChildSpy = jest.spyOn(document.body, 'removeChild').mockReturnValue(mockLink as unknown as Node);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('creates an object URL from a Blob', () => {
    downloadCsv('Name,Category', 'test.csv');
    expect(createObjectURLSpy).toHaveBeenCalledWith(expect.any(Blob));
  });

  it('clicks the anchor element to trigger download', () => {
    downloadCsv('Name,Category', 'test.csv');
    expect(clickSpy).toHaveBeenCalled();
  });

  it('revokes the object URL after clicking', () => {
    downloadCsv('Name,Category', 'test.csv');
    expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');
  });

  it('appends and removes the link from the DOM', () => {
    downloadCsv('Name,Category', 'test.csv');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });
});
