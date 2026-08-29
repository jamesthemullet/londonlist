import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import AccountPage from '../../pages/account';

jest.mock('../../context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('js-cookie', () => ({
  get: jest.fn().mockReturnValue('mock-token'),
  remove: jest.fn(),
}));

import Cookie from 'js-cookie';
import { useRouter } from 'next/router';
import { useAppContext } from '../../context/AppContext';

const mockUseAppContext = useAppContext as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockCookieGet = Cookie.get as jest.Mock;
const mockCookieRemove = Cookie.remove as jest.Mock;

const mockPush = jest.fn();
const mockSetUser = jest.fn();

const mockUser = {
  id: '1',
  documentId: 'u1',
  email: 'alice@example.com',
  username: 'alice',
  isPro: false,
};

beforeEach(() => {
  mockUseAppContext.mockReturnValue({
    user: mockUser,
    setUser: mockSetUser,
    initialized: true,
  });
  mockUseRouter.mockReturnValue({ push: mockPush });
  mockCookieGet.mockReturnValue('mock-token');
  mockCookieRemove.mockReset();
  mockPush.mockReset();
  mockSetUser.mockReset();
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('AccountPage — redirect', () => {
  it('redirects to /login when user is not authenticated', () => {
    mockUseAppContext.mockReturnValue({ user: null, setUser: mockSetUser, initialized: true });
    render(<AccountPage />);
    expect(mockPush).toHaveBeenCalledWith('/login');
  });

  it('renders nothing while auth is uninitialised', () => {
    mockUseAppContext.mockReturnValue({ user: null, setUser: mockSetUser, initialized: false });
    const { container } = render(<AccountPage />);
    expect(container.firstChild).toBeNull();
  });
});

describe('AccountPage — page structure', () => {
  it('renders the page heading', () => {
    render(<AccountPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/account settings/i);
  });

  it('renders the account info section', () => {
    render(<AccountPage />);
    expect(screen.getByRole('heading', { name: /account info/i })).toBeInTheDocument();
  });

  it('displays the current username', () => {
    render(<AccountPage />);
    expect(screen.getByText('alice')).toBeInTheDocument();
  });

  it('displays the current email', () => {
    render(<AccountPage />);
    expect(screen.getByText('alice@example.com')).toBeInTheDocument();
  });

  it('renders the change password section', () => {
    render(<AccountPage />);
    expect(screen.getByRole('heading', { name: /change password/i })).toBeInTheDocument();
  });

  it('renders the danger zone section', () => {
    render(<AccountPage />);
    expect(screen.getByRole('heading', { name: /danger zone/i })).toBeInTheDocument();
  });
});

describe('AccountPage — change password form', () => {
  it('renders all password input fields', () => {
    render(<AccountPage />);
    expect(screen.getByLabelText(/current password/i)).toBeInTheDocument();
    expect(screen.getByLabelText('New password')).toBeInTheDocument();
    expect(screen.getByLabelText(/confirm new password/i)).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    render(<AccountPage />);
    expect(screen.getByRole('button', { name: /change password/i })).toBeInTheDocument();
  });

  it('shows an error when new passwords do not match', async () => {
    render(<AccountPage />);
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'oldpass' },
    });
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'newpass1' },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'newpass2' },
    });
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/do not match/i);
  });

  it('shows an error when new password is too short', async () => {
    render(<AccountPage />);
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'oldpass' },
    });
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'abc' },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'abc' },
    });
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/at least 6 characters/i);
  });

  it('shows success message when password change succeeds', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<AccountPage />);
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'oldpass' },
    });
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'newpass1' },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'newpass1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    expect(await screen.findByRole('status')).toHaveTextContent(/password changed successfully/i);
  });

  it('clears the password fields after a successful change', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<AccountPage />);
    const currentInput = screen.getByLabelText(/current password/i);
    fireEvent.change(currentInput, { target: { value: 'oldpass' } });
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'newpass1' },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'newpass1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    await screen.findByRole('status');
    expect(currentInput).toHaveValue('');
  });

  it('shows an error when the API returns a failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({ error: { message: 'Your password is incorrect.' } }),
    });
    render(<AccountPage />);
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'wrongpass' },
    });
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'newpass1' },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'newpass1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/your password is incorrect/i);
  });

  it('shows a generic error when the API request throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network error'));
    render(<AccountPage />);
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'oldpass' },
    });
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'newpass1' },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'newpass1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i);
  });

  it('sends a request to the change-password endpoint with the correct body', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({}) });
    render(<AccountPage />);
    fireEvent.change(screen.getByLabelText(/current password/i), {
      target: { value: 'oldpass' },
    });
    fireEvent.change(screen.getByLabelText('New password'), {
      target: { value: 'newpass1' },
    });
    fireEvent.change(screen.getByLabelText(/confirm new password/i), {
      target: { value: 'newpass1' },
    });
    fireEvent.click(screen.getByRole('button', { name: /change password/i }));
    await screen.findByRole('status');
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/change-password'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          currentPassword: 'oldpass',
          password: 'newpass1',
          passwordConfirmation: 'newpass1',
        }),
      }),
    );
  });
});

describe('AccountPage — delete account', () => {
  it('shows the "Delete my account" button initially', () => {
    render(<AccountPage />);
    expect(screen.getByRole('button', { name: /delete my account/i })).toBeInTheDocument();
  });

  it('shows a confirmation prompt after clicking delete', () => {
    render(<AccountPage />);
    fireEvent.click(screen.getByRole('button', { name: /delete my account/i }));
    expect(screen.getByText(/are you sure\? this cannot be undone/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /yes, delete my account/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
  });

  it('hides the confirmation prompt when Cancel is clicked', () => {
    render(<AccountPage />);
    fireEvent.click(screen.getByRole('button', { name: /delete my account/i }));
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(screen.queryByText(/are you sure\? this cannot be undone/i)).not.toBeInTheDocument();
  });

  it('calls the delete account endpoint and redirects on success', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true, json: async () => ({ deleted: true }) });
    render(<AccountPage />);
    fireEvent.click(screen.getByRole('button', { name: /delete my account/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes, delete my account/i }));
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/account/me'),
        expect.objectContaining({ method: 'DELETE' }),
      );
    });
    expect(mockCookieRemove).toHaveBeenCalledWith('token');
    expect(mockSetUser).toHaveBeenCalledWith(null);
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('shows an error if the delete API call fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({ ok: false });
    render(<AccountPage />);
    fireEvent.click(screen.getByRole('button', { name: /delete my account/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes, delete my account/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/failed to delete account/i);
  });

  it('shows a generic error if the delete request throws', async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error('network error'));
    render(<AccountPage />);
    fireEvent.click(screen.getByRole('button', { name: /delete my account/i }));
    fireEvent.click(screen.getByRole('button', { name: /yes, delete my account/i }));
    expect(await screen.findByRole('alert')).toHaveTextContent(/something went wrong/i);
  });
});
