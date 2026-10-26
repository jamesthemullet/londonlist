import { fireEvent, render, screen } from '@testing-library/react';
import Form from '../../../components/core/form/form';

describe('Form', () => {
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

  it('renders the form title', () => {
    render(<Form {...baseProps} />);
    expect(screen.getByRole('heading', { name: 'Test Form' })).toBeInTheDocument();
  });

  it('renders the email input', () => {
    render(<Form {...baseProps} />);
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('does not render the password input when isLogin is false', () => {
    render(<Form {...baseProps} />);
    expect(screen.queryByLabelText('Password')).not.toBeInTheDocument();
  });

  it('renders the password input when isLogin is true', () => {
    render(<Form {...baseProps} isLogin={true} formData={{ email: '', password: '' }} />);
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    render(<Form {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeInTheDocument();
  });

  it('disables the submit button when email is empty', () => {
    render(<Form {...baseProps} />);
    expect(screen.getByRole('button', { name: 'Submit' })).toBeDisabled();
  });

  it('enables the submit button when email is valid', () => {
    render(
      <Form {...baseProps} formData={{ email: 'test@example.com', password: '' }} />,
    );
    expect(screen.getByRole('button', { name: 'Submit' })).toBeEnabled();
  });

  it('calls setFormData when the email input changes', () => {
    const setFormData = jest.fn();
    render(<Form {...baseProps} setFormData={setFormData} />);
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'a@b.com' } });
    expect(setFormData).toHaveBeenCalledWith({ email: 'a@b.com', password: '' });
  });

  it('calls callback on form submit', () => {
    const callback = jest.fn();
    render(
      <Form
        {...baseProps}
        callback={callback}
        formData={{ email: 'test@example.com', password: '' }}
      />,
    );
    fireEvent.submit(screen.getByRole('button', { name: 'Submit' }).closest('form') as HTMLFormElement);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('renders the error message when error is provided', () => {
    render(<Form {...baseProps} error={{ message: 'Invalid email' }} />);
    expect(screen.getByRole('alert')).toHaveTextContent(/invalid email/i);
  });

  it('does not render an error when error is null', () => {
    render(<Form {...baseProps} />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
