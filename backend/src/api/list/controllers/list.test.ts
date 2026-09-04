const listDocuments = {
  findMany: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
};

const listItemDocuments = {
  findMany: jest.fn(),
};

const mockStrapi = {
  documents: jest.fn((uid: string) => {
    if (uid === 'api::list.list') return listDocuments;
    if (uid === 'api::list-item.list-item') return listItemDocuments;
    throw new Error(`Unexpected documents uid: ${uid}`);
  }),
  db: {
    query: jest.fn(() => userQuery),
  },
};

const userQuery = { findMany: jest.fn() };

jest.mock('@strapi/strapi', () => ({
  factories: {
    createCoreController: (_uid: string, cb: (args: { strapi: typeof mockStrapi }) => unknown) =>
      cb({ strapi: mockStrapi }),
  },
}));

import listControllerFactory from './list';

const listController = listControllerFactory as unknown as {
  getAllPublicLists: (ctx: MockCtx) => Promise<unknown>;
  getPublicListsByUsername: (ctx: MockCtx) => Promise<unknown>;
  getPublicList: (ctx: MockCtx) => Promise<unknown>;
};

type MockCtx = Record<string, unknown>;

function createCtx(overrides: MockCtx = {}): MockCtx {
  return {
    query: {},
    params: {},
    notFound: jest.fn((msg?: string) => ({ status: 404, msg })),
    ...overrides,
  };
}

