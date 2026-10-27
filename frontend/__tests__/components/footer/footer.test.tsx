import { render, screen } from '@testing-library/react';
import Footer from '../../../components/footer/footer';

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

describe('Footer', () => {
  it('renders a footer landmark', () => {
    render(<Footer />);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });

  it('renders the tagline', () => {
    render(<Footer />);
    expect(
      screen.getByText(/your london bucket list, beautifully organised/i),
    ).toBeInTheDocument();
  });

  it('renders footer navigation', () => {
    render(<Footer />);
    expect(screen.getByRole('navigation', { name: /footer navigation/i })).toBeInTheDocument();
  });

  it('renders the Home link', () => {
    render(<Footer />);
    const homeLinks = screen.getAllByRole('link', { name: /home/i });
    expect(homeLinks.some((l) => l.getAttribute('href') === '/')).toBe(true);
  });

  it('renders the Explore link', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /explore/i })).toHaveAttribute('href', '/explore');
  });

  it('renders the Pricing link', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /pricing/i })).toHaveAttribute('href', '/pricing');
  });

  it('renders the Sign up free link', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /sign up free/i })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('renders the Log in link', () => {
    render(<Footer />);
    expect(screen.getByRole('link', { name: /log in/i })).toHaveAttribute('href', '/login');
  });

  it('renders the wordmark London List', () => {
    render(<Footer />);
    expect(screen.getAllByText(/london list/i).length).toBeGreaterThan(0);
  });

  it('renders the current year in the copyright notice', () => {
    render(<Footer />);
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });
});
