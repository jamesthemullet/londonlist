import { act, render, screen, waitFor } from '@testing-library/react';
import { AppProvider, useAppContext } from '../../context/AppContext';

jest.mock('js-cookie', () => ({
  get: jest.fn(),
}));

jest.mock('../../pages/_app', () => ({
  client: {
    query: jest.fn(),
  },
}));

import Cookie from 'js-cookie';
import { client } from '../../pages/_app';
const mockCookieGet = Cookie.get as jest.Mock;
const mockClientQuery = (client as unknown as { query: jest.Mock }).query;

function TestConsumer() {
  const { user, initialized } = useAppContext();
  return (
    <div>
      <span data-testid="initialized">{String(initialized)}</span>
      <span data-testid="username">{user?.username ?? 'none'}</span>
      <span data-testid="isPro">{user ? String(user.isPro) : 'none'}</span>
    </div>
  );
}

afterEach(() => {
  jest.resetAllMocks();
});

describe('AppProvider', () => {
  it('renders children', () => {
    mockCookieGet.mockReturnValue(undefined);

    render(
      <AppProvider>
        <span data-testid="child">hello</span>
      </AppProvider>,
    );

    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('sets initialized to true after mount with no token', async () => {
    mockCookieGet.mockReturnValue(undefined);

    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });
  });

  it('leaves user as null when no token cookie is present', async () => {
    mockCookieGet.mockReturnValue(undefined);

    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });

    expect(screen.getByTestId('username').textContent).toBe('none');
  });

  it('fetches user when a token cookie is present', async () => {
    mockCookieGet.mockReturnValue('test-jwt-token');
    mockClientQuery.mockResolvedValue({
      data: {
        me: {
          id: '1',
          documentId: 'u1',
          email: 'alice@example.com',
          username: 'alice',
          isPro: true,
        },
      },
    });

    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('username').textContent).toBe('alice');
    });

    expect(screen.getByTestId('isPro').textContent).toBe('true');
    expect(mockClientQuery).toHaveBeenCalledWith(
      expect.objectContaining({
        context: expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer test-jwt-token',
          }),
        }),
      }),
    );
  });

  it('sets user to null when the query returns null me', async () => {
    mockCookieGet.mockReturnValue('token');
    mockClientQuery.mockResolvedValue({ data: { me: null } });

    render(
      <AppProvider>
        <TestConsumer />
      </AppProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('initialized').textContent).toBe('true');
    });

    expect(screen.getByTestId('username').textContent).toBe('none');
  });

  it('allows setUser to update the displayed user', async () => {
    mockCookieGet.mockReturnValue(undefined);

    function SetUserConsumer() {
      const { user, setUser } = useAppContext();
      return (
        <div>
          <span data-testid="username">{user?.username ?? 'none'}</span>
          <button
            type="button"
            onClick={() =>
              setUser({
                id: '2',
                documentId: 'u2',
                email: 'bob@example.com',
                username: 'bob',
                isPro: false,
              })
            }
          >
            set user
          </button>
        </div>
      );
    }

    const { getByRole } = render(
      <AppProvider>
        <SetUserConsumer />
      </AppProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('username').textContent).toBe('none');
    });

    act(() => {
      getByRole('button', { name: /set user/i }).click();
    });

    expect(screen.getByTestId('username').textContent).toBe('bob');
  });
});

describe('useAppContext', () => {
  it('throws when used outside an AppProvider', () => {
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

    function BadConsumer() {
      useAppContext();
      return null;
    }

    expect(() => render(<BadConsumer />)).toThrow(
      'useAppContext must be used within an AppProvider',
    );

    spy.mockRestore();
  });
});
