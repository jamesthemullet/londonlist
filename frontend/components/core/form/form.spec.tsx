import { render, screen } from '@testing-library/react';
import Form from './form';

describe('Form', () => {
  it('should render the form', () => {
    const props = {
      title: 'Login',
      buttonText: 'Login',
      formData: { email: '', password: '' },
      setFormData: jest.fn(),
      callback: jest.fn(),
      error: null,
      isLogin: true,
    };
    render(<Form {...props} />);
    // expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Password')).toBeInTheDocument();
    // expect(screen.getByText('Login')).toBeInTheDocument();
  });
});
