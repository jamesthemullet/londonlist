import { render, screen } from '@testing-library/react';
import Footer from './footer';

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

describe('Footer — rendering', () => {
  it('renders a footer landmark', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renders footer text', () => {
    render(<Footer />);
    expect(
      screen.getByText(/London List\. All rights reserved\./i)
    ).toBeInTheDocument();
  });

  it('renders a footer navigation landmark', () => {
    render(<Footer />);
    expect(screen.getByRole('navigation', { name: /footer navigation/i })).toBeInTheDocument();
  });

  it('renders an Explore link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: 'Explore' });
    expect(link).toHaveAttribute('href', '/explore');
  });

  it('renders a Starter Lists link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: 'Starter Lists' });
    expect(link).toHaveAttribute('href', '/templates');
  });

  it('renders a Pricing link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: 'Pricing' });
    expect(link).toHaveAttribute('href', '/pricing');
  });

  it('renders a Sign up free link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: 'Sign up free' });
    expect(link).toHaveAttribute('href', '/register');
  });

  it('renders a Log in link', () => {
    render(<Footer />);
    const link = screen.getByRole('link', { name: 'Log in' });
    expect(link).toHaveAttribute('href', '/login');
  });
});
