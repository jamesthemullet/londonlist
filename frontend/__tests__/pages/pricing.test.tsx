import { render, screen, fireEvent } from '@testing-library/react';
import PricingPage, { buildPricingJsonLd } from '../../pages/pricing';

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

jest.mock('js-cookie', () => ({
  get: jest.fn(),
}));

import Cookie from 'js-cookie';
import { useRouter } from 'next/router';
import { useAppContext } from '../../context/AppContext';
const mockUseAppContext = useAppContext as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;
const mockCookieGet = Cookie.get as jest.Mock;

beforeEach(() => {
  mockUseAppContext.mockReturnValue({ user: null, setUser: jest.fn(), initialized: true });
  mockUseRouter.mockReturnValue({ query: {}, push: jest.fn() });
  mockCookieGet.mockReturnValue('mock-token');
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

  it('renders the Pro tier price as £3.99 by default (monthly)', () => {
    render(<PricingPage />);
    expect(screen.getByText('£3.99')).toBeInTheDocument();
  });
});

describe('PricingPage — billing toggle', () => {
  it('renders Monthly and Annual toggle buttons', () => {
    render(<PricingPage />);
    expect(screen.getByRole('button', { name: /^monthly$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /annual/i })).toBeInTheDocument();
  });

  it('Monthly toggle is active by default', () => {
    render(<PricingPage />);
    expect(screen.getByRole('button', { name: /^monthly$/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /annual/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('switching to Annual shows the discounted monthly-equivalent price', () => {
    render(<PricingPage />);
    fireEvent.click(screen.getByRole('button', { name: /annual/i }));
    expect(screen.getByText('£3.33')).toBeInTheDocument();
  });

  it('switching to Annual shows the annual billing total', () => {
    render(<PricingPage />);
    fireEvent.click(screen.getByRole('button', { name: /annual/i }));
    expect(screen.getByText(/billed as £39\.99\/year/i)).toBeInTheDocument();
  });

  it('switching to Annual shows the struck-through monthly price', () => {
    render(<PricingPage />);
    fireEvent.click(screen.getByRole('button', { name: /annual/i }));
    expect(screen.getByText('£3.99')).toBeInTheDocument();
  });

  it('Annual toggle becomes active after clicking', () => {
    render(<PricingPage />);
    fireEvent.click(screen.getByRole('button', { name: /annual/i }));
    expect(screen.getByRole('button', { name: /annual/i })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /^monthly$/i })).toHaveAttribute('aria-pressed', 'false');
  });

  it('switching back to Monthly removes the annual billing note', () => {
    render(<PricingPage />);
    fireEvent.click(screen.getByRole('button', { name: /annual/i }));
    fireEvent.click(screen.getByRole('button', { name: /^monthly$/i }));
    expect(screen.queryByText(/billed as £39\.99\/year/i)).not.toBeInTheDocument();
  });

  it('renders "Save 2 months" badge on the Annual toggle option', () => {
    render(<PricingPage />);
    expect(screen.getByText(/save 2 months/i)).toBeInTheDocument();
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
    expect(screen.getByText('View counts on each public list')).toBeInTheDocument();
  });
});

describe('PricingPage — CTAs for unauthenticated users', () => {
  it('shows "Get started free" link pointing to /register', () => {
    mockUseAppContext.mockReturnValue({ user: null, setUser: jest.fn(), initialized: true });
    render(<PricingPage />);
    const link = screen.getByRole('link', { name: /get started free/i });
    expect(link).toHaveAttribute('href', '/register');
  });

  it('shows the "Start 14-day free trial" button and a sign-in note', () => {
    render(<PricingPage />);
    expect(screen.getByRole('button', { name: /start 14-day free trial/i })).toBeEnabled();
    expect(screen.getByText(/you.ll need to sign in first/i)).toBeInTheDocument();
  });

  it('shows the trial pricing note', () => {
    render(<PricingPage />);
    expect(screen.getByText(/14 days free.*£3\.99\/month/i)).toBeInTheDocument();
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

  it('shows a Pro confirmation message and manage subscription button instead of the upgrade button for Pro users', () => {
    mockUseAppContext.mockReturnValue({
      user: { id: '1', documentId: 'u1', email: 'a@b.com', username: 'alice', isPro: true },
      setUser: jest.fn(),
      initialized: true,
    });
    render(<PricingPage />);
    expect(screen.queryByRole('button', { name: /start 14-day free trial/i })).not.toBeInTheDocument();
    expect(screen.getByText(/you.re on pro/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /manage subscription/i })).toBeInTheDocument();
  });

  it('calls the customer portal API when Pro user clicks "Manage subscription"', async () => {
    mockUseAppContext.mockReturnValue({
      user: { id: '1', documentId: 'u1', email: 'a@b.com', username: 'alice', isPro: true },
      setUser: jest.fn(),
      initialized: true,
    });

    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ url: 'https://billing.stripe.com/session/test' }),
    });

    render(<PricingPage />);
    fireEvent.click(screen.getByRole('button', { name: /manage subscription/i }));

    await screen.findByRole('button', { name: /opening/i });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/stripe/customer-portal'),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('shows an error message if billing portal fails to open', async () => {
    mockUseAppContext.mockReturnValue({
      user: { id: '1', documentId: 'u1', email: 'a@b.com', username: 'alice', isPro: true },
      setUser: jest.fn(),
      initialized: true,
    });

    global.fetch = jest.fn().mockResolvedValue({ ok: false });

    render(<PricingPage />);
    fireEvent.click(screen.getByRole('button', { name: /manage subscription/i }));

    expect(await screen.findByText(/something went wrong opening the billing portal/i)).toBeInTheDocument();
  });
});

