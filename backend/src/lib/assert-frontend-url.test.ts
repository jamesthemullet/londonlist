import { assertFrontendUrlConfigured } from './assert-frontend-url';

describe('assertFrontendUrlConfigured', () => {
  it('throws in production when FRONTEND_URL is unset', () => {
    expect(() => assertFrontendUrlConfigured({ NODE_ENV: 'production' })).toThrow(
      /FRONTEND_URL environment variable must be set in production/,
    );
  });

  it('does not throw in production when FRONTEND_URL is set', () => {
    expect(() =>
      assertFrontendUrlConfigured({ NODE_ENV: 'production', FRONTEND_URL: 'https://londonlist.co.uk' }),
    ).not.toThrow();
  });

  it('does not throw outside production even when FRONTEND_URL is unset', () => {
    expect(() => assertFrontendUrlConfigured({ NODE_ENV: 'development' })).not.toThrow();
    expect(() => assertFrontendUrlConfigured({})).not.toThrow();
  });
});
