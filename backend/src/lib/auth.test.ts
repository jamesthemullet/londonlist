import { requireAuth, type AuthenticatedUser } from './auth';

describe('requireAuth', () => {
  it('returns the user when ctx.state.user has an id', () => {
    const mockUser: AuthenticatedUser = { id: 1, email: 'user@example.com' };
    const ctx = { state: { user: mockUser }, unauthorized: jest.fn() };
    const result = requireAuth(ctx);
    expect(result).toEqual(mockUser);
    expect(ctx.unauthorized).not.toHaveBeenCalled();
  });

  it('calls unauthorized and returns null when user is undefined', () => {
    const ctx = { state: { user: undefined }, unauthorized: jest.fn() };
    const result = requireAuth(ctx);
    expect(result).toBeNull();
    expect(ctx.unauthorized).toHaveBeenCalledWith('Authentication required');
  });

  it('calls unauthorized and returns null when user has no id', () => {
    const ctx = { state: { user: {} }, unauthorized: jest.fn() };
    const result = requireAuth(ctx);
    expect(result).toBeNull();
    expect(ctx.unauthorized).toHaveBeenCalledWith('Authentication required');
  });

  it('returns user with optional Pro and username fields', () => {
    const mockUser: AuthenticatedUser = {
      id: 42,
      email: 'pro@example.com',
      username: 'proPerson',
      isPro: true,
    };
    const ctx = { state: { user: mockUser }, unauthorized: jest.fn() };
    const result = requireAuth(ctx);
    expect(result).toEqual(mockUser);
    expect(result?.isPro).toBe(true);
    expect(result?.username).toBe('proPerson');
  });
});
