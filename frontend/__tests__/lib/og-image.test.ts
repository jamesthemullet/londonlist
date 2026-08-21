import { buildOgImageUrl } from '../../lib/og-image';

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
