/** @type {import('next').NextConfig} */
const isDev = process.env.NODE_ENV !== 'production';

const scriptSrcParts = ["'self'", ...(isDev ? ["'unsafe-eval'"] : []), "'unsafe-inline'"];
const connectSrcParts = [
  "'self'",
  'https://photon.komoot.io',
  process.env.STRAPI_URL || 'http://127.0.0.1:1337',
  ...(isDev ? ['http://localhost:1337'] : []),
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '1337',
        pathname: '/uploads/**',
      },
    ],
  },
  env: {
    STRAPI_URL: process.env.STRAPI_URL,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src ${scriptSrcParts.join(' ')}`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https://tile.openstreetmap.org",
              "font-src 'self'",
              `connect-src ${connectSrcParts.join(' ')}`,
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer(nextConfig);
