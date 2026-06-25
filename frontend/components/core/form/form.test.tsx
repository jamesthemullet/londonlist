import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Form from './form';

const baseProps = {
  title: 'Test Form',
  buttonText: 'Submit',
  formData: { email: '', password: '' },
  setFormData: jest.fn(),
  callback: jest.fn(),
  error: null,
  isLogin: false,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Form — rendering', () => {
  it('renders the form title', () => {
    render(<Form {...baseProps} />);
    expect(screen.getByRole('heading', { name: 'Test Form' })).toBeInTheDocument();
  });

  it('renders the email field', () => {
    render(<Form {...baseProps} />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('does not render a password field when isLogin is false', () => {
    render(<Form {...baseProps} isLogin={false} />);
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  });

  it('renders a password field when isLogin is true', () => {
    render(<Form {...baseProps} isLogin={true} />);
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('does not display an error when error is null', () => {
    render(<Form {...baseProps} error={null} />);
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
  });

  it('displays an error message when error prop is provided', () => {
    render(<Form {...baseProps} error={{ message: 'Invalid credentials' }} />);
    expect(screen.getByText('Error: Invalid credentials')).toBeInTheDocument();
  });
});

describe('Form — email validation', () => {
  it('submit button is disabled when email is empty', () => {
    render(<Form {...baseProps} formData={{ email: '', password: '' }} />);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('submit button is disabled when email has no @ symbol', () => {
    render(<Form {...baseProps} formData={{ email: 'notanemail', password: '' }} />);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('submit button is disabled when email has no domain part', () => {
    render(<Form {...baseProps} formData={{ email: 'user@', password: '' }} />);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('submit button is enabled when email is valid', () => {
    render(<Form {...baseProps} formData={{ email: 'user@example.com', password: '' }} />);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });
});

describe('Form — interactions', () => {
  it('calls setFormData with updated email when typing in the email field', async () => {
    const setFormData = jest.fn();
    render(<Form {...baseProps} setFormData={setFormData} formData={{ email: '', password: '' }} />);

    await userEvent.type(screen.getByLabelText('Email'), 'a');

    expect(setFormData).toHaveBeenCalledWith({ email: 'a', password: '' });
  });

  it('calls setFormData with updated password when typing in the password field', async () => {
    const setFormData = jest.fn();
    render(
      <Form
        {...baseProps}
        isLogin={true}
        setFormData={setFormData}
        formData={{ email: '', password: '' }}
      />
    );

    await userEvent.type(screen.getByLabelText('Password'), 's');

    expect(setFormData).toHaveBeenCalledWith({ email: '', password: 's' });
  });

  it('calls the callback when the form is submitted', () => {
    const callback = jest.fn((e) => e.preventDefault());
    render(
      <Form
        {...baseProps}
        formData={{ email: 'user@example.com', password: '' }}
        callback={callback}
      />
    );

    const form = screen.getByRole('button', { name: 'Submit' }).closest('form') as HTMLFormElement;
    fireEvent.submit(form);

    expect(callback).toHaveBeenCalledTimes(1);
  });
});
