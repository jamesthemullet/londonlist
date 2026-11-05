/**
 * Lightweight mock of the Strapi REST + GraphQL API for Playwright e2e tests.
 * Listens on http://127.0.0.1:1337 (the default STRAPI_URL fallback) so SSR
 * pages pick it up without any extra configuration.
 *
 * Known fixtures exposed to spec files via the FIXTURE_* exports.
 */

import http from 'node:http';

const PORT = Number.parseInt(process.env.MOCK_STRAPI_PORT ?? '1337', 10);

// ─── Fixtures (re-use these values in spec files) ────────────────────────────

export const FIXTURE_USERNAME = 'publicuser';
export const FIXTURE_LIST_ID = 'list-public-abc123';
export const FIXTURE_PRIVATE_LIST_ID = 'list-private-xyz789';

const PROFILE_DATA = {
  username: FIXTURE_USERNAME,
  lists: [
    {
      documentId: FIXTURE_LIST_ID,
      name: 'London Highlights',
      description: 'Must-see spots in London',
      itemCount: 2,
      completedCount: 1,
      isPublic: true,
    },
  ],
};

const LIST_DETAIL = {
  data: [
    {
      documentId: 'item-1',
      name: 'The British Museum',
      category: 'Museum',
      completed: false,
      osm_id: 'way/12345',
      visitedAt: null,
      notes: null,
      lat: 51.5194,
      lng: -0.127,
    },
    {
      documentId: 'item-2',
      name: 'Covent Garden',
      category: 'Market',
      completed: true,
      osm_id: 'node/67890',
      visitedAt: '2024-06-01',
      notes: null,
      lat: 51.5117,
      lng: -0.124,
    },
  ],
  username: FIXTURE_USERNAME,
  listName: 'London Highlights',
  description: 'Must-see spots in London',
  viewCount: 42,
};

const PUBLIC_LISTS = [
  {
    documentId: FIXTURE_LIST_ID,
    name: 'London Highlights',
    username: FIXTURE_USERNAME,
    itemCount: 2,
    completedCount: 1,
    categories: ['Museum', 'Market'],
    description: 'Must-see spots in London',
  },
];

const PLACE_BY_OSM_ID = {
  'way/12345': { osm_id: 'way/12345', name: 'The British Museum', category: 'Museum', lat: 51.5194, lng: -0.127 },
  'node/67890': { osm_id: 'node/67890', name: 'Covent Garden', category: 'Market', lat: 51.5117, lng: -0.124 },
};

const RELATED_PLACES_BY_OSM_ID = {
  'way/12345': [
    { osm_id: 'node/11111', name: 'Natural History Museum', category: 'Museum', lat: 51.4966, lng: -0.1764 },
  ],
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(data));
}

async function readBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

// ─── Server ──────────────────────────────────────────────────────────────────

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const { pathname } = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`);

  // ── POST /graphql ──────────────────────────────────────────────────────────
  if (pathname === '/graphql' && req.method === 'POST') {
    const raw = await readBody(req);
    const { query = '', variables = {} } = JSON.parse(raw || '{}');

    if (query.includes('GetPlace') || (query.includes('place(') && !query.includes('relatedPlaces'))) {
      const osmId = variables.osm_id ?? '';
      return sendJson(res, 200, { data: { place: PLACE_BY_OSM_ID[osmId] ?? null } });
    }
    if (query.includes('GetRelatedPlaces') || query.includes('relatedPlaces')) {
      const osmId = variables.osm_id ?? '';
      return sendJson(res, 200, { data: { relatedPlaces: RELATED_PLACES_BY_OSM_ID[osmId] ?? [] } });
    }
    return sendJson(res, 200, { data: {} });
  }

  // ── GET /api/lists/public/<username>/<listId> ──────────────────────────────
  const listDetailMatch = pathname.match(/^\/api\/lists\/public\/([^/]+)\/([^/]+)$/);
  if (listDetailMatch && req.method === 'GET') {
    const [, username, listId] = listDetailMatch;
    if (username === FIXTURE_USERNAME && listId === FIXTURE_PRIVATE_LIST_ID) {
      return sendJson(res, 403, { error: 'Private' });
    }
    if (username === FIXTURE_USERNAME && listId === FIXTURE_LIST_ID) {
      return sendJson(res, 200, LIST_DETAIL);
    }
    return sendJson(res, 404, { error: 'Not found' });
  }

  // ── GET /api/lists/public/<username> ──────────────────────────────────────
  const profileMatch = pathname.match(/^\/api\/lists\/public\/([^/]+)$/);
  if (profileMatch && req.method === 'GET') {
    const [, username] = profileMatch;
    if (username === FIXTURE_USERNAME) {
      return sendJson(res, 200, PROFILE_DATA);
    }
    return sendJson(res, 404, { error: 'Not found' });
  }

  // ── GET /api/lists/public ─────────────────────────────────────────────────
  if (pathname === '/api/lists/public' && req.method === 'GET') {
    return sendJson(res, 200, { data: PUBLIC_LISTS });
  }

  // ── Catch-all ─────────────────────────────────────────────────────────────
  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, '127.0.0.1');
