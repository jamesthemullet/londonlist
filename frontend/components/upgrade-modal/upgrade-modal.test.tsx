import { fireEvent, render, screen } from '@testing-library/react';
import UpgradeModal from './upgrade-modal';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

describe('UpgradeModal — rendering', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(<UpgradeModal isOpen={false} onClose={jest.fn()} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the dialog when isOpen is true', () => {
    render(<UpgradeModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders the heading', () => {
    render(<UpgradeModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByRole('heading', { level: 2 })).toHaveTextContent(/you.ve hit the free limit/i);
  });

  it('renders the subheading with limit explanation', () => {
    render(<UpgradeModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText(/free accounts can hold up to 3 lists/i)).toBeInTheDocument();
  });

  it('renders all Pro benefits', () => {
    render(<UpgradeModal isOpen={true} onClose={jest.fn()} />);
    const items = screen.getAllByRole('listitem');
    const allText = items.map((i) => i.textContent ?? '').join('\n');
    expect(allText).toMatch(/unlimited lists/i);
    expect(allText).toMatch(/view counts/i);
    expect(allText).toMatch(/early access/i);
    expect(allText).toMatch(/priority support/i);
  });

  it('renders the "See Pro plans" CTA linking to /pricing', () => {
    render(<UpgradeModal isOpen={true} onClose={jest.fn()} />);
    const cta = screen.getByRole('link', { name: /see pro plans/i });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute('href', '/pricing');
  });

  it('renders the "Maybe later" dismiss button', () => {
    render(<UpgradeModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByRole('button', { name: /maybe later/i })).toBeInTheDocument();
  });

  it('renders the close button with accessible label', () => {
    render(<UpgradeModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByRole('button', { name: /close upgrade modal/i })).toBeInTheDocument();
  });

  it('renders the trial note', () => {
    render(<UpgradeModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText(/14-day free trial/i)).toBeInTheDocument();
  });

  it('renders a Pro badge', () => {
    render(<UpgradeModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByText(/^pro$/i)).toBeInTheDocument();
  });
});

describe('UpgradeModal — accessibility', () => {
  it('has role="dialog" on the modal panel', () => {
    render(<UpgradeModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('has aria-modal="true" on the dialog', () => {
    render(<UpgradeModal isOpen={true} onClose={jest.fn()} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('labels the dialog with the heading via aria-labelledby', () => {
    render(<UpgradeModal isOpen={true} onClose={jest.fn()} />);
    const dialog = screen.getByRole('dialog');
    const labelledById = dialog.getAttribute('aria-labelledby');
    expect(labelledById).toBeTruthy();
    expect(document.getElementById(labelledById ?? '')).toBeInTheDocument();
  });

  it('marks check icons as aria-hidden', () => {
    const { container } = render(<UpgradeModal isOpen={true} onClose={jest.fn()} />);
    const hiddenIcons = container.querySelectorAll('[aria-hidden="true"]');
    expect(hiddenIcons.length).toBeGreaterThan(0);
  });
});

describe('UpgradeModal — interactions', () => {
  it('calls onClose when the close button is clicked', () => {
    const onClose = jest.fn();
    render(<UpgradeModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close upgrade modal/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when "Maybe later" is clicked', () => {
    const onClose = jest.fn();
    render(<UpgradeModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /maybe later/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when clicking the overlay background', () => {
    const onClose = jest.fn();
    render(<UpgradeModal isOpen={true} onClose={onClose} />);
    const dialog = screen.getByRole('dialog');
    const overlay = dialog.parentElement as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when clicking inside the dialog', () => {
    const onClose = jest.fn();
    render(<UpgradeModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when Escape key is pressed', () => {
    const onClose = jest.fn();
    render(<UpgradeModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose for non-Escape key presses', () => {
    const onClose = jest.fn();
    render(<UpgradeModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Enter' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose when Escape is pressed inside the dialog (keydown does not bubble to document)', () => {
    const onClose = jest.fn();
    render(<UpgradeModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('calls onClose when the "See Pro plans" link is clicked', () => {
    const onClose = jest.fn();
    render(<UpgradeModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole('link', { name: /see pro plans/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe('UpgradeModal — open/closed transitions', () => {
  it('does not register keyboard listeners when closed', () => {
    const onClose = jest.fn();
    render(<UpgradeModal isOpen={false} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('removes keyboard listener after being closed', () => {
    const onClose = jest.fn();
    const { rerender } = render(<UpgradeModal isOpen={true} onClose={onClose} />);
    rerender(<UpgradeModal isOpen={false} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).not.toHaveBeenCalled();
  });
});
