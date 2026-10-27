import { render, screen } from '@testing-library/react';
import OpenInMapsButton from '../../../components/open-in-maps-button/open-in-maps-button';

const ONE_PLACE = [{ lat: 51.5, lng: -0.1 }];
const TWO_PLACES = [
  { lat: 51.5, lng: -0.1 },
  { lat: 51.51, lng: -0.08 },
];
const makePlaces = (n: number) =>
  Array.from({ length: n }, (_, i) => ({ lat: 51.5 + i * 0.01, lng: -0.1 }));

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

  it('includes every place up to the Google Maps limit', () => {
    render(<OpenInMapsButton places={makePlaces(10)} />);
    const link = screen.getByRole('link', { name: /plan a route/i });
    expect(link).toHaveAttribute('aria-label', expect.stringContaining('10 places'));
    expect(screen.queryByText(/of 10 places/i)).not.toBeInTheDocument();
  });

  it('caps the route at the Google Maps limit and says so', () => {
    render(<OpenInMapsButton places={makePlaces(12)} />);
    const link = screen.getByRole('link', { name: /plan a route/i });
    expect(link).toHaveAttribute('aria-label', expect.stringContaining('10 places'));
    expect(screen.getByText(/10 of 12 places/i)).toBeInTheDocument();
  });

  it('never shows an upgrade prompt', () => {
    render(<OpenInMapsButton places={makePlaces(12)} />);
    expect(screen.queryByText(/upgrade to pro/i)).not.toBeInTheDocument();
  });
});