describe('buildPricingJsonLd', () => {
  const SITE_URL = 'https://londonlist.vercel.app';

  it('returns a SoftwareApplication schema', () => {
    const ld = buildPricingJsonLd(SITE_URL) as Record<string, unknown>;
    expect(ld['@context']).toBe('https://schema.org');
    expect(ld['@type']).toBe('SoftwareApplication');
  });

  it('sets the app url to the provided siteUrl', () => {
    const ld = buildPricingJsonLd('https://example.com') as Record<string, unknown>;
    expect(ld.url).toBe('https://example.com');
  });

  it('includes three Offer objects (Free, Pro Monthly, Pro Annual)', () => {
    const ld = buildPricingJsonLd(SITE_URL) as Record<string, unknown>;
    const offers = ld.offers as Record<string, unknown>[];
    expect(offers).toHaveLength(3);
    expect(offers.every((o) => o['@type'] === 'Offer')).toBe(true);
  });

  it('Free offer has price 0 GBP', () => {
    const offers = (buildPricingJsonLd(SITE_URL) as Record<string, unknown>).offers as Record<string, unknown>[];
    const free = offers.find((o) => o.name === 'Free');
    expect(free?.price).toBe('0');
    expect(free?.priceCurrency).toBe('GBP');
  });

  it('Pro monthly offer has price 3.99 GBP with monthly billing increment', () => {
    const offers = (buildPricingJsonLd(SITE_URL) as Record<string, unknown>).offers as Record<string, unknown>[];
    const monthly = offers.find((o) => o.name === 'Pro — Monthly');
    expect(monthly?.price).toBe('3.99');
    expect(monthly?.priceCurrency).toBe('GBP');
    expect(monthly?.billingIncrement).toBe('P1M');
  });

  it('Pro annual offer has price 39.99 GBP with annual billing increment', () => {
    const offers = (buildPricingJsonLd(SITE_URL) as Record<string, unknown>).offers as Record<string, unknown>[];
    const annual = offers.find((o) => o.name === 'Pro — Annual');
    expect(annual?.price).toBe('39.99');
    expect(annual?.priceCurrency).toBe('GBP');
    expect(annual?.billingIncrement).toBe('P1Y');
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

  it('renders a FAQ item explaining the 14-day free trial', () => {
    render(<PricingPage />);
    expect(screen.getByText(/how does the 14-day free trial work/i)).toBeInTheDocument();
  });

  it('renders the billing comparison FAQ item', () => {
    render(<PricingPage />);
    expect(
      screen.getByText(/what is the difference between monthly and annual billing/i),
    ).toBeInTheDocument();
  });
});
