import { render, screen, fireEvent, act } from '@testing-library/react';
import ShareButtons from './share-buttons';

const TEST_URL = 'https://londonlist.vercel.app/list/alice/doc-123';
const TEST_TITLE = "Alice's Weekend Wanders";

beforeEach(() => {
  Object.assign(navigator, {
    clipboard: {
      writeText: jest.fn().mockResolvedValue(undefined),
    },
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('ShareButtons', () => {
  it('renders the "Share this list" label', () => {
    render(<ShareButtons url={TEST_URL} title={TEST_TITLE} />);
    expect(screen.getByText('Share this list')).toBeInTheDocument();
  });

  it('renders a Copy link button', () => {
    render(<ShareButtons url={TEST_URL} title={TEST_TITLE} />);
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
  });

  it('renders a Share on X link pointing to twitter.com intent', () => {
    render(<ShareButtons url={TEST_URL} title={TEST_TITLE} />);
    const xLink = screen.getByRole('link', { name: /share on x/i });
    expect(xLink).toHaveAttribute('href', expect.stringContaining('twitter.com/intent/tweet'));
    expect(xLink).toHaveAttribute('href', expect.stringContaining(encodeURIComponent(TEST_URL)));
  });

  it('renders a WhatsApp share link', () => {
    render(<ShareButtons url={TEST_URL} title={TEST_TITLE} />);
    const waLink = screen.getByRole('link', { name: /whatsapp/i });
    expect(waLink).toHaveAttribute('href', expect.stringContaining('wa.me'));
    expect(waLink).toHaveAttribute('href', expect.stringContaining(encodeURIComponent(TEST_URL)));
  });

  it('social links open in a new tab with noopener', () => {
    render(<ShareButtons url={TEST_URL} title={TEST_TITLE} />);
    const links = screen.getAllByRole('link');
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('copies the URL to clipboard when Copy link is clicked', async () => {
    render(<ShareButtons url={TEST_URL} title={TEST_TITLE} />);
    const copyBtn = screen.getByRole('button', { name: 'Copy link' });

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(TEST_URL);
  });

  it('shows "Copied!" feedback after clicking the copy button', async () => {
    render(<ShareButtons url={TEST_URL} title={TEST_TITLE} />);
    const copyBtn = screen.getByRole('button', { name: 'Copy link' });

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(screen.getByRole('button', { name: /copied/i })).toBeInTheDocument();
  });

  it('reverts button text after 2 seconds', async () => {
    jest.useFakeTimers();
    render(<ShareButtons url={TEST_URL} title={TEST_TITLE} />);
    const copyBtn = screen.getByRole('button', { name: 'Copy link' });

    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(screen.getByText('Copied!')).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(2100);
    });

    expect(screen.getByText('Copy link')).toBeInTheDocument();
    jest.useRealTimers();
  });

  it('encodes the title in the Twitter share URL', () => {
    render(<ShareButtons url={TEST_URL} title={TEST_TITLE} />);
    const xLink = screen.getByRole('link', { name: /share on x/i });
    expect(xLink).toHaveAttribute('href', expect.stringContaining(encodeURIComponent(TEST_TITLE)));
  });

  it('includes both title and URL in the WhatsApp share text', () => {
    render(<ShareButtons url={TEST_URL} title={TEST_TITLE} />);
    const waLink = screen.getByRole('link', { name: /whatsapp/i });
    const href = waLink.getAttribute('href') ?? '';
    const decoded = decodeURIComponent(href);
    expect(decoded).toContain(TEST_TITLE);
    expect(decoded).toContain(TEST_URL);
  });
});
