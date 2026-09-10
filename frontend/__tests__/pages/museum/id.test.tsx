import { render, screen, fireEvent } from '@testing-library/react';
import { useQuery } from '@apollo/client/react';
import { useRouter } from 'next/router';
import Museum from '../../../pages/museum/[id]';

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
}));

jest.mock('@apollo/client', () => ({
  gql: jest.fn((strings: TemplateStringsArray) => strings[0]),
}));

jest.mock('next/router', () => ({
  useRouter: jest.fn(),
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
  }: {
    href: string;
    children: React.ReactNode;
  }) => <a href={href}>{children}</a>,
}));

const mockUseQuery = useQuery as unknown as jest.Mock;
const mockUseRouter = useRouter as jest.Mock;

beforeEach(() => {
  mockUseRouter.mockReturnValue({ query: { id: '1' } });
});

afterEach(() => {
  jest.resetAllMocks();
});

describe('Museum page — error state', () => {
  it('shows a heading, a retry action and a link back to Explore when the query fails', () => {
    const refetch = jest.fn();
    mockUseQuery.mockReturnValue({
      loading: false,
      error: new Error('network error'),
      data: undefined,
      refetch,
    });

    render(<Museum />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/error loading museum/i);
    expect(screen.getByRole('link', { name: /back to explore/i })).toHaveAttribute('href', '/explore');

    const retryButton = screen.getByRole('button', { name: /try again/i });
    fireEvent.click(retryButton);
    expect(refetch).toHaveBeenCalledTimes(1);
  });

  it('shows a not-found heading and a link back to Explore when the museum does not exist', () => {
    mockUseQuery.mockReturnValue({
      loading: false,
      error: undefined,
      data: { museum: { data: null } },
      refetch: jest.fn(),
    });

    render(<Museum />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/museum not found/i);
    expect(screen.getByRole('link', { name: /back to explore/i })).toHaveAttribute('href', '/explore');
    expect(screen.queryByRole('button', { name: /try again/i })).not.toBeInTheDocument();
  });
});
