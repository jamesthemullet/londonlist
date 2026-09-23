import { renderHook } from '@testing-library/react';
import { useQuery } from '@apollo/client/react';
import { usePlanLimits } from './use-plan-limits';

jest.mock('@apollo/client', () => ({
  gql: (strings: TemplateStringsArray) => strings,
}));

jest.mock('@apollo/client/react', () => ({
  useQuery: jest.fn(),
}));

const mockUseQuery = useQuery as unknown as jest.Mock;

afterEach(() => {
  jest.resetAllMocks();
});

describe('usePlanLimits', () => {
  it('returns data from the GraphQL query when available', () => {
    mockUseQuery.mockReturnValue({
      data: { planLimits: { freeListLimit: 5, freeItemLimit: 30 } },
    });
    const { result } = renderHook(() => usePlanLimits());
    expect(result.current).toEqual({ freeListLimit: 5, freeItemLimit: 30 });
  });

  it('returns default limits when query data is undefined', () => {
    mockUseQuery.mockReturnValue({ data: undefined });
    const { result } = renderHook(() => usePlanLimits());
    expect(result.current).toEqual({ freeListLimit: 3, freeItemLimit: 20 });
  });

  it('returns default limits while the query is loading', () => {
    mockUseQuery.mockReturnValue({ data: undefined, loading: true });
    const { result } = renderHook(() => usePlanLimits());
    expect(result.current).toEqual({ freeListLimit: 3, freeItemLimit: 20 });
  });

  it('uses cache-first fetch policy', () => {
    mockUseQuery.mockReturnValue({ data: undefined });
    renderHook(() => usePlanLimits());
    expect(mockUseQuery).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ fetchPolicy: 'cache-first' }),
    );
  });
});
