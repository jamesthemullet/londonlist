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
});
