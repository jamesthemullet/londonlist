import { fireEvent, render, screen } from '@testing-library/react';
import UpgradeModal from '../../../components/upgrade-modal/upgrade-modal';

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

describe('UpgradeModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders nothing when isOpen is false', () => {
    const { container } = render(<UpgradeModal isOpen={false} onClose={onClose} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders the dialog when isOpen is true', () => {
    render(<UpgradeModal isOpen={true} onClose={onClose} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('renders the heading', () => {
    render(<UpgradeModal isOpen={true} onClose={onClose} />);
    expect(
      screen.getByRole('heading', { name: /you.ve hit the free limit/i }),
    ).toBeInTheDocument();
  });

  it('renders the Pro benefits list', () => {
    render(<UpgradeModal isOpen={true} onClose={onClose} />);
    expect(screen.getByText(/unlimited lists — no cap/i)).toBeInTheDocument();
    expect(screen.getByText(/view counts on all your public lists/i)).toBeInTheDocument();
  });

  it('renders the See Pro plans link pointing to /pricing', () => {
    render(<UpgradeModal isOpen={true} onClose={onClose} />);
    const link = screen.getByRole('link', { name: /see pro plans/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/pricing');
  });

  it('calls onClose when the close button is clicked', () => {
    render(<UpgradeModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /close upgrade modal/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when "Maybe later" is clicked', () => {
    render(<UpgradeModal isOpen={true} onClose={onClose} />);
    fireEvent.click(screen.getByRole('button', { name: /maybe later/i }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when the overlay is clicked', () => {
    render(<UpgradeModal isOpen={true} onClose={onClose} />);
    const overlay = screen.getByRole('dialog').parentElement as HTMLElement;
    fireEvent.click(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape is pressed', () => {
    render(<UpgradeModal isOpen={true} onClose={onClose} />);
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('dialog has aria-modal="true"', () => {
    render(<UpgradeModal isOpen={true} onClose={onClose} />);
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-modal', 'true');
  });

  it('renders the trial note', () => {
    render(<UpgradeModal isOpen={true} onClose={onClose} />);
    expect(screen.getByText(/14-day free trial/i)).toBeInTheDocument();
  });
});
