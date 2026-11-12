// Small stand-in for the Strapi backend's SSR-facing REST/GraphQL endpoints, used only in
// e2e tests. `getServerSideProps` fetches run on the Next.js server and can't be intercepted
// with Playwright's `page.route`, so pages like `list/[username]/[listId]`, `profile/[username]`,
// `explore/[category]` and `place/[type]/[id]` need a real HTTP server to hit instead.
// Unknown usernames/ids 404, matching the current "unreachable backend" fallback behaviour,
// so existing specs are unaffected; e2e specs can add fixtures below to exercise the happy path.
import { createServer } from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';

type ListItem = {
  documentId: string;
  name: string;
  category: string | null;
  completed: boolean;
  osm_id: string;
  visitedAt: string | null;
  notes?: string | null;
  lat?: number | null;
  lng?: number | null;
};

type PublicListFixture = {
  username: string;
  listId: string;
  listName: string;
  description?: string | null;
  viewCount?: number;
  isPublic: boolean;
  items: ListItem[];
};

type PlaceFixture = {
  osm_id: string;
  name: string;
  category: string | null;
  lat: number | null;
  lng: number | null;
};

const PORT = Number(process.env.MOCK_STRAPI_PORT ?? 4001);

const FIXTURE_LISTS: PublicListFixture[] = [
  {
    username: 'e2e-fixture-user',
    listId: 'e2e-fixture-list',
    listName: 'E2E Fixture List',
    description: 'Seeded list for SSR e2e fixtures',
    viewCount: 3,
    isPublic: true,
    items: [
      {
        documentId: 'e2e-fixture-item-1',
        name: 'Tate Modern',
        category: 'museum',
        completed: false,
        osm_id: 'node/1',
        visitedAt: null,
        lat: 51.5076,
        lng: -0.0994,
      },
    ],
  },
  {
    username: 'e2e-fixture-user',
    listId: 'e2e-fixture-private-list',
    listName: 'E2E Fixture Private List',
    description: 'Seeded private list for SSR e2e fixtures',
    viewCount: 0,
    isPublic: false,
    items: [],
  },
];

const FIXTURE_PLACES: PlaceFixture[] = [
  { osm_id: 'node/1', name: 'Tate Modern', category: 'museum', lat: 51.5076, lng: -0.0994 },
];

function sendJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify(body));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

function toPublicExploreList(fixture: PublicListFixture) {
  return {
    documentId: fixture.listId,
    name: fixture.listName,
    username: fixture.username,
    itemCount: fixture.items.length,
    categories: [
      ...new Set(fixture.items.map((item) => item.category).filter((c): c is string => c !== null)),
    ],
  };
}

async function handleGraphql(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const raw = await readBody(req);
  let parsed: { query?: string; variables?: Record<string, unknown> };
  try {
    parsed = raw ? JSON.parse(raw) : {};
  } catch {
    sendJson(res, 400, { errors: [{ message: 'Invalid JSON body' }] });
    return;
  }

  const query = parsed.query ?? '';
  const variables = parsed.variables ?? {};
  const osmId = typeof variables.osm_id === 'string' ? variables.osm_id : null;

  if (query.includes('relatedPlaces(')) {
    const limit = typeof variables.limit === 'number' ? variables.limit : 6;
    const related = FIXTURE_PLACES.filter((place) => place.osm_id !== osmId).slice(0, limit);
    sendJson(res, 200, { data: { relatedPlaces: related } });
    return;
  }

  if (query.includes('place(')) {
    const place = FIXTURE_PLACES.find((p) => p.osm_id === osmId) ?? null;
    sendJson(res, 200, { data: { place } });
    return;
  }

  sendJson(res, 200, { data: null });
}

function handleListDetail(res: ServerResponse, username: string, listId: string): void {
  const fixture = FIXTURE_LISTS.find((l) => l.username === username && l.listId === listId);
  if (!fixture) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }
  if (!fixture.isPublic) {
    sendJson(res, 403, { error: 'Forbidden' });
    return;
  }
  sendJson(res, 200, {
    data: fixture.items,
    username: fixture.username,
    listName: fixture.listName,
    description: fixture.description ?? null,
    viewCount: fixture.viewCount ?? 0,
  });
}

function handleProfile(res: ServerResponse, username: string): void {
  const lists = FIXTURE_LISTS.filter((l) => l.username === username && l.isPublic);
  if (lists.length === 0) {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }
  sendJson(res, 200, {
    username,
    lists: lists.map((l) => ({
      documentId: l.listId,
      name: l.listName,
      description: l.description ?? null,
      itemCount: l.items.length,
      completedCount: l.items.filter((item) => item.completed).length,
    })),
  });
}

function handlePublicListsIndex(res: ServerResponse): void {
  sendJson(res, 200, { data: FIXTURE_LISTS.filter((l) => l.isPublic).map(toPublicExploreList) });
}

const server = createServer((req, res) => {
  const method = req.method ?? 'GET';
  const url = new URL(req.url ?? '/', `http://127.0.0.1:${PORT}`);
  const segments = url.pathname.split('/').filter(Boolean);

  if (method === 'GET' && segments.length === 0) {
    sendJson(res, 200, { status: 'ok' });
    return;
  }

  if (method === 'POST' && url.pathname === '/graphql') {
    handleGraphql(req, res).catch(() => sendJson(res, 500, { errors: [{ message: 'Internal error' }] }));
    return;
  }

  if (method === 'GET' && segments[0] === 'api' && segments[1] === 'lists' && segments[2] === 'public') {
    if (segments.length === 3) {
      handlePublicListsIndex(res);
      return;
    }
    if (segments.length === 4) {
      handleProfile(res, decodeURIComponent(segments[3]));
      return;
    }
    if (segments.length === 5) {
      handleListDetail(res, decodeURIComponent(segments[3]), decodeURIComponent(segments[4]));
      return;
    }
  }

  sendJson(res, 404, { error: 'Not found' });
});

server.listen(PORT, () => {
  console.log(`Mock Strapi API listening on http://127.0.0.1:${PORT}`);
});
