import { renderHook } from '@testing-library/react';
import Cookie from 'js-cookie';
import { useAuthHeader } from './use-auth-header';

jest.mock('js-cookie', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const mockGet = (Cookie as unknown as { get: jest.Mock }).get;

afterEach(() => {
  jest.resetAllMocks();
});

describe('useAuthHeader', () => {
  it('returns a Bearer token when the token cookie is set', () => {
    mockGet.mockReturnValue('my-jwt-token');
    const { result } = renderHook(() => useAuthHeader());
    expect(result.current).toEqual({ Authorization: 'Bearer my-jwt-token' });
  });

  it('returns Bearer with an empty string when no token cookie is present', () => {
    mockGet.mockReturnValue(undefined);
    const { result } = renderHook(() => useAuthHeader());
    expect(result.current).toEqual({ Authorization: 'Bearer ' });
  });

  it('calls Cookie.get with the key "token"', () => {
    mockGet.mockReturnValue('');
    renderHook(() => useAuthHeader());
    expect(mockGet).toHaveBeenCalledWith('token');
  });
});
