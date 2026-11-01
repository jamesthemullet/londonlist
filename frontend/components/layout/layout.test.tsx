import { render, screen } from '@testing-library/react';
import Layout from './layout';

jest.mock('next/router', () => ({
  useRouter: jest.fn().mockReturnValue({ asPath: '/', push: jest.fn() }),
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

jest.mock('../../context/AppContext', () => ({
  useAppContext: jest.fn().mockReturnValue({ user: null, setUser: jest.fn(), initialized: true }),
}));

jest.mock('../meta/meta', () => ({
  __esModule: true,
  default: () => null,
}));

jest.mock('../footer/footer', () => ({
  __esModule: true,
  default: () => <footer />,
}));

jest.mock('js-cookie', () => ({
  __esModule: true,
  default: { get: jest.fn(), remove: jest.fn() },
}));

describe('Layout — skip link', () => {
  it('renders a skip link pointing to #main-content', () => {
    render(<Layout><main /></Layout>);
    const skip = screen.getByRole('link', { name: 'Skip to main content' });
    expect(skip).toBeInTheDocument();
    expect(skip).toHaveAttribute('href', '#main-content');
  });

  it('skip link target has tabIndex={-1} so focus moves there programmatically', () => {
    render(<Layout><main /></Layout>);
    const target = document.getElementById('main-content');
    expect(target).toBeInTheDocument();
    expect(target).toHaveAttribute('tabindex', '-1');
  });
});

describe('Layout — landmarks', () => {
  it('renders a <header> landmark', () => {
    render(<Layout><main /></Layout>);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('renders a <nav> landmark', () => {
    render(<Layout><main /></Layout>);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('renders a <footer> landmark', () => {
    render(<Layout><main /></Layout>);
    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
  });
});
