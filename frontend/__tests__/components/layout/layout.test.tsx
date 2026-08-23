import { render, screen, fireEvent } from '@testing-library/react';
import Layout from '../../../components/layout/layout';
import { useAppContext } from '../../../context/AppContext';

jest.mock('../../../context/AppContext', () => ({
  useAppContext: jest.fn(),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(() => ({ asPath: '/', push: jest.fn() })),
}));

jest.mock('next/head', () => ({
  __esModule: true,
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
    className,
    onClick,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
    onClick?: () => void;
  }) => (
    <a href={href} className={className} onClick={onClick}>
      {children}
    </a>
  ),
}));

jest.mock('next/font/google', () => ({
  Crimson_Text: () => ({ className: 'crimson-text' }),
}));

jest.mock('../../../components/meta/meta', () => ({
  __esModule: true,
  default: () => <div data-testid="meta" />,
}));

jest.mock('../../../components/footer/footer', () => ({
  __esModule: true,
  default: () => <footer data-testid="footer" />,
}));

jest.mock('../../../components/core/button/button', () => ({
  Button: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
  }) => <button type="button" onClick={onClick}>{children}</button>,
}));

jest.mock('js-cookie', () => ({
  remove: jest.fn(),
}));

import Cookie from 'js-cookie';
import { useRouter } from 'next/router';
const mockUseAppContext = useAppContext as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockPush = jest.fn();

