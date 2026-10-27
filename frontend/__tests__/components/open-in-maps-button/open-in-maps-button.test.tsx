import { render, screen } from '@testing-library/react';
import OpenInMapsButton from '../../../components/open-in-maps-button/open-in-maps-button';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

const ONE_PLACE = [{ lat: 51.5, lng: -0.1 }];
const TWO_PLACES = [
  { lat: 51.5, lng: -0.1 },
  { lat: 51.51, lng: -0.08 },
];
const FOUR_PLACES = [
  { lat: 51.5, lng: -0.1 },
  { lat: 51.51, lng: -0.08 },
  { lat: 51.52, lng: -0.05 },
  { lat: 51.53, lng: -0.02 },
];

describe('OpenInMapsButton', () => {
  it('renders nothing when no places are supplied', () => {
    const { container } = render(<OpenInMapsButton places={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders a Google Maps link for one place', () => {
    render(<OpenInMapsButton places={ONE_PLACE} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('google.com/maps/search'));
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders a directions link for multiple places', () => {
    render(<OpenInMapsButton places={TWO_PLACES} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', expect.stringContaining('google.com/maps/dir'));
  });

  it('shows no upgrade message when isPro is false and places ≤ FREE_ROUTE_LIMIT', () => {
    render(<OpenInMapsButton places={TWO_PLACES} isPro={false} />);
    expect(screen.queryByText(/upgrade to pro/i)).not.toBeInTheDocument();
  });

  it('shows upgrade message when isPro is false and places > FREE_ROUTE_LIMIT', () => {
    render(<OpenInMapsButton places={FOUR_PLACES} isPro={false} />);
    expect(screen.getByText(/upgrade to pro/i)).toBeInTheDocument();
  });

  it('does not show upgrade message when isPro is true and places > FREE_ROUTE_LIMIT', () => {
    render(<OpenInMapsButton places={FOUR_PLACES} isPro={true} />);
    expect(screen.queryByText(/upgrade to pro/i)).not.toBeInTheDocument();
  });

  it('caps route at 3 places for free users', () => {
    render(<OpenInMapsButton places={FOUR_PLACES} isPro={false} />);
    const link = screen.getByRole('link', { name: /plan a route/i });
    expect(link).toHaveAttribute('aria-label', expect.stringContaining('3 places'));
  });

  it('shows all 4 places for Pro users when ≤ PRO_ROUTE_LIMIT', () => {
    render(<OpenInMapsButton places={FOUR_PLACES} isPro={true} />);
    const link = screen.getByRole('link', { name: /plan a route/i });
    expect(link).toHaveAttribute('aria-label', expect.stringContaining('4 places'));
  });

  it('shows the limit note in the button when capped', () => {
    render(<OpenInMapsButton places={FOUR_PLACES} isPro={false} />);
    expect(screen.getByText(/3 of 4 places/i)).toBeInTheDocument();
  });
});
