import { SITE_URL, API_URL } from '../site';

describe('site constants', () => {
  it('SITE_URL falls back to the vercel URL', () => {
    expect(SITE_URL).toBe(process.env.NEXT_PUBLIC_SITE_URL || 'https://londonlist.vercel.app');
  });

  it('API_URL falls back to localhost', () => {
    expect(API_URL).toBe(process.env.STRAPI_URL || 'http://127.0.0.1:1337');
  });
});
