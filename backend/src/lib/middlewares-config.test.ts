const MIDDLEWARES_PATH = '../../config/middlewares';

describe('config/middlewares production FRONTEND_URL assertion', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalFrontendUrl = process.env.FRONTEND_URL;

  afterEach(() => {
    process.env.NODE_ENV = originalNodeEnv;
    process.env.FRONTEND_URL = originalFrontendUrl;
    jest.resetModules();
  });

  it('throws on load when NODE_ENV is production and FRONTEND_URL is unset', () => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';
    delete process.env.FRONTEND_URL;

    expect(() => require(MIDDLEWARES_PATH)).toThrow(/FRONTEND_URL must be set in production/);
  });

  it('loads successfully in production when FRONTEND_URL is set', () => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';
    process.env.FRONTEND_URL = 'https://londonlist.vercel.app';

    expect(() => require(MIDDLEWARES_PATH)).not.toThrow();
  });

  it('does not throw outside production when FRONTEND_URL is unset', () => {
    jest.resetModules();
    process.env.NODE_ENV = 'development';
    delete process.env.FRONTEND_URL;

    expect(() => require(MIDDLEWARES_PATH)).not.toThrow();
  });
});
