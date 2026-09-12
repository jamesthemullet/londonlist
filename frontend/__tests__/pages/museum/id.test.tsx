import { render, screen } from '@testing-library/react';
import { useQuery } from '@apollo/client/react';
import { useRouter } from 'next/router';
import Museum, { buildMuseumJsonLd } from '../../../pages/museum/[id]';

jest.mock('@apollo/client', () => ({
  gql: (strings: TemplateStringsArray) => strings,
}));

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('../../../components/Loader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}));

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockUseQuery = useQuery as unknown as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

beforeEach(() => {
  mockUseRouter.mockReturnValue({ query: { id: '42' } });
  mockUseQuery.mockReturnValue({ loading: false, error: null, data: null });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('Museum page — loading state', () => {
  it('renders Loader when museumId is not yet in the route', () => {
    mockUseRouter.mockReturnValue({ query: {} });
    render(<Museum />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('renders Loader while the query is in flight', () => {
    mockUseQuery.mockReturnValue({ loading: true, error: null, data: null });
    render(<Museum />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });
});

describe('Museum page — error state', () => {
  it('shows "Museum not found" heading when the query errors', () => {
    mockUseQuery.mockReturnValue({ loading: false, error: new Error('Network error'), data: null });
    render(<Museum />);
    expect(screen.getByRole('heading', { name: 'Museum not found' })).toBeInTheDocument();
  });

  it('shows an explanatory message alongside the error heading', () => {
    mockUseQuery.mockReturnValue({ loading: false, error: new Error('error'), data: null });
    render(<Museum />);
    expect(screen.getByText(/couldn't load this museum's exhibitions/i)).toBeInTheDocument();
  });

  it('renders a link back to the Explore page on error', () => {
    mockUseQuery.mockReturnValue({ loading: false, error: new Error('error'), data: null });
    render(<Museum />);
    const link = screen.getByRole('link', { name: /back to explore/i });
    expect(link).toHaveAttribute('href', '/explore');
  });

  it('shows "Museum not found" when museum data is null (API returned no match)', () => {
    mockUseQuery.mockReturnValue({
      loading: false,
      error: null,
      data: { museum: { data: null } },
    });
    render(<Museum />);
    expect(screen.getByRole('heading', { name: 'Museum not found' })).toBeInTheDocument();
  });
});

describe('Museum page — success state', () => {
  const MUSEUM_DATA = {
    museum: {
      data: {
        id: '42',
        attributes: {
          name: 'British Museum',
          exhibitions: {
            data: [
              {
                id: 'ex-1',
                attributes: {
                  name: 'Ancient Egypt',
                  description: 'A journey through ancient Egyptian civilisation.',
                  startdate: '2026-01-01',
                  enddate: '2026-12-31',
                },
              },
              {
                id: 'ex-2',
                attributes: {
                  name: 'Modern Art',
                  description: 'Contemporary artists of the 21st century.',
                  startdate: '2026-03-01',
                  enddate: '2026-09-30',
                },
              },
            ],
          },
        },
      },
    },
  };

  beforeEach(() => {
    mockUseQuery.mockReturnValue({ loading: false, error: null, data: MUSEUM_DATA });
  });

  it('renders the museum name as the page h1', () => {
    render(<Museum />);
    expect(screen.getByRole('heading', { level: 1, name: 'British Museum' })).toBeInTheDocument();
  });

  it('renders each exhibition name as a heading', () => {
    render(<Museum />);
    expect(screen.getByRole('heading', { name: 'Ancient Egypt' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Modern Art' })).toBeInTheDocument();
  });

  it('renders each exhibition description', () => {
    render(<Museum />);
    expect(screen.getByText(/journey through ancient egyptian civilisation/i)).toBeInTheDocument();
    expect(screen.getByText(/contemporary artists of the 21st century/i)).toBeInTheDocument();
  });

  it('shows "No current exhibitions." when the museum has no exhibitions', () => {
    const emptyData = {
      museum: {
        data: {
          id: '42',
          attributes: {
            name: 'Empty Gallery',
            exhibitions: { data: [] },
          },
        },
      },
    };
    mockUseQuery.mockReturnValue({ loading: false, error: null, data: emptyData });
    render(<Museum />);
    expect(screen.getByText('No current exhibitions.')).toBeInTheDocument();
  });

  it('does not show the error heading on a successful load', () => {
    render(<Museum />);
    expect(screen.queryByRole('heading', { name: 'Museum not found' })).not.toBeInTheDocument();
  });
});

describe('buildMuseumJsonLd', () => {
  it('returns a TouristAttraction schema.org object', () => {
    const result = buildMuseumJsonLd('British Museum', '42');
    expect(result['@type']).toBe('TouristAttraction');
    expect(result['@context']).toBe('https://schema.org');
  });

  it('includes the museum name', () => {
    const result = buildMuseumJsonLd('Natural History Museum', '7');
    expect(result.name).toBe('Natural History Museum');
  });

  it('includes the museum URL using the provided id', () => {
    const result = buildMuseumJsonLd('Tate Modern', '99');
    expect(result.url).toContain('/museum/99');
  });

  it('sets addressLocality to London', () => {
    const result = buildMuseumJsonLd('Museum of London', '5');
    expect(result.address.addressLocality).toBe('London');
  });

  it('sets addressCountry to GB', () => {
    const result = buildMuseumJsonLd('Museum of London', '5');
    expect(result.address.addressCountry).toBe('GB');
  });
});
