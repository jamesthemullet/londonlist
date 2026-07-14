import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/router';
import Cookie from 'js-cookie';
import LoginRoute from '../../pages/login';

jest.mock('@apollo/client', () => ({
  gql: (strings: TemplateStringsArray) => strings,
}));

jest.mock('@apollo/client/react', () => ({
  useMutation: jest.fn(),
}));

jest.mock('../../context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('js-cookie', () => ({
  __esModule: true,
  default: { set: jest.fn() },
}));

jest.mock('../../components/Loader', () => ({
  __esModule: true,
  default: () => <div data-testid="loader" />,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

import { useAppContext } from '../../context/AppContext';
const mockUseAppContext = useAppContext as jest.Mock;
const mockUseMutation = useMutation as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockCookieSet = (Cookie as unknown as { set: jest.Mock }).set;

const mockPush = jest.fn();
const mockSetUser = jest.fn();

beforeEach(() => {
  mockPush.mockReset();
  mockSetUser.mockReset();
  mockCookieSet.mockReset();
  mockUseRouter.mockReturnValue({ push: mockPush });
  mockUseAppContext.mockReturnValue({ user: null, setUser: mockSetUser, initialized: true });
  mockUseMutation.mockReturnValue([jest.fn(), { loading: false, error: null }]);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('LoginRoute — rendering', () => {
  it('renders the Login form heading', () => {
    render(<LoginRoute />);
    expect(screen.getByRole('heading', { name: 'Login' })).toBeInTheDocument();
  });

  it('renders the email field', () => {
    render(<LoginRoute />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders the password field', () => {
    render(<LoginRoute />);
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders the Login submit button', () => {
    render(<LoginRoute />);
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument();
  });

  it('renders a "Forgot Password?" link to /reset-password', () => {
    render(<LoginRoute />);
    const link = screen.getByRole('link', { name: 'Forgot Password?' });
    expect(link).toHaveAttribute('href', '/reset-password');
  });

  it('submit button is initially disabled when email is empty', () => {
    render(<LoginRoute />);
    expect(screen.getByRole('button', { name: 'Login' })).toBeDisabled();
  });
});

describe('LoginRoute — loading state', () => {
  it('renders the Loader while the mutation is in flight', () => {
    mockUseMutation.mockReturnValue([jest.fn(), { loading: true, error: null }]);
    render(<LoginRoute />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('does not render the form while loading', () => {
    mockUseMutation.mockReturnValue([jest.fn(), { loading: true, error: null }]);
    render(<LoginRoute />);
    expect(screen.queryByRole('heading', { name: 'Login' })).not.toBeInTheDocument();
  });
});

describe('LoginRoute — error state', () => {
  it('displays an error message when the mutation returns an error', () => {
    mockUseMutation.mockReturnValue([
      jest.fn(),
      { loading: false, error: { message: 'Invalid credentials' } },
    ]);
    render(<LoginRoute />);
    expect(screen.getByText('Error: Invalid credentials')).toBeInTheDocument();
  });
});

describe('LoginRoute — successful login', () => {
  it('calls setUser and redirects to / after a successful login', async () => {
    const fakeUser = { id: '1', documentId: 'doc-1', username: 'alice', email: 'alice@test.com' };
    const mockLogin = jest.fn().mockResolvedValue({
      data: { login: { jwt: 'test-jwt', user: fakeUser } },
    });
    mockUseMutation.mockReturnValue([mockLogin, { loading: false, error: null }]);

    render(<LoginRoute />);

    await userEvent.type(screen.getByLabelText('Email'), 'alice@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith(fakeUser);
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('stores the JWT in a cookie after a successful login', async () => {
    const fakeUser = { id: '1', documentId: 'doc-1', username: 'alice', email: 'alice@test.com' };
    const mockLogin = jest.fn().mockResolvedValue({
      data: { login: { jwt: 'test-jwt', user: fakeUser } },
    });
    mockUseMutation.mockReturnValue([mockLogin, { loading: false, error: null }]);

    render(<LoginRoute />);

    await userEvent.type(screen.getByLabelText('Email'), 'alice@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Login' }));

    await waitFor(() => {
      expect(mockCookieSet).toHaveBeenCalledWith('token', 'test-jwt', expect.any(Object));
    });
  });
});
