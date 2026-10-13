import { render, screen } from '@testing-library/react';
import AreaPage from '../../../pages/area/[area]';
import type { Place } from '../../../pages/area/[area]';

jest.mock('../../../context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

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

jest.mock('../../../components/booking-links/booking-links', () => ({
  __esModule: true,
  default: ({ name }: { name: string; category: string | null }) => (
    <div data-testid={`booking-links-${name}`} />
  ),
}));

import { useAppContext } from '../../../context/AppContext';
const mockUseAppContext = useAppContext as jest.Mock;

const BLOOMSBURY_PROPS = {
  areaSlug: 'bloomsbury',
  areaLabel: 'Bloomsbury',
  areaDescription: 'Museums, bookshops, and Georgian squares.',
};

const MUSEUM_PLACE: Place = {
  osm_id: 'relation/1525018',
  name: 'British Museum',
  category: 'museum',
  area: 'Bloomsbury',
  lat: 51.5194,
  lng: -0.127,
};

const PARK_PLACE: Place = {
  osm_id: 'way/123',
  name: 'Russell Square',
  category: 'park',
  area: 'Bloomsbury',
  lat: 51.523,
  lng: -0.124,
};

const NO_CATEGORY_PLACE: Place = {
  osm_id: 'node/999',
  name: 'Mystery Spot',
  category: null,
  area: null,
  lat: null,
  lng: null,
};

const mockUser = {
  id: '1',
  documentId: 'u1',
  email: 'alice@example.com',
  username: 'alice',
  isPro: false,
};

beforeEach(() => {
  mockUseAppContext.mockReturnValue({ user: mockUser, initialized: true, setUser: jest.fn() });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('AreaPage — page structure', () => {
  it('renders the area name in the h1 heading', () => {
    render(<AreaPage {...BLOOMSBURY_PROPS} places={[]} />);
    expect(screen.getByRole('heading', { level: 1, name: 'Places in Bloomsbury' })).toBeInTheDocument();
  });

  it('renders the area description in the subheading', () => {
    render(<AreaPage {...BLOOMSBURY_PROPS} places={[]} />);
    expect(screen.getByText('Museums, bookshops, and Georgian squares.')).toBeInTheDocument();
  });

  it('renders the breadcrumb with Explore and Browse by area links', () => {
    render(<AreaPage {...BLOOMSBURY_PROPS} places={[]} />);
    const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
    expect(breadcrumb).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore' })).toHaveAttribute('href', '/explore');
    expect(screen.getByRole('link', { name: 'Browse by area' })).toHaveAttribute('href', '/area');
  });

  it('renders the area label as the current page in breadcrumb', () => {
    render(<AreaPage {...BLOOMSBURY_PROPS} places={[]} />);
    expect(screen.getByText('Bloomsbury', { selector: '[aria-current="page"]' })).toBeInTheDocument();
  });

  it('renders navigation links back to areas list and explore', () => {
    render(<AreaPage {...BLOOMSBURY_PROPS} places={[]} />);
    expect(screen.getByRole('link', { name: /all london areas/i })).toHaveAttribute('href', '/area');
    expect(screen.getByRole('link', { name: /browse all public lists/i })).toHaveAttribute('href', '/explore');
  });
});

describe('AreaPage — empty state', () => {
  it('shows "No places saved" message when places is empty', () => {
    render(<AreaPage {...BLOOMSBURY_PROPS} places={[]} />);
    expect(screen.getByText(/no places saved in Bloomsbury yet/i)).toBeInTheDocument();
  });

  it('shows a registration CTA link in the empty state', () => {
    render(<AreaPage {...BLOOMSBURY_PROPS} places={[]} />);
    expect(screen.getByRole('link', { name: /be the first to add places here/i })).toBeInTheDocument();
  });

  it('does not render the place count paragraph when empty', () => {
    render(<AreaPage {...BLOOMSBURY_PROPS} places={[]} />);
    expect(screen.queryByText(/place(?:s)? in Bloomsbury/)).not.toBeInTheDocument();
  });
});

describe('AreaPage — populated state', () => {
  const places = [MUSEUM_PLACE, PARK_PLACE];

  it('shows the place count', () => {
    render(<AreaPage {...BLOOMSBURY_PROPS} places={places} />);
    expect(screen.getByText(/2 places in Bloomsbury/i)).toBeInTheDocument();
  });

  it('uses singular "place" when there is exactly one', () => {
    render(<AreaPage {...BLOOMSBURY_PROPS} places={[MUSEUM_PLACE]} />);
    expect(screen.getByText(/1 place in Bloomsbury/i)).toBeInTheDocument();
  });

  it('renders a section heading for each category', () => {
    render(<AreaPage {...BLOOMSBURY_PROPS} places={places} />);
    expect(screen.getByRole('heading', { name: /museum/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /park/i })).toBeInTheDocument();
  });

  it('renders place names as list items', () => {
    render(<AreaPage {...BLOOMSBURY_PROPS} places={places} />);
    expect(screen.getByText('British Museum')).toBeInTheDocument();
    expect(screen.getByText('Russell Square')).toBeInTheDocument();
  });

  it('renders BookingLinks for each place', () => {
    render(<AreaPage {...BLOOMSBURY_PROPS} places={places} />);
    expect(screen.getByTestId('booking-links-British Museum')).toBeInTheDocument();
    expect(screen.getByTestId('booking-links-Russell Square')).toBeInTheDocument();
  });

  it('puts null-category places under "Other" heading', () => {
    render(<AreaPage {...BLOOMSBURY_PROPS} places={[NO_CATEGORY_PLACE]} />);
    expect(screen.getByRole('heading', { name: /other/i })).toBeInTheDocument();
    expect(screen.getByText('Mystery Spot')).toBeInTheDocument();
  });

  it('does not show the empty state when places are present', () => {
    render(<AreaPage {...BLOOMSBURY_PROPS} places={places} />);
    expect(screen.queryByText(/no places saved/i)).not.toBeInTheDocument();
  });
});

describe('AreaPage — logged-out CTA banner', () => {
  it('shows the CTA for unauthenticated users', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true, setUser: jest.fn() });
    render(<AreaPage {...BLOOMSBURY_PROPS} places={[]} />);
    expect(screen.getByRole('link', { name: /add it to your london list/i })).toBeInTheDocument();
  });

  it('CTA link includes the area slug as ref parameter', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: true, setUser: jest.fn() });
    render(<AreaPage {...BLOOMSBURY_PROPS} places={[]} />);
    const link = screen.getByRole('link', { name: /add it to your london list/i });
    expect(link).toHaveAttribute('href', '/register?ref=area-bloomsbury');
  });

  it('does not show the CTA for authenticated users', () => {
    render(<AreaPage {...BLOOMSBURY_PROPS} places={[]} />);
    expect(screen.queryByRole('link', { name: /add it to your london list/i })).not.toBeInTheDocument();
  });

  it('does not show the CTA while context is uninitialised', () => {
    mockUseAppContext.mockReturnValue({ user: null, initialized: false, setUser: jest.fn() });
    render(<AreaPage {...BLOOMSBURY_PROPS} places={[]} />);
    expect(screen.queryByRole('link', { name: /add it to your london list/i })).not.toBeInTheDocument();
  });
});
