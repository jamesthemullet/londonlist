import { render, screen } from '@testing-library/react';
import RelatedPlaces from '../../../components/related-places/related-places';
import type { PublicPlace } from '../../../lib/place';

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

const places: PublicPlace[] = [
  { osm_id: 'relation/123', name: 'Natural History Museum', category: 'museum', lat: 51.496, lng: -0.176 },
  { osm_id: 'node/456', name: 'Science Museum', category: 'museum', lat: 51.497, lng: -0.174 },
];

describe('RelatedPlaces', () => {
  it('renders nothing when there are no places', () => {
    const { container } = render(<RelatedPlaces places={[]} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders a heading and a link for each place', () => {
    render(<RelatedPlaces places={places} />);
    expect(screen.getByRole('heading', { name: 'You might also like' })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.getByText('Natural History Museum')).toBeInTheDocument();
    expect(screen.getByText('Science Museum')).toBeInTheDocument();
  });

  it('links each place to its own place detail page by osm_id', () => {
    render(<RelatedPlaces places={places} />);
    const link = screen.getByRole('link', { name: /Natural History Museum/ });
    expect(link).toHaveAttribute('href', '/place/relation/123');
  });

  it('shows the category for each place', () => {
    render(<RelatedPlaces places={places} />);
    expect(screen.getAllByText('museum')).toHaveLength(2);
  });

  it('omits the category badge when a place has no category', () => {
    const placesWithoutCategory: PublicPlace[] = [
      { osm_id: 'way/789', name: 'Mystery Spot', category: null, lat: null, lng: null },
    ];
    render(<RelatedPlaces places={placesWithoutCategory} />);
    expect(screen.getByText('Mystery Spot')).toBeInTheDocument();
    expect(screen.queryByText('museum')).not.toBeInTheDocument();
  });
});
