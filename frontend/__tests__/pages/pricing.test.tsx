import { render, screen } from '@testing-library/react';
import PricingPage from '../../pages/pricing';

jest.mock('../../context/AppContext', () => ({
  useAppContext: jest.fn(),
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

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

import { useRouter } from 'next/router';
import { useAppContext } from '../../context/AppContext';
const mockUseAppContext = useAppContext as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

beforeEach(() => {
  mockUseAppContext.mockReturnValue({ user: null, setUser: jest.fn(), initialized: true });
  mockUseRouter.mockReturnValue({ query: {}, push: jest.fn() });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('PricingPage — layout', () => {
  it('renders the page heading', () => {
    render(<PricingPage />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/simple, honest pricing/i);
  });

  it('renders both Free and Pro tier cards', () => {
    render(<PricingPage />);
    expect(screen.getByRole('heading', { name: /^free$/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /^pro$/i })).toBeInTheDocument();
  });

  it('renders the Free tier price as £0', () => {
    render(<PricingPage />);
    expect(screen.getByText('£0')).toBeInTheDocument();
  });

  it('renders the Pro tier price as £3.99', () => {
    render(<PricingPage />);
    expect(screen.getByText('£3.99')).toBeInTheDocument();
  });

});

describe('PricingPage — features', () => {
  it('renders key free tier features', () => {
    render(<PricingPage />);
    expect(screen.getByText('Up to 3 lists')).toBeInTheDocument();
    expect(screen.getByText('Public & private lists')).toBeInTheDocument();
  });

  it('renders key pro tier features', () => {
    render(<PricingPage />);
    expect(screen.getByText('Unlimited lists')).toBeInTheDocument();
    expect(screen.getByText('View counts on your public lists')).toBeInTheDocument();
  });
});

describe('PricingPage — CTAs for unauthenticated users', () => {
  it('shows "Get started free" link pointing to /register', () => {
    mockUseAppContext.mockReturnValue({ user: null, setUser: jest.fn(), initialized: true });
    render(<PricingPage />);
    const link = screen.getByRole('link', { name: /get started free/i });
    expect(link).toHaveAttribute('href', '/register');
  });

  it('shows the "Upgrade to Pro" button and a sign-in note', () => {
    render(<PricingPage />);
    expect(screen.getByRole('button', { name: /upgrade to pro/i })).toBeEnabled();
    expect(screen.getByText(/you.ll need to sign in first/i)).toBeInTheDocument();
  });
});

describe('PricingPage — CTAs for authenticated users', () => {
  it('shows "Go to My Lists" link pointing to /my-list when user is logged in', () => {
    mockUseAppContext.mockReturnValue({
      user: { id: '1', documentId: 'u1', email: 'a@b.com', username: 'alice', isPro: false },
      setUser: jest.fn(),
      initialized: true,
    });
    render(<PricingPage />);
    const link = screen.getByRole('link', { name: /go to my lists/i });
    expect(link).toHaveAttribute('href', '/my-list');
  });

  it('shows a Pro confirmation message instead of the upgrade button for Pro users', () => {
    mockUseAppContext.mockReturnValue({
      user: { id: '1', documentId: 'u1', email: 'a@b.com', username: 'alice', isPro: true },
      setUser: jest.fn(),
      initialized: true,
    });
    render(<PricingPage />);
    expect(screen.queryByRole('button', { name: /upgrade to pro/i })).not.toBeInTheDocument();
    expect(screen.getByText(/you.re already on pro/i)).toBeInTheDocument();
  });
});

describe('PricingPage — FAQ', () => {
  it('renders the FAQ section', () => {
    render(<PricingPage />);
    expect(screen.getByRole('heading', { name: /common questions/i })).toBeInTheDocument();
  });

  it('renders FAQ items', () => {
    render(<PricingPage />);
    expect(screen.getByText(/can i try london list for free/i)).toBeInTheDocument();
    expect(screen.getByText(/can i cancel anytime/i)).toBeInTheDocument();
  });
});
