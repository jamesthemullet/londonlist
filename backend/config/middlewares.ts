if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
  throw new Error(
    'FRONTEND_URL must be set in production — refusing to silently fall back to a localhost CORS origin.',
  );
}

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:3000')
  .split(',')
  .map((s: string) => s.trim());

const vercelPreviewOrigin = /^https:\/\/londonlist-[a-z0-9]+-james-winfields-projects\.vercel\.app$/;

export default [
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: (ctx: { request: { header: { origin?: string } } }) => {
        const requestOrigin = ctx.request.header.origin;
        if (!requestOrigin) return allowedOrigins[0];
        if (allowedOrigins.includes(requestOrigin) || vercelPreviewOrigin.test(requestOrigin)) {
          return requestOrigin;
        }
        return allowedOrigins[0];
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::logger',
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      includeUnparsed: true,
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];
