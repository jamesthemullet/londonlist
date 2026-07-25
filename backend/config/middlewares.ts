export default [
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      enabled: true,
      origin: (process.env.FRONTEND_URL || 'http://localhost:3000').split(',').map((s: string) => s.trim()),
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
