import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useMutation } from '@apollo/client/react';
import Cookie from 'js-cookie';
import PlaceSearch from './place-search';

jest.mock('@apollo/client', () => ({
  gql: (strings: TemplateStringsArray) => strings,
}));

jest.mock('@apollo/client/react', () => ({
  useMutation: jest.fn(),
}));

jest.mock('../../hooks/use-auth-header', () => ({
  useAuthHeader: () => ({ Authorization: 'Bearer test-token' }),
}));

// Bypass debounce so tests don't need fake timers
jest.mock('../../hooks/use-debounce', () => (value: string) => value);

jest.mock('js-cookie', () => ({ get: jest.fn() }));

const mockUseMutation = useMutation as unknown as jest.Mock;
const mockCookieGet = Cookie.get as jest.Mock;

const PHOTON_RESPONSE = {
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [-0.1276, 51.5074] },
      properties: {
        osm_id: 12345,
        osm_type: 'W',
        name: 'British Museum',
        city: 'London',
        country: 'United Kingdom',
        osm_key: 'tourism',
        osm_value: 'museum',
      },
    },
  ],
};

function mockFetch(data: object) {
  global.fetch = jest.fn().mockResolvedValue({
    json: () => Promise.resolve(data),
  } as Response);
}

beforeEach(() => {
  jest.clearAllMocks();
  mockUseMutation.mockReturnValue([jest.fn(), {}]);
});

describe('PlaceSearch — search behaviour', () => {
  it('does not fetch when query is shorter than 3 characters', () => {
    global.fetch = jest.fn();
    render(<PlaceSearch />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), { target: { value: 'ab' } });
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('fetches from the Photon API when query is 3 or more characters', async () => {
    mockFetch(PHOTON_RESPONSE);
    render(<PlaceSearch />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), { target: { value: 'Bri' } });
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('photon.komoot.io'),
        expect.any(Object),
      );
    });
  });

  it('renders search results after a successful fetch', async () => {
    mockFetch(PHOTON_RESPONSE);
    render(<PlaceSearch />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), {
      target: { value: 'British Museum' },
    });
    await waitFor(() => {
      expect(screen.getByText('British Museum')).toBeInTheDocument();
    });
  });

  it('renders result category tag when osm_value is present', async () => {
    mockFetch(PHOTON_RESPONSE);
    render(<PlaceSearch />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), {
      target: { value: 'British Museum' },
    });
    await waitFor(() => {
      expect(screen.getByText('museum')).toBeInTheDocument();
    });
  });

  it('renders a no-results message when fetch returns empty features', async () => {
    mockFetch({ features: [] });
    render(<PlaceSearch />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), { target: { value: 'xyz' } });
    await waitFor(() => {
      // The component renders both an aria-live region and a visible <p> — target the <p>
      const matches = screen.getAllByText(/no places found/i);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  it('clears results when query drops below 3 characters', async () => {
    mockFetch(PHOTON_RESPONSE);
    render(<PlaceSearch />);
    const input = screen.getByLabelText(/search for a place/i);
    fireEvent.change(input, { target: { value: 'British Museum' } });
    await waitFor(() => screen.getByText('British Museum'));

    fireEvent.change(input, { target: { value: 'ab' } });
    expect(screen.queryByText('British Museum')).not.toBeInTheDocument();
  });
});

describe('PlaceSearch — adding items', () => {
  it('shows an error when trying to add without a token cookie', async () => {
    mockCookieGet.mockReturnValue(undefined);
    mockFetch(PHOTON_RESPONSE);
    render(<PlaceSearch />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), {
      target: { value: 'British Museum' },
    });
    await waitFor(() => screen.getByText('British Museum'));
    fireEvent.click(screen.getByRole('button', { name: '+ Add to list' }));
    expect(screen.getByText(/please log in/i)).toBeInTheDocument();
  });

  it('calls createListItem with the correct osm_id, name, and listId', async () => {
    mockCookieGet.mockReturnValue('test-token');
    const mockCreate = jest.fn().mockResolvedValue({
      data: { createListItem: { documentId: 'new-1', name: 'British Museum' } },
    });
    mockUseMutation.mockReturnValue([mockCreate, {}]);
    mockFetch(PHOTON_RESPONSE);

    render(<PlaceSearch listId="list-1" />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), {
      target: { value: 'British Museum' },
    });
    await waitFor(() => screen.getByText('British Museum'));
    fireEvent.click(screen.getByRole('button', { name: '+ Add to list' }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            osm_id: 'way/12345',
            name: 'British Museum',
            list: 'list-1',
          }),
        }),
      );
    });
  });

  it('disables the add button and shows "Added ✓" after a successful add', async () => {
    mockCookieGet.mockReturnValue('test-token');
    mockUseMutation.mockReturnValue([
      jest.fn().mockResolvedValue({
        data: { createListItem: { documentId: 'new-1', name: 'British Museum' } },
      }),
      {},
    ]);
    mockFetch(PHOTON_RESPONSE);

    render(<PlaceSearch listId="list-1" />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), {
      target: { value: 'British Museum' },
    });
    await waitFor(() => screen.getByText('British Museum'));
    fireEvent.click(screen.getByRole('button', { name: '+ Add to list' }));

    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Added/ });
      expect(btn).toBeDisabled();
    });
  });

  it('shows an error message when the mutation fails', async () => {
    mockCookieGet.mockReturnValue('test-token');
    mockUseMutation.mockReturnValue([jest.fn().mockRejectedValue(new Error('network')), {}]);
    mockFetch(PHOTON_RESPONSE);

    render(<PlaceSearch listId="list-1" />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), {
      target: { value: 'British Museum' },
    });
    await waitFor(() => screen.getByText('British Museum'));
    fireEvent.click(screen.getByRole('button', { name: '+ Add to list' }));

    await waitFor(() => {
      expect(screen.getByText(/could not add to list/i)).toBeInTheDocument();
    });
  });

  it('shows an error when the mutation returns null data', async () => {
    mockCookieGet.mockReturnValue('test-token');
    mockUseMutation.mockReturnValue([
      jest.fn().mockResolvedValue({ data: { createListItem: null } }),
      {},
    ]);
    mockFetch(PHOTON_RESPONSE);

    render(<PlaceSearch listId="list-1" />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), {
      target: { value: 'British Museum' },
    });
    await waitFor(() => screen.getByText('British Museum'));
    fireEvent.click(screen.getByRole('button', { name: '+ Add to list' }));

    await waitFor(() => {
      expect(screen.getByText(/could not add to list/i)).toBeInTheDocument();
    });
  });
});

