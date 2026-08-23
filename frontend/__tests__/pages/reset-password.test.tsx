import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/router';
import ResetPasswordPage from '../../pages/reset-password';

jest.mock('@apollo/client', () => ({
  gql: (strings: TemplateStringsArray) => strings,
}));

jest.mock('@apollo/client/react', () => ({
  useMutation: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

const mockUseMutation = useMutation as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

function setupForgotPasswordRoute() {
  mockUseRouter.mockReturnValue({ query: {} });
}

function setupSetNewPasswordRoute(code = 'test-reset-code') {
  mockUseRouter.mockReturnValue({ query: { code } });
}

beforeEach(() => {
  setupForgotPasswordRoute();
  mockUseMutation.mockReturnValue([jest.fn(), { loading: false, error: null }]);
});

afterEach(() => {
  jest.resetAllMocks();
});

// ---------------------------------------------------------------------------
// ForgotPassword — rendering
// ---------------------------------------------------------------------------

describe('ForgotPassword — rendering', () => {
  it('renders the Forgot Password form heading', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole('heading', { name: 'Forgot Password' })).toBeInTheDocument();
  });

  it('renders the email field', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('renders the Reset Password submit button', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
  });

  it('does not render a password field', () => {
    render(<ResetPasswordPage />);
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  });

  it('submit button is initially disabled when email is empty', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// ForgotPassword — error state
// ---------------------------------------------------------------------------

describe('ForgotPassword — error state', () => {
  it('displays an error message when the mutation returns an error', () => {
    mockUseMutation.mockReturnValue([
      jest.fn(),
      { loading: false, error: { message: 'User not found' } },
    ]);
    render(<ResetPasswordPage />);
    expect(screen.getByText('Error: User not found')).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// ForgotPassword — reset submission
// ---------------------------------------------------------------------------

describe('ForgotPassword — reset submission', () => {
  it('calls the reset mutation when a valid email is submitted', async () => {
    const mockReset = jest.fn().mockResolvedValue({ data: { forgotPassword: { ok: true } } });
    mockUseMutation.mockReturnValue([mockReset, { loading: false, error: null }]);

    render(<ResetPasswordPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({
        variables: { email: 'user@example.com' },
      });
    });
  });

  it('shows a success message after the mutation resolves', async () => {
    mockUseMutation.mockReturnValue([
      jest.fn().mockResolvedValue({ data: { forgotPassword: { ok: true } } }),
      { loading: false, error: null },
    ]);

    render(<ResetPasswordPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Check your inbox' })).toBeInTheDocument();
    });

    expect(screen.getByText(/user@example.com/)).toBeInTheDocument();
  });

  it('shows a "Back to login" link on the success screen', async () => {
    mockUseMutation.mockReturnValue([
      jest.fn().mockResolvedValue({ data: { forgotPassword: { ok: true } } }),
      { loading: false, error: null },
    ]);

    render(<ResetPasswordPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(screen.getByRole('link', { name: 'Back to login' })).toHaveAttribute('href', '/login');
    });
  });

  it('keeps the form visible when the mutation throws', async () => {
    mockUseMutation.mockReturnValue([
      jest.fn().mockRejectedValue(new Error('network error')),
      { loading: false, error: null },
    ]);

    render(<ResetPasswordPage />);

    await userEvent.type(screen.getByLabelText('Email'), 'user@example.com');
    await userEvent.click(screen.getByRole('button', { name: 'Reset Password' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Check your inbox' })).not.toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// SetNewPassword — rendering
// ---------------------------------------------------------------------------

describe('SetNewPassword — rendering', () => {
  beforeEach(() => {
    setupSetNewPasswordRoute();
    mockUseMutation.mockReturnValue([jest.fn(), { loading: false, error: null }]);
  });

  it('renders the "Set new password" heading when a code is in the URL', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole('heading', { name: 'Set new password' })).toBeInTheDocument();
  });

  it('renders a "New password" field', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
  });

  it('renders a "Confirm new password" field', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByLabelText('Confirm new password')).toBeInTheDocument();
  });

  it('renders a submit button labelled "Set new password"', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole('button', { name: 'Set new password' })).toBeInTheDocument();
  });

  it('submit button is disabled when both fields are empty', () => {
    render(<ResetPasswordPage />);
    expect(screen.getByRole('button', { name: 'Set new password' })).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// SetNewPassword — validation
// ---------------------------------------------------------------------------

describe('SetNewPassword — validation', () => {
  beforeEach(() => {
    setupSetNewPasswordRoute();
    mockUseMutation.mockReturnValue([jest.fn(), { loading: false, error: null }]);
  });

  it('disables the button when passwords match but are shorter than 6 characters', async () => {
    render(<ResetPasswordPage />);
    await userEvent.type(screen.getByLabelText('New password'), 'abc');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'abc');
    expect(screen.getByRole('button', { name: 'Set new password' })).toBeDisabled();
  });

  it('shows a mismatch error when confirm differs from new password', async () => {
    render(<ResetPasswordPage />);
    await userEvent.type(screen.getByLabelText('New password'), 'password123');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'different');
    expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
  });

  it('does not show a mismatch error when confirm field is still empty', async () => {
    render(<ResetPasswordPage />);
    await userEvent.type(screen.getByLabelText('New password'), 'password123');
    expect(screen.queryByText('Passwords do not match.')).not.toBeInTheDocument();
  });

  it('enables the submit button when passwords match and are at least 6 characters', async () => {
    render(<ResetPasswordPage />);
    await userEvent.type(screen.getByLabelText('New password'), 'password123');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'password123');
    expect(screen.getByRole('button', { name: 'Set new password' })).toBeEnabled();
  });
});

// ---------------------------------------------------------------------------
// SetNewPassword — submission
// ---------------------------------------------------------------------------

describe('SetNewPassword — submission', () => {
  const CODE = 'valid-reset-code';

  beforeEach(() => {
    setupSetNewPasswordRoute(CODE);
  });

  it('calls the resetPassword mutation with the code, password, and passwordConfirmation', async () => {
    const mockReset = jest.fn().mockResolvedValue({ data: { resetPassword: { jwt: 'tok', user: { id: '1' } } } });
    mockUseMutation.mockReturnValue([mockReset, { loading: false, error: null }]);

    render(<ResetPasswordPage />);

    await userEvent.type(screen.getByLabelText('New password'), 'newpassword1');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'newpassword1');
    await userEvent.click(screen.getByRole('button', { name: 'Set new password' }));

    await waitFor(() => {
      expect(mockReset).toHaveBeenCalledWith({
        variables: {
          code: CODE,
          password: 'newpassword1',
          passwordConfirmation: 'newpassword1',
        },
      });
    });
  });

  it('shows a success screen after the mutation resolves', async () => {
    mockUseMutation.mockReturnValue([
      jest.fn().mockResolvedValue({ data: { resetPassword: { jwt: 'tok', user: { id: '1' } } } }),
      { loading: false, error: null },
    ]);

    render(<ResetPasswordPage />);

    await userEvent.type(screen.getByLabelText('New password'), 'newpassword1');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'newpassword1');
    await userEvent.click(screen.getByRole('button', { name: 'Set new password' }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Password updated' })).toBeInTheDocument();
    });

    expect(screen.getByRole('link', { name: 'Log in with your new password' })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  it('shows a mutation error message when the reset fails', async () => {
    mockUseMutation.mockReturnValue([
      jest.fn(),
      { loading: false, error: { message: 'Incorrect code provided' } },
    ]);

    render(<ResetPasswordPage />);

    expect(screen.getByText('Error: Incorrect code provided')).toBeInTheDocument();
  });

  it('keeps the form visible when the mutation throws', async () => {
    mockUseMutation.mockReturnValue([
      jest.fn().mockRejectedValue(new Error('network error')),
      { loading: false, error: null },
    ]);

    render(<ResetPasswordPage />);

    await userEvent.type(screen.getByLabelText('New password'), 'newpassword1');
    await userEvent.type(screen.getByLabelText('Confirm new password'), 'newpassword1');
    await userEvent.click(screen.getByRole('button', { name: 'Set new password' }));

    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Password updated' })).not.toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Set new password' })).toBeInTheDocument();
  });
});