describe('list controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPublicLists', () => {
    it('defaults to page 1 / pageSize 20 and filters to public lists', async () => {
      listDocuments.findMany.mockResolvedValue([]);
      const ctx = createCtx();

      await listController.getAllPublicLists(ctx);

      expect(listDocuments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: { isPublic: { $eq: true } },
          limit: 20,
          offset: 0,
        }),
      );
    });

    it('clamps an oversized pageSize to 100', async () => {
      listDocuments.findMany.mockResolvedValue([]);
      const ctx = createCtx({ query: { pageSize: 500 } });

      await listController.getAllPublicLists(ctx);

      expect(listDocuments.findMany).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }));
    });

    it('clamps a zero/negative pageSize to 1', async () => {
      listDocuments.findMany.mockResolvedValue([]);
      const ctx = createCtx({ query: { pageSize: 0 } });

      await listController.getAllPublicLists(ctx);

      expect(listDocuments.findMany).toHaveBeenCalledWith(expect.objectContaining({ limit: 1 }));
    });

    it('computes offset from page and pageSize', async () => {
      listDocuments.findMany.mockResolvedValue([]);
      const ctx = createCtx({ query: { page: 3, pageSize: 10 } });

      await listController.getAllPublicLists(ctx);

      expect(listDocuments.findMany).toHaveBeenCalledWith(expect.objectContaining({ offset: 20 }));
    });

    it('maps lists with defaults and deduplicated categories', async () => {
      listDocuments.findMany.mockResolvedValue([
        {
          documentId: 'list-1',
          name: 'My List',
          user: { username: 'alice' },
          viewCount: 5,
          description: 'desc',
          list_items: [{ category: 'food', completed: false }, { category: 'food', completed: true }, { category: 'travel', completed: false }],
        },
        {
          documentId: 'list-2',
          name: 'Bare List',
          user: null,
          list_items: [],
        },
      ]);
      const ctx = createCtx();

      const result = await listController.getAllPublicLists(ctx);

      expect(result).toEqual({
        data: [
          {
            documentId: 'list-1',
            name: 'My List',
            description: 'desc',
            username: 'alice',
            viewCount: 5,
            itemCount: 3,
            categories: ['food', 'travel'],
          },
          {
            documentId: 'list-2',
            name: 'Bare List',
            description: null,
            username: null,
            viewCount: 0,
            itemCount: 0,
            categories: [],
          },
        ],
      });
    });
  });

  describe('getPublicListsByUsername', () => {
    it('returns notFound when the user does not exist', async () => {
      userQuery.findMany.mockResolvedValue([]);
      const ctx = createCtx({ params: { username: 'ghost' } });

      const result = await listController.getPublicListsByUsername(ctx);

      expect(ctx.notFound).toHaveBeenCalledWith('User not found');
      expect(result).toEqual({ status: 404, msg: 'User not found' });
    });

    it('returns public lists for the user with item and completed counts', async () => {
      userQuery.findMany.mockResolvedValue([{ id: 1, username: 'alice' }]);
      listDocuments.findMany.mockResolvedValue([
        { documentId: 'list-1', name: 'My List', description: 'desc' },
      ]);
      listItemDocuments.findMany.mockResolvedValue([
        { completed: true },
        { completed: false },
        { completed: true },
      ]);
      const ctx = createCtx({ params: { username: 'alice' } });

      const result = await listController.getPublicListsByUsername(ctx);

      expect(listDocuments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          filters: { isPublic: { $eq: true }, user: { id: { $eq: 1 } } },
        }),
      );
      expect(result).toEqual({
        username: 'alice',
        lists: [
          {
            documentId: 'list-1',
            name: 'My List',
            description: 'desc',
            itemCount: 3,
            completedCount: 2,
          },
        ],
      });
    });
  });

  describe('getPublicList', () => {
    it('returns notFound when the user does not exist', async () => {
      userQuery.findMany.mockResolvedValue([]);
      const ctx = createCtx({ params: { username: 'ghost', listId: 'list-1' } });

      await listController.getPublicList(ctx);

      expect(ctx.notFound).toHaveBeenCalledWith('User not found');
    });

    it('returns notFound when the list does not exist', async () => {
      userQuery.findMany.mockResolvedValue([{ id: 1, username: 'alice' }]);
      listDocuments.findOne.mockResolvedValue(null);
      const ctx = createCtx({ params: { username: 'alice', listId: 'list-1' } });

      await listController.getPublicList(ctx);

      expect(ctx.notFound).toHaveBeenCalledWith('List not found');
    });

    it('returns notFound when the list is not owned by the resolved user', async () => {
      userQuery.findMany.mockResolvedValue([{ id: 1, username: 'alice' }]);
      listDocuments.findOne.mockResolvedValue({
        documentId: 'list-1',
        user: { id: 2 },
        isPublic: true,
      });
      const ctx = createCtx({ params: { username: 'alice', listId: 'list-1' } });

      await listController.getPublicList(ctx);

      expect(ctx.notFound).toHaveBeenCalledWith('List not found');
    });

    it('returns 403 when the list is private', async () => {
      userQuery.findMany.mockResolvedValue([{ id: 1, username: 'alice' }]);
      listDocuments.findOne.mockResolvedValue({
        documentId: 'list-1',
        user: { id: 1 },
        isPublic: false,
      });
      const ctx = createCtx({ params: { username: 'alice', listId: 'list-1' } });

      const result = await listController.getPublicList(ctx);

      expect(ctx.status).toBe(403);
      expect(result).toEqual({ error: 'This list is private' });
    });

    it('increments viewCount and returns the list items for a public, owned list', async () => {
      userQuery.findMany.mockResolvedValue([{ id: 1, username: 'alice' }]);
      listDocuments.findOne.mockResolvedValue({
        documentId: 'list-1',
        name: 'My List',
        description: 'desc',
        user: { id: 1 },
        isPublic: true,
        viewCount: 4,
      });
      listItemDocuments.findMany.mockResolvedValue([
        {
          documentId: 'item-1',
          name: 'Tower Bridge',
          category: 'landmark',
          completed: false,
          osm_id: 'osm-1',
          visitedAt: null,
          notes: 'nice view',
          lat: 51.5,
          lng: -0.1,
        },
      ]);
      const ctx = createCtx({ params: { username: 'alice', listId: 'list-1' } });

      const result = await listController.getPublicList(ctx);

      expect(listDocuments.update).toHaveBeenCalledWith(
        expect.objectContaining({
          documentId: 'list-1',
          data: { viewCount: 5 },
        }),
      );
      expect(result).toEqual({
        data: [
          {
            documentId: 'item-1',
            name: 'Tower Bridge',
            category: 'landmark',
            completed: false,
            osm_id: 'osm-1',
            visitedAt: null,
            notes: 'nice view',
            lat: 51.5,
            lng: -0.1,
          },
        ],
        username: 'alice',
        listName: 'My List',
        description: 'desc',
        viewCount: 5,
      });
    });
  });
});
