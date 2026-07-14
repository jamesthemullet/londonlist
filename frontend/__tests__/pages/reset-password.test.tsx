import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMutation } from '@apollo/client/react';
import ForgotPassword from '../../pages/reset-password';

jest.mock('@apollo/client', () => ({
  gql: (strings: TemplateStringsArray) => strings,
}));

jest.mock('@apollo/client/react', () => ({
  useMutation: jest.fn(),
}));

const mockUseMutation = useMutation as jest.Mock;

beforeEach(() => {
  mockUseMutation.mockReturnValue([jest.fn(), { loading: false, error: null }]);
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('ForgotPassword — rendering', () => {
  it('renders the Forgot Password form heading', () => {
    render(<ForgotPassword />);
    expect(screen.getByRole('heading', { name: 'Forgot Password' })).toBeInTheDocument();
  });

  it('renders the email field', () => {
    render(<ForgotPassword />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders the Reset Password submit button', () => {
    render(<ForgotPassword />);
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
  });

  it('does not render a password field', () => {
    render(<ForgotPassword />);
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  });

  it('submit button is initially disabled when email is empty', () => {
    render(<ForgotPassword />);
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeDisabled();
  });
});

describe('ForgotPassword — error state', () => {
  it('displays an error message when the mutation returns an error', () => {
    mockUseMutation.mockReturnValue([
      jest.fn(),
      { loading: false, error: { message: 'User not found' } },
    ]);
    render(<ForgotPassword />);
    expect(screen.getByText('Error: User not found')).toBeInTheDocument();
  });
});

describe('ForgotPassword — reset submission', () => {
  it('calls the reset mutation when a valid email is submitted', async () => {
    const mockReset = jest.fn().mockResolvedValue({ data: { forgotPassword: { ok: true } } });
    mockUseMutation.mockReturnValue([mockReset, { loading: false, error: null }]);

    render(<ForgotPassword />);

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({
        variables: { email: 'user@example.com' },
      });
    });
  });
});
