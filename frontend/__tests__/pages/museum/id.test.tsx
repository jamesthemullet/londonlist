import { render, screen } from '@testing-library/react';
import MuseumPage from '../../../pages/museum/[id]';

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@apollo/client', () => ({
  gql: (strings: TemplateStringsArray) => strings,
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

import { useQuery } from '@apollo/client/react';
import { useRouter } from 'next/router';

const mockUseQuery = useQuery as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

const EXHIBITION_1 = {
  id: 'ex-1',
  attributes: {
    name: 'Ancient Egypt',
    description: 'Journey through 3,000 years of Egyptian history.',
    startdate: '2026-01-01',
    enddate: '2026-06-30',
  },
};

const EXHIBITION_2 = {
  id: 'ex-2',
  attributes: {
    name: 'Modern Art',
    description: 'A survey of 20th-century painting and sculpture.',
    startdate: '2026-02-01',
    enddate: '2026-08-31',
  },
};

const MUSEUM_DATA = {
  museum: {
    data: {
      id: 'museum-1',
      attributes: {
        name: 'British Museum',
        exhibitions: {
          data: [EXHIBITION_1, EXHIBITION_2],
        },
      },
    },
  },
};

beforeEach(() => {
  mockUseRouter.mockReturnValue({ query: { id: 'museum-1' } });
  mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: MUSEUM_DATA });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('MuseumPage — loading state', () => {
  it('shows the loader while the query is in flight', () => {
    mockUseQuery.mockReturnValue({ loading: true, error: undefined, data: undefined });

    render(<MuseumPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows the loader when router id is not yet available', () => {
    mockUseRouter.mockReturnValue({ query: {} });
    mockUseQuery.mockReturnValue({ loading: false, error: undefined, data: undefined });

    render(<MuseumPage />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});

describe('MuseumPage — error state', () => {
  it('shows an error message when the query fails', () => {
    mockUseQuery.mockReturnValue({
      loading: false,
      error: new Error('Network error'),
      data: undefined,
    });

    render(<MuseumPage />);

    expect(screen.getByText('Error Loading Exhibitions')).toBeInTheDocument();
  });
});

describe('MuseumPage — empty state', () => {
  it('shows "No Exhibitions Found" when the exhibition list is empty', () => {
    mockUseQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: {
        museum: {
          data: {
            id: 'museum-1',
            attributes: {
              name: 'British Museum',
              exhibitions: { data: [] },
            },
          },
        },
      },
    });

    render(<MuseumPage />);

    expect(screen.getByRole('heading', { name: 'No Exhibitions Found' })).toBeInTheDocument();
  });

  it('shows "No Exhibitions Found" when museum data is null', () => {
    mockUseQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: { museum: { data: null } },
    });

    render(<MuseumPage />);

    expect(screen.getByRole('heading', { name: 'No Exhibitions Found' })).toBeInTheDocument();
  });
});

describe('MuseumPage — populated state', () => {
  it('renders the museum name as a heading', () => {
    render(<MuseumPage />);

    expect(screen.getByRole('heading', { name: 'British Museum' })).toBeInTheDocument();
  });

  it('renders a card for each exhibition', () => {
    render(<MuseumPage />);

    expect(screen.getByText('Ancient Egypt')).toBeInTheDocument();
    expect(screen.getByText('Modern Art')).toBeInTheDocument();
  });

  it('renders the exhibition description', () => {
    render(<MuseumPage />);

    expect(screen.getByText('Journey through 3,000 years of Egyptian history.')).toBeInTheDocument();
    expect(screen.getByText('A survey of 20th-century painting and sculpture.')).toBeInTheDocument();
  });

  it('renders an "+ Add to Cart" button for each exhibition', () => {
    render(<MuseumPage />);

    const buttons = screen.getAllByRole('button', { name: '+ Add to Cart' });
    expect(buttons).toHaveLength(2);
  });
});

describe('MuseumPage — router id normalisation', () => {
  it('uses the first element when router query id is an array', () => {
    mockUseRouter.mockReturnValue({ query: { id: ['museum-1', 'museum-2'] } });

    render(<MuseumPage />);

    expect(screen.getByRole('heading', { name: 'British Museum' })).toBeInTheDocument();
  });
});
