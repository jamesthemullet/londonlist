export function assertFrontendUrlConfigured(env: NodeJS.ProcessEnv = process.env): void {
  if (env.NODE_ENV === 'production' && !env.FRONTEND_URL) {
    throw new Error(
      'FRONTEND_URL environment variable must be set in production — refusing to start with an insecure CORS fallback to http://localhost:3000',
    );
  }
}
