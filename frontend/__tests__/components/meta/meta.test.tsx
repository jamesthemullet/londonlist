import { render } from '@testing-library/react';
import Meta from '../../../components/meta/meta';

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

function q(selector: string) {
  return document.querySelector(selector);
}

afterEach(() => {
  // Clean up head injections between tests
  document.head.innerHTML = '';
});

describe('Meta component', () => {
  it('renders a title element', () => {
    render(<Meta currentUrl="/explore" />);
    const title = q('title') ?? document.head.querySelector('title');
    expect(title).not.toBeNull();
  });

  it('renders only one title element', () => {
    render(<Meta currentUrl="/" />);
    // document.querySelectorAll searches the entire document (head + body)
    const titles = document.querySelectorAll('title');
    expect(titles.length).toBe(1);
  });

  it('sets og:url using the currentUrl prop — not [object Object]', () => {
    render(<Meta currentUrl="/explore" />);
    const ogUrl =
      q('meta[property="og:url"]') ?? document.head.querySelector('meta[property="og:url"]');
    const content = ogUrl?.getAttribute('content') ?? '';
    expect(content).toContain('/explore');
    expect(content).not.toContain('[object Object]');
  });

  it('sets og:url for the root path', () => {
    render(<Meta currentUrl="/" />);
    const ogUrl =
      q('meta[property="og:url"]') ?? document.head.querySelector('meta[property="og:url"]');
    const content = ogUrl?.getAttribute('content') ?? '';
    expect(content).toBe('https://londonlist.co.uk/');
  });

  it('uses an absolute URL for the OG image', () => {
    render(<Meta currentUrl="/" />);
    const ogImage =
      q('meta[property="og:image"]') ?? document.head.querySelector('meta[property="og:image"]');
    const content = ogImage?.getAttribute('content') ?? '';
    expect(content).toMatch(/^https?:\/\//);
  });

  it('renders a description meta tag with correct text', () => {
    render(<Meta currentUrl="/" />);
    const desc =
      q('meta[name="description"]') ?? document.head.querySelector('meta[name="description"]');
    const content = desc?.getAttribute('content') ?? '';
    expect(content).toContain('London');
    expect(content).not.toMatch(/Londo[^n]/);
  });

  it('sets og:site_name to London List', () => {
    render(<Meta currentUrl="/" />);
    const siteName =
      q('meta[property="og:site_name"]') ??
      document.head.querySelector('meta[property="og:site_name"]');
    expect(siteName?.getAttribute('content')).toBe('London List');
  });
});
