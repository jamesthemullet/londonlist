import { buildOgImageUrl, buildOgMeta, ogTitleFontSize, truncateOgTitle } from '../../lib/og-image';

const SITE = 'https://londonlist.co.uk';

describe('buildOgImageUrl', () => {
  it('points to /api/og on the given site URL', () => {
    const url = buildOgImageUrl({ title: 'My List' }, SITE);
    expect(url).toMatch(/^https:\/\/londonlist\.co\.uk\/api\/og\?/);
  });

  it('includes the title param', () => {
    const url = buildOgImageUrl({ title: 'Weekend Wanders' }, SITE);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('title')).toBe('Weekend Wanders');
  });

  it('includes the username when provided', () => {
    const url = buildOgImageUrl({ title: 'My List', username: 'alice' }, SITE);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('u')).toBe('alice');
  });

  it('omits the username param when not provided', () => {
    const url = buildOgImageUrl({ title: 'My List' }, SITE);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('u')).toBeNull();
  });

  it('includes the item count when provided', () => {
    const url = buildOgImageUrl({ title: 'My List', itemCount: 12 }, SITE);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('n')).toBe('12');
  });

  it('omits item count when not provided', () => {
    const url = buildOgImageUrl({ title: 'My List' }, SITE);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('n')).toBeNull();
  });

  it('includes the done count when provided', () => {
    const url = buildOgImageUrl({ title: 'My List', itemCount: 5, doneCount: 3 }, SITE);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('d')).toBe('3');
  });

  it('omits done count when not provided', () => {
    const url = buildOgImageUrl({ title: 'My List', itemCount: 5 }, SITE);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('d')).toBeNull();
  });

  it('URL-encodes special characters in the title', () => {
    const url = buildOgImageUrl({ title: "Alice's List & More" }, SITE);
    expect(() => new URL(url)).not.toThrow();
    const parsed = new URL(url);
    expect(parsed.searchParams.get('title')).toBe("Alice's List & More");
  });

  it('works correctly with a zero item count', () => {
    const url = buildOgImageUrl({ title: 'Empty', itemCount: 0, doneCount: 0 }, SITE);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('n')).toBe('0');
    expect(parsed.searchParams.get('d')).toBe('0');
  });

  it('produces a valid absolute URL', () => {
    const url = buildOgImageUrl(
      { title: 'Hidden Gems', username: 'bob', itemCount: 8, doneCount: 2 },
      SITE,
    );
    expect(() => new URL(url)).not.toThrow();
  });

  it('uses the provided siteUrl as the base', () => {
    const url = buildOgImageUrl({ title: 'Test' }, 'https://staging.londonlist.co.uk');
    expect(url).toMatch(/^https:\/\/staging\.londonlist\.co\.uk\/api\/og\?/);
  });

  it('handles titles with spaces correctly', () => {
    const url = buildOgImageUrl({ title: 'East London Markets' }, SITE);
    const parsed = new URL(url);
    expect(parsed.searchParams.get('title')).toBe('East London Markets');
  });
});

describe('truncateOgTitle', () => {
  it('leaves short titles unchanged', () => {
    expect(truncateOgTitle('My List')).toBe('My List');
  });

  it('truncates to 80 characters by default', () => {
    const long = 'a'.repeat(100);
    expect(truncateOgTitle(long)).toHaveLength(80);
  });

  it('respects a custom max length', () => {
    expect(truncateOgTitle('Weekend Wanders', 7)).toBe('Weekend');
  });
});

describe('ogTitleFontSize', () => {
  it('returns 72 for short titles', () => {
    expect(ogTitleFontSize('My List')).toBe(72);
  });

  it('returns 62 for medium titles (31-50 chars)', () => {
    expect(ogTitleFontSize('a'.repeat(35))).toBe(62);
  });

  it('returns 52 for long titles (over 50 chars)', () => {
    expect(ogTitleFontSize('a'.repeat(60))).toBe(52);
  });

  it('is at the 30/50 boundary correctly', () => {
    expect(ogTitleFontSize('a'.repeat(30))).toBe(72);
    expect(ogTitleFontSize('a'.repeat(50))).toBe(62);
  });
});

describe('buildOgMeta', () => {
  it('returns an empty string when there are no items', () => {
    expect(buildOgMeta(0, 0)).toBe('');
  });

  it('pluralises "place" for a single item', () => {
    expect(buildOgMeta(1, 0)).toBe('1 place');
  });

  it('pluralises "places" for multiple items', () => {
    expect(buildOgMeta(5, 0)).toBe('5 places');
  });

  it('appends the visited count when present', () => {
    expect(buildOgMeta(5, 3)).toBe('5 places · 3 visited');
  });

  it('omits the visited count when zero', () => {
    expect(buildOgMeta(5, 0)).toBe('5 places');
  });
});
