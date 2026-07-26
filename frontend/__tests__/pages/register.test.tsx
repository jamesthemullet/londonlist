import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/router';
import Cookie from 'js-cookie';
import RegisterRoute from '../../pages/register';

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

describe('RegisterRoute — rendering', () => {
  it('renders the Sign Up form heading', () => {
    render(<RegisterRoute />);
    expect(screen.getByRole('heading', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('renders the email field', () => {
    render(<RegisterRoute />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders the password field', () => {
    render(<RegisterRoute />);
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders the Sign Up submit button', () => {
    render(<RegisterRoute />);
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument();
  });

  it('submit button is initially disabled when email is empty', () => {
    render(<RegisterRoute />);
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeDisabled();
  });
});

describe('RegisterRoute — loading state', () => {
  it('renders the Loader while the mutation is in flight', () => {
    mockUseMutation.mockReturnValue([jest.fn(), { loading: true, error: null }]);
    render(<RegisterRoute />);
    expect(screen.getByTestId('loader')).toBeInTheDocument();
  });

  it('does not render the form while loading', () => {
    mockUseMutation.mockReturnValue([jest.fn(), { loading: true, error: null }]);
    render(<RegisterRoute />);
    expect(screen.queryByRole('heading', { name: 'Sign Up' })).not.toBeInTheDocument();
  });
});

describe('RegisterRoute — error state', () => {
  it('displays an error message when the mutation returns an error', () => {
    mockUseMutation.mockReturnValue([
      jest.fn(),
      { loading: false, error: { message: 'Email already taken' } },
    ]);
    render(<RegisterRoute />);
    expect(screen.getByText('Error: Email already taken')).toBeInTheDocument();
  });
});

describe('RegisterRoute — successful registration', () => {
  it('calls setUser and redirects to / after successful registration', async () => {
    const fakeUser = { id: '1', documentId: 'doc-1', username: 'bob@test.com', email: 'bob@test.com' };
    const mockRegister = jest.fn().mockResolvedValue({
      data: { register: { jwt: 'reg-jwt', user: fakeUser } },
    });
    mockUseMutation.mockReturnValue([mockRegister, { loading: false, error: null }]);

    render(<RegisterRoute />);

    await userEvent.type(screen.getByLabelText('Email'), 'bob@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(mockSetUser).toHaveBeenCalledWith(fakeUser);
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('stores the JWT in a cookie after successful registration', async () => {
    const fakeUser = { id: '1', documentId: 'doc-1', username: 'bob@test.com', email: 'bob@test.com' };
    const mockRegister = jest.fn().mockResolvedValue({
      data: { register: { jwt: 'reg-jwt', user: fakeUser } },
    });
    mockUseMutation.mockReturnValue([mockRegister, { loading: false, error: null }]);

    render(<RegisterRoute />);

    await userEvent.type(screen.getByLabelText('Email'), 'bob@test.com');
    await userEvent.type(screen.getByLabelText('Password'), 'password123');
    await userEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(mockCookieSet).toHaveBeenCalledWith('token', 'reg-jwt', expect.any(Object));
    });
  });
});
