import SitemapPage, { getServerSideProps } from '../../pages/sitemap.xml';

const makeRes = () => ({
  setHeader: jest.fn(),
  write: jest.fn(),
  end: jest.fn(),
});

// biome-ignore lint/suspicious/noExplicitAny: minimal context mock for getServerSideProps
const makeCtx = (res: ReturnType<typeof makeRes>) => ({ res }) as any;

describe('SitemapPage', () => {
  it('renders null', () => {
    expect(SitemapPage()).toBeNull();
  });
});

describe('getServerSideProps', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('writes XML content type header', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const res = makeRes();
    await getServerSideProps(makeCtx(res));

    expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'text/xml; charset=utf-8');
  });

  it('writes Cache-Control header', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const res = makeRes();
    await getServerSideProps(makeCtx(res));

    expect(res.setHeader).toHaveBeenCalledWith(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400',
    );
  });

  it('calls res.end() to close the response', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const res = makeRes();
    await getServerSideProps(makeCtx(res));

    expect(res.end).toHaveBeenCalledTimes(1);
  });

  it('returns empty props object', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const res = makeRes();
    const result = await getServerSideProps(makeCtx(res));

    expect(result).toEqual({ props: {} });
  });

  it('writes valid XML including static pages', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    });

    const res = makeRes();
    await getServerSideProps(makeCtx(res));

    const xml: string = res.write.mock.calls[0][0];
    expect(xml).toContain('<?xml');
    expect(xml).toContain('<urlset');
    expect(xml).toContain('/explore');
  });

  it('includes public list URLs in the sitemap', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { documentId: 'abc123', username: 'alice' },
          { documentId: 'def456', username: 'bob' },
        ],
      }),
    });

    const res = makeRes();
    await getServerSideProps(makeCtx(res));

    const xml: string = res.write.mock.calls[0][0];
    expect(xml).toContain('alice');
    expect(xml).toContain('abc123');
    expect(xml).toContain('bob');
    expect(xml).toContain('def456');
  });

  it('serves static pages only when the backend is unreachable', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const res = makeRes();
    await getServerSideProps(makeCtx(res));

    expect(res.end).toHaveBeenCalledTimes(1);
    const xml: string = res.write.mock.calls[0][0];
    expect(xml).toContain('<?xml');
    expect(xml).not.toContain('alice');
  });

  it('serves static pages when the API returns a non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false });

    const res = makeRes();
    await getServerSideProps(makeCtx(res));

    expect(res.end).toHaveBeenCalledTimes(1);
    const xml: string = res.write.mock.calls[0][0];
    expect(xml).toContain('<?xml');
  });

  it('handles an ok response with no data array (empty sitemap)', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });

    const res = makeRes();
    await getServerSideProps(makeCtx(res));

    expect(res.end).toHaveBeenCalledTimes(1);
    const xml: string = res.write.mock.calls[0][0];
    expect(xml).toContain('<?xml');
  });

  it('omits lists with a null username from the sitemap', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: [
          { documentId: 'abc123', username: null },
          { documentId: 'def456', username: 'carol' },
        ],
      }),
    });

    const res = makeRes();
    await getServerSideProps(makeCtx(res));

    const xml: string = res.write.mock.calls[0][0];
    expect(xml).toContain('carol');
    expect(xml).not.toContain('abc123');
  });
});