describe('PlaceSearch — search edge cases', () => {
  it('uses "relation" osm type prefix when osm_type is R', async () => {
    mockCookieGet.mockReturnValue('test-token');
    const mockCreate = jest.fn().mockResolvedValue({
      data: { createListItem: { documentId: 'r-1', name: 'River Thames' } },
    });
    mockUseMutation.mockReturnValue([mockCreate, {}]);
    mockFetch({
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-0.11, 51.5] },
          properties: {
            osm_id: 99001,
            osm_type: 'R',
            name: 'River Thames',
            city: 'London',
            country: 'United Kingdom',
            osm_key: 'waterway',
            osm_value: 'river',
          },
        },
      ],
    });

    render(<PlaceSearch listId="list-1" />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), { target: { value: 'Thames' } });
    await waitFor(() => screen.getByText('River Thames'));
    fireEvent.click(screen.getByRole('button', { name: '+ Add to list' }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({ osm_id: 'relation/99001' }),
        }),
      );
    });
  });

  it('shows a subtitle derived from district and city when the feature has no name', async () => {
    mockFetch({
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-0.12, 51.51] },
          properties: {
            osm_id: 99002,
            osm_type: 'N',
            street: '221B Baker Street',
            district: 'Westminster',
            city: 'London',
            country: 'United Kingdom',
            osm_key: 'place',
            osm_value: 'house',
          },
        },
      ],
    });

    render(<PlaceSearch />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), { target: { value: 'Baker' } });

    await waitFor(() => {
      expect(screen.getByText('Westminster, London')).toBeInTheDocument();
    });
  });

  it('shows a timeout error message when the fetch is aborted', async () => {
    const abortError = new Error('aborted');
    abortError.name = 'AbortError';
    global.fetch = jest.fn().mockRejectedValue(abortError);

    render(<PlaceSearch />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), { target: { value: 'museum' } });

    await waitFor(() => {
      expect(screen.getByText(/search timed out/i)).toBeInTheDocument();
    });
  });

  it('clears results without a timeout message on a generic fetch error', async () => {
    mockFetch(PHOTON_RESPONSE);
    render(<PlaceSearch />);
    const input = screen.getByLabelText(/search for a place/i);
    fireEvent.change(input, { target: { value: 'British Museum' } });
    await waitFor(() => screen.getByText('British Museum'));

    const networkError = new Error('Network failure');
    global.fetch = jest.fn().mockRejectedValue(networkError);
    fireEvent.change(input, { target: { value: 'British Museumx' } });

    await waitFor(() => {
      expect(screen.queryByText('British Museum')).not.toBeInTheDocument();
      expect(screen.queryByText(/search timed out/i)).not.toBeInTheDocument();
    });
  });

  it('handles a Photon response with no features array', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      json: () => Promise.resolve({}),
    } as Response);
    render(<PlaceSearch />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), { target: { value: 'xyz' } });
    await waitFor(() => {
      const matches = screen.getAllByText(/no places found/i);
      expect(matches.length).toBeGreaterThan(0);
    });
  });

  it('renders an empty name when both name and street are absent', async () => {
    mockFetch({
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-0.12, 51.51] },
          properties: {
            osm_id: 99003,
            osm_type: 'N',
            district: 'Southwark',
            city: 'London',
            country: 'United Kingdom',
            osm_key: 'place',
            osm_value: 'neighbourhood',
          },
        },
      ],
    });
    render(<PlaceSearch />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), { target: { value: 'Sou' } });
    await waitFor(() => {
      expect(screen.getByText('neighbourhood')).toBeInTheDocument();
    });
  });

  it('deduplicates features with the same osm_type and osm_id', async () => {
    mockFetch({ features: [PHOTON_RESPONSE.features[0], { ...PHOTON_RESPONSE.features[0] }] });
    render(<PlaceSearch />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), { target: { value: 'Bri' } });
    await waitFor(() => {
      expect(screen.getAllByText('British Museum')).toHaveLength(1);
    });
  });

  it('passes an empty string as category when osm_value and osm_key are both absent', async () => {
    mockCookieGet.mockReturnValue('test-token');
    const mockCreate = jest.fn().mockResolvedValue({
      data: { createListItem: { documentId: 'nc-1', name: 'Unnamed Place' } },
    });
    mockUseMutation.mockReturnValue([mockCreate, {}]);
    mockFetch({
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-0.13, 51.5] },
          properties: {
            osm_id: 99004,
            osm_type: 'W' as const,
            name: 'Unnamed Place',
            city: 'London',
            country: 'United Kingdom',
          },
        },
      ],
    });
    render(<PlaceSearch listId="list-1" />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), { target: { value: 'Unna' } });
    await waitFor(() => screen.getByText('Unnamed Place'));
    fireEvent.click(screen.getByRole('button', { name: '+ Add to list' }));
    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({ category: '' }),
        }),
      );
    });
  });

  it('announces plural result count in the aria-live region when there are multiple results', async () => {
    const secondFeature = {
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [-0.13, 51.51] as [number, number] },
      properties: {
        osm_id: 99005,
        osm_type: 'W' as const,
        name: 'Victoria and Albert Museum',
        city: 'London',
        country: 'United Kingdom',
        osm_key: 'tourism',
        osm_value: 'museum',
      },
    };
    mockFetch({ features: [...PHOTON_RESPONSE.features, secondFeature] });
    render(<PlaceSearch />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), { target: { value: 'Mus' } });
    await waitFor(() => {
      expect(screen.getByRole('status')).toHaveTextContent('2 results found');
    });
  });

  it('falls back to lowercased osm_type as key prefix for unrecognised osm types', async () => {
    mockCookieGet.mockReturnValue('test-token');
    const mockCreate = jest.fn().mockResolvedValue({
      data: { createListItem: { documentId: 'x-1', name: 'Mystery Place' } },
    });
    mockUseMutation.mockReturnValue([mockCreate, {}]);
    mockFetch({
      features: [
        {
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [-0.12, 51.5] },
          properties: {
            osm_id: 55555,
            osm_type: 'X' as 'N',
            name: 'Mystery Place',
            city: 'London',
            country: 'United Kingdom',
            osm_key: 'place',
            osm_value: 'unknown',
          },
        },
      ],
    });

    render(<PlaceSearch listId="list-1" />);
    fireEvent.change(screen.getByLabelText(/search for a place/i), {
      target: { value: 'Mystery' },
    });
    await waitFor(() => screen.getByText('Mystery Place'));
    fireEvent.click(screen.getByRole('button', { name: '+ Add to list' }));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({ osm_id: 'x/55555' }),
        }),
      );
    });
  });
});
