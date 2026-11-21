import { getSafeNext } from '../../lib/nav';

describe('getSafeNext', () => {
  it('returns a safe relative path', () => {
    expect(getSafeNext({ next: '/account' })).toBe('/account');
  });

  it('returns null when next is absent', () => {
    expect(getSafeNext({})).toBeNull();
  });

  it('returns null when next is an array', () => {
    expect(getSafeNext({ next: ['/account', '/my-list'] })).toBeNull();
  });

  it('returns null for an absolute URL', () => {
    expect(getSafeNext({ next: 'https://evil.com' })).toBeNull();
  });

  it('returns null for a protocol-relative URL', () => {
    expect(getSafeNext({ next: '//evil.com' })).toBeNull();
  });

  it('allows nested paths', () => {
    expect(getSafeNext({ next: '/list/alice/abc123' })).toBe('/list/alice/abc123');
  });
});
