import { render, screen, fireEvent } from '@testing-library/react';
import MilestoneCelebration, { buildShareText } from '../../../components/milestone-celebration/milestone-celebration';

describe('MilestoneCelebration', () => {
  const defaultProps = {
    milestone: 50 as const,
    listName: 'My London List',
    onDismiss: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders 25% milestone copy', () => {
    render(<MilestoneCelebration {...defaultProps} milestone={25} />);
    expect(screen.getByText("You're a quarter of the way there!")).toBeInTheDocument();
  });

  it('renders 50% milestone copy', () => {
    render(<MilestoneCelebration {...defaultProps} milestone={50} />);
    expect(screen.getByText('Halfway through!')).toBeInTheDocument();
  });

  it('renders 75% milestone copy', () => {
    render(<MilestoneCelebration {...defaultProps} milestone={75} />);
    expect(screen.getByText('Three-quarters done!')).toBeInTheDocument();
  });

  it('renders 100% milestone copy', () => {
    render(<MilestoneCelebration {...defaultProps} milestone={100} />);
    expect(screen.getByText('You completed the list!')).toBeInTheDocument();
  });

  it('calls onDismiss when dismiss button is clicked', () => {
    const onDismiss = jest.fn();
    render(<MilestoneCelebration {...defaultProps} onDismiss={onDismiss} />);
    fireEvent.click(screen.getByRole('button', { name: 'Dismiss milestone celebration' }));
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('does not render share links when shareUrl is not provided', () => {
    render(<MilestoneCelebration {...defaultProps} />);
    expect(screen.queryByText('X / Twitter')).not.toBeInTheDocument();
    expect(screen.queryByText('WhatsApp')).not.toBeInTheDocument();
  });

  it('renders Twitter and WhatsApp share links when shareUrl is provided', () => {
    render(
      <MilestoneCelebration
        {...defaultProps}
        shareUrl="https://londonlist.co.uk/list/alice/abc123"
      />,
    );
    const twitterLink = screen.getByRole('link', { name: 'Share progress on X (Twitter)' });
    const whatsappLink = screen.getByRole('link', { name: 'Share progress on WhatsApp' });
    expect(twitterLink).toBeInTheDocument();
    expect(twitterLink).toHaveAttribute('href', expect.stringContaining('twitter.com'));
    expect(whatsappLink).toBeInTheDocument();
    expect(whatsappLink).toHaveAttribute('href', expect.stringContaining('wa.me'));
  });

  it('share links open in a new tab', () => {
    render(
      <MilestoneCelebration
        {...defaultProps}
        shareUrl="https://londonlist.co.uk/list/alice/abc123"
      />,
    );
    expect(screen.getByRole('link', { name: 'Share progress on X (Twitter)' })).toHaveAttribute(
      'target',
      '_blank',
    );
    expect(screen.getByRole('link', { name: 'Share progress on WhatsApp' })).toHaveAttribute(
      'target',
      '_blank',
    );
  });

  it('has the correct aria-label on the status container', () => {
    render(<MilestoneCelebration {...defaultProps} milestone={75} />);
    expect(screen.getByRole('status', { name: 'Milestone: 75% complete' })).toBeInTheDocument();
  });
});

describe('buildShareText', () => {
  it('builds a "50% through" message for partial milestones', () => {
    const text = buildShareText(50, 'My London List', 'https://londonlist.co.uk/list/alice/abc');
    expect(text).toBe(
      'I\'ve 50% through my "My London List" London list! https://londonlist.co.uk/list/alice/abc',
    );
  });

  it('builds a "completed" message for the 100% milestone', () => {
    const text = buildShareText(100, 'Museum Trail', 'https://londonlist.co.uk/list/bob/xyz');
    expect(text).toBe(
      'I\'ve completed my "Museum Trail" London list! https://londonlist.co.uk/list/bob/xyz',
    );
  });

  it('builds a "25% through" message', () => {
    const text = buildShareText(25, 'Hidden Gems', 'https://londonlist.co.uk/list/alice/abc');
    expect(text).toContain('25% through');
  });
});
