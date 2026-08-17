import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ListVisibilityToggle from './list-visibility-toggle';

jest.mock('../../context/AppContext', () => ({
  useAppContext: jest.fn(),
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

import { useAppContext } from '../../context/AppContext';
const mockUseAppContext = useAppContext as jest.Mock;

const LOGGED_IN_USER = {
  id: '1',
  documentId: 'u1',
  email: 'alice@example.com',
  username: 'alice',
  isPro: false,
};

const PRO_USER = { ...LOGGED_IN_USER, isPro: true };

// jsdom provides window.location.origin as "http://localhost"
const EXPECTED_ORIGIN = 'http://localhost';

beforeEach(() => {
  mockUseAppContext.mockReturnValue({ user: LOGGED_IN_USER, setUser: jest.fn(), initialized: true });
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: jest.fn().mockResolvedValue(undefined) },
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('ListVisibilityToggle — label and checkbox', () => {
  it('renders the list name in the label', () => {
    render(
      <ListVisibilityToggle
        listDocumentId="list-1"
        isPublic={false}
        onToggle={jest.fn()}
        listName="Weekend Wanders"
      />,
    );

    expect(screen.getByText(/Weekend Wanders/)).toBeInTheDocument();
  });

  it('renders an unchecked checkbox when isPublic is false', () => {
    render(
      <ListVisibilityToggle
        listDocumentId="list-1"
        isPublic={false}
        onToggle={jest.fn()}
        listName="Weekend Wanders"
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();
  });

  it('renders a checked checkbox when isPublic is true', () => {
    render(
      <ListVisibilityToggle
        listDocumentId="list-1"
        isPublic={true}
        onToggle={jest.fn()}
        listName="Weekend Wanders"
      />,
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeChecked();
  });

  it('calls onToggle when the checkbox is changed', () => {
    const onToggle = jest.fn();
    render(
      <ListVisibilityToggle
        listDocumentId="list-1"
        isPublic={false}
        onToggle={onToggle}
        listName="Weekend Wanders"
      />,
    );

    fireEvent.click(screen.getByRole('checkbox'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});

describe('ListVisibilityToggle — share URL', () => {
  it('shows a share link and copy button when isPublic is true', () => {
    render(
      <ListVisibilityToggle
        listDocumentId="list-abc"
        isPublic={true}
        onToggle={jest.fn()}
        listName="My List"
      />,
    );

    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `${EXPECTED_ORIGIN}/list/alice/list-abc`);
    expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
  });

  it('does not show the share URL when isPublic is false', () => {
    render(
      <ListVisibilityToggle
        listDocumentId="list-abc"
        isPublic={false}
        onToggle={jest.fn()}
        listName="My List"
      />,
    );

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Copy link' })).not.toBeInTheDocument();
  });

  it('copies the share URL to clipboard when "Copy link" is clicked', async () => {
    render(
      <ListVisibilityToggle
        listDocumentId="list-abc"
        isPublic={true}
        onToggle={jest.fn()}
        listName="My List"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
      `${EXPECTED_ORIGIN}/list/alice/list-abc`,
    );
  });

  it('shows "Copied!" immediately after clicking the copy button', async () => {
    jest.useFakeTimers();

    render(
      <ListVisibilityToggle
        listDocumentId="list-abc"
        isPublic={true}
        onToggle={jest.fn()}
        listName="My List"
      />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));

    expect(screen.getByRole('button', { name: 'Copied!' })).toBeInTheDocument();

    jest.runAllTimers();
    jest.useRealTimers();

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Copy link' })).toBeInTheDocument();
    });
  });

  it('does not show share URL when the user is not logged in', () => {
    mockUseAppContext.mockReturnValue({ user: null, setUser: jest.fn(), initialized: true });

    render(
      <ListVisibilityToggle
        listDocumentId="list-abc"
        isPublic={true}
        onToggle={jest.fn()}
        listName="My List"
      />,
    );

    expect(screen.queryByRole('link', { name: /alice\/list-abc/ })).not.toBeInTheDocument();
  });
});

describe('ListVisibilityToggle — Pro gating for private lists', () => {
  it('shows an upgrade prompt when a free user tries to make a public list private', () => {
    mockUseAppContext.mockReturnValue({ user: LOGGED_IN_USER, setUser: jest.fn(), initialized: true });
    const onToggle = jest.fn();

    render(
      <ListVisibilityToggle
        listDocumentId="list-1"
        isPublic={true}
        onToggle={onToggle}
        listName="Weekend Wanders"
      />,
    );

    fireEvent.click(screen.getByRole('checkbox'));

    expect(screen.getByText(/private lists are a pro feature/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /upgrade to pro/i })).toHaveAttribute('href', '/pricing');
    expect(onToggle).not.toHaveBeenCalled();
  });

  it('does not call onToggle when a free user tries to make a public list private', () => {
    mockUseAppContext.mockReturnValue({ user: LOGGED_IN_USER, setUser: jest.fn(), initialized: true });
    const onToggle = jest.fn();

    render(
      <ListVisibilityToggle
        listDocumentId="list-1"
        isPublic={true}
        onToggle={onToggle}
        listName="Weekend Wanders"
      />,
    );

    fireEvent.click(screen.getByRole('checkbox'));

    expect(onToggle).not.toHaveBeenCalled();
  });

  it('calls onToggle normally when a Pro user makes a public list private', () => {
    mockUseAppContext.mockReturnValue({ user: PRO_USER, setUser: jest.fn(), initialized: true });
    const onToggle = jest.fn();

    render(
      <ListVisibilityToggle
        listDocumentId="list-1"
        isPublic={true}
        onToggle={onToggle}
        listName="Weekend Wanders"
      />,
    );

    fireEvent.click(screen.getByRole('checkbox'));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/private lists are a pro feature/i)).not.toBeInTheDocument();
  });

  it('allows a free user to make a private list public without any gating', () => {
    mockUseAppContext.mockReturnValue({ user: LOGGED_IN_USER, setUser: jest.fn(), initialized: true });
    const onToggle = jest.fn();

    render(
      <ListVisibilityToggle
        listDocumentId="list-1"
        isPublic={false}
        onToggle={onToggle}
        listName="Weekend Wanders"
      />,
    );

    fireEvent.click(screen.getByRole('checkbox'));

    expect(onToggle).toHaveBeenCalledTimes(1);
    expect(screen.queryByText(/private lists are a pro feature/i)).not.toBeInTheDocument();
  });

  it('does not show the upgrade prompt initially', () => {
    mockUseAppContext.mockReturnValue({ user: LOGGED_IN_USER, setUser: jest.fn(), initialized: true });

    render(
      <ListVisibilityToggle
        listDocumentId="list-1"
        isPublic={true}
        onToggle={jest.fn()}
        listName="Weekend Wanders"
      />,
    );

    expect(screen.queryByText(/private lists are a pro feature/i)).not.toBeInTheDocument();
  });
});
