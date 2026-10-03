export type AuthenticatedUser = {
  id: number;
  email: string;
  username?: string;
  isPro?: boolean;
};

type AuthContext = {
  state: { user?: unknown };
};

/**
 * Returns the authenticated user, or calls ctx.unauthorized and returns null.
 * Use this instead of inline `ctx.state.user as {...}` casts.
 */
export function requireAuth(ctx: AuthContext): AuthenticatedUser | null {
  const user = ctx.state.user as AuthenticatedUser | undefined;
  if (!user?.id) {
    (ctx as unknown as { unauthorized: (m: string) => void }).unauthorized(
      'Authentication required',
    );
    return null;
  }
  return user;
}