beforeEach(() => {
  mockUseRouter.mockReturnValue({ asPath: '/', push: mockPush });
  mockUseAppContext.mockReturnValue({ user: null, setUser: jest.fn(), initialized: true });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('Layout — structure', () => {
  it('renders a skip-to-main-content link', () => {
    render(<Layout>content</Layout>);
    const skip = screen.getByText(/skip to main content/i);
    expect(skip).toBeInTheDocument();
    expect(skip.closest('a')).toHaveAttribute('href', '#main-content');
  });

  it('renders the main-content landmark', () => {
    render(<Layout><span>page body</span></Layout>);
    expect(document.getElementById('main-content')).toBeInTheDocument();
  });

  it('renders children inside the main-content container', () => {
    render(<Layout><span data-testid="child">hello</span></Layout>);
    const child = screen.getByTestId('child');
    expect(document.getElementById('main-content')).toContainElement(child);
  });

  it('renders the footer', () => {
    render(<Layout>x</Layout>);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });
});

describe('Layout — Navigation (logged out)', () => {
  it('shows Log In and Sign Up links when user is null', () => {
    render(<Layout>x</Layout>);
    expect(screen.getByRole('link', { name: /log in/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  it('shows a Pricing link when logged out', () => {
    render(<Layout>x</Layout>);
    const pricingLinks = screen.getAllByRole('link', { name: /pricing/i });
    expect(pricingLinks.length).toBeGreaterThan(0);
  });

  it('does not show Log Out or My List when user is null', () => {
    render(<Layout>x</Layout>);
    expect(screen.queryByRole('button', { name: /log out/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /my list/i })).not.toBeInTheDocument();
  });
});

describe('Layout — Navigation (logged in)', () => {
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
      setUser: jest.fn(),
      initialized: true,
    });
  });

  it('shows the username as a link to /account in the nav', () => {
    render(<Layout>x</Layout>);
    const usernameLink = screen.getByRole('link', { name: 'alice' });
    expect(usernameLink).toHaveAttribute('href', '/account');
  });

  it('shows My List link when logged in', () => {
    render(<Layout>x</Layout>);
    expect(screen.getByRole('link', { name: /my list/i })).toBeInTheDocument();
  });

  it('shows Log Out button when logged in', () => {
    render(<Layout>x</Layout>);
    expect(screen.getByRole('button', { name: /log out/i })).toBeInTheDocument();
  });

  it('does not show Log In or Sign Up when logged in', () => {
    render(<Layout>x</Layout>);
    expect(screen.queryByRole('link', { name: /log in/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /sign up/i })).not.toBeInTheDocument();
  });

  it('clears the user and navigates to / on log out', () => {
    const mockSetUser = jest.fn();
    mockUseAppContext.mockReturnValue({
      user: mockUser,
      setUser: mockSetUser,
      initialized: true,
    });

    render(<Layout>x</Layout>);
    fireEvent.click(screen.getByRole('button', { name: /log out/i }));

    expect(mockSetUser).toHaveBeenCalledWith(null);
    expect(Cookie.remove).toHaveBeenCalledWith('token');
    expect(mockPush).toHaveBeenCalledWith('/');
  });
});

describe('Layout — Hamburger menu', () => {
  it('renders a hamburger button', () => {
    render(<Layout>x</Layout>);
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });

  it('hamburger button starts with aria-expanded false', () => {
    render(<Layout>x</Layout>);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    expect(hamburger).toHaveAttribute('aria-expanded', 'false');
  });

  it('hamburger button controls the nav-menu element', () => {
    render(<Layout>x</Layout>);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    expect(hamburger).toHaveAttribute('aria-controls', 'nav-menu');
    expect(document.getElementById('nav-menu')).toBeInTheDocument();
  });

  it('toggles aria-expanded and label when clicked', () => {
    render(<Layout>x</Layout>);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(hamburger);
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /close menu/i })).toHaveAttribute('aria-expanded', 'true');
  });

  it('closes the menu when Escape is pressed', () => {
    render(<Layout>x</Layout>);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(hamburger);
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false');
  });

  it('does not close the menu when a non-Escape key is pressed', () => {
    render(<Layout>x</Layout>);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(hamburger);
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Tab' });
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();
  });

  it('closes the menu when a nav link is clicked', () => {
    render(<Layout>x</Layout>);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(hamburger);
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('link', { name: /pricing/i }));
    expect(screen.getByRole('button', { name: /open menu/i })).toBeInTheDocument();
  });

  it('closes the menu on route change', () => {
    render(<Layout>x</Layout>);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(hamburger);
    expect(screen.getByRole('button', { name: /close menu/i })).toBeInTheDocument();

    mockUseRouter.mockReturnValue({ asPath: '/explore', push: mockPush });
    render(<Layout>x</Layout>);
    const newHamburger = screen.getAllByRole('button', { name: /open menu/i });
    expect(newHamburger[newHamburger.length - 1]).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the menu when Log In link is clicked (logged out)', () => {
    render(<Layout>x</Layout>);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(hamburger);
    fireEvent.click(screen.getByRole('link', { name: /log in/i }));
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the menu when Sign Up link is clicked (logged out)', () => {
    render(<Layout>x</Layout>);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(hamburger);
    fireEvent.click(screen.getByRole('link', { name: /sign up/i }));
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Layout — currentUrl fallback', () => {
  it('renders without error when router.asPath is undefined', () => {
    mockUseRouter.mockReturnValue({ asPath: undefined, push: mockPush });
    render(<Layout><span>child</span></Layout>);
    expect(screen.getByText('child')).toBeInTheDocument();
  });
});

describe('Layout — Hamburger menu (logged in)', () => {
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
      setUser: jest.fn(),
      initialized: true,
    });
  });

  it('closes the menu when My List link is clicked', () => {
    render(<Layout>x</Layout>);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(hamburger);
    fireEvent.click(screen.getByRole('link', { name: /my list/i }));
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the menu when Pricing link is clicked while logged in', () => {
    render(<Layout>x</Layout>);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(hamburger);
    fireEvent.click(screen.getByRole('link', { name: /pricing/i }));
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false');
  });

  it('closes the menu when the account (username) link is clicked', () => {
    render(<Layout>x</Layout>);
    const hamburger = screen.getByRole('button', { name: /open menu/i });
    fireEvent.click(hamburger);
    fireEvent.click(screen.getByRole('link', { name: 'alice' }));
    expect(screen.getByRole('button', { name: /open menu/i })).toHaveAttribute('aria-expanded', 'false');
  });
});
