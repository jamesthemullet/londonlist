import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ShareButtons from '../../../components/share-buttons/share-buttons';

const props = {
  url: 'https://londonlist.co.uk/list/alice/abc123',
  title: 'My London List',
};

describe('ShareButtons', () => {
  it('renders the label', () => {
    render(<ShareButtons {...props} />);
    expect(screen.getByText('Share this list')).toBeInTheDocument();
  });

  it('renders the Copy link button', () => {
    render(<ShareButtons {...props} />);
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
  });

  it('renders all social share links', () => {
    render(<ShareButtons {...props} />);
    expect(screen.getByRole('link', { name: 'Share on X (Twitter)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Share on WhatsApp' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Share on Facebook' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Share on Pinterest' })).toBeInTheDocument();
  });

  it('social links open in a new tab', () => {
    render(<ShareButtons {...props} />);
    for (const name of [
      'Share on X (Twitter)',
      'Share on WhatsApp',
      'Share on Facebook',
      'Share on Pinterest',
    ]) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('target', '_blank');
    }
  });

  it('social links include the encoded URL', () => {
    render(<ShareButtons {...props} />);
    const encoded = encodeURIComponent(props.url);
    expect(screen.getByRole('link', { name: 'Share on X (Twitter)' })).toHaveAttribute(
      'href',
      expect.stringContaining(encoded),
    );
    expect(screen.getByRole('link', { name: 'Share on Facebook' })).toHaveAttribute(
      'href',
      expect.stringContaining(encoded),
    );
  });

  it('shows "Copied!" after clicking Copy link', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: jest.fn().mockResolvedValue(undefined) },
    });
    render(<ShareButtons {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    await waitFor(() => expect(screen.getByText('Copied!')).toBeInTheDocument());
  });

  it('writes the URL to the clipboard', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<ShareButtons {...props} />);
    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith(props.url));
  });
});
