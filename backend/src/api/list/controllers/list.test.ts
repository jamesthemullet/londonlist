jest.mock('@strapi/strapi', () => ({
  factories: {
    createCoreController:
      (_uid: string, cfg: (args: { strapi: unknown }) => Record<string, unknown>) =>
      (args: { strapi: unknown }) =>
        cfg(args),
  },
}));

import listControllerFactory from './list';

function createCtx(overrides: Record<string, unknown> = {}) {
  return {
    query: {},
    params: {},
    status: undefined as number | undefined,
    notFound: jest.fn((msg: string) => ({ status: 404, msg })),
    ...overrides,
  };
}

describe('list controller', () => {
  const listDocuments = {
    findMany: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
  };
  const listItemDocuments = {
    findMany: jest.fn(),
  };
  const userQuery = {
    findMany: jest.fn(),
  };

  const strapiMock = {
    documents: jest.fn((uid: string) => {
      if (uid === 'api::list.list') return listDocuments;
      if (uid === 'api::list-item.list-item') return listItemDocuments;
      throw new Error(`unexpected uid: ${uid}`);
    }),
    db: {
      query: jest.fn(() => userQuery),
    },
  };

  const listController = (
    listControllerFactory as unknown as (args: { strapi: unknown }) => Record<string, (ctx: unknown) => unknown>
  )({ strapi: strapiMock });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPublicLists', () => {
    it('defaults to page 1, pageSize 20 and maps list fields', async () => {
      listDocuments.findMany.mockResolvedValue([
        {
          documentId: 'l1',
          name: 'My List',
          description: 'desc',
          user: { username: 'alice' },
          viewCount: 5,
          list_items: [
            { category: 'food', completed: true },
            { category: 'food', completed: false },
            { category: 'parks', completed: false },
            { category: null, completed: false },
          ],
        },
      ]);
      const ctx = createCtx();

      const result = await listController.getAllPublicLists(ctx);

      expect(listDocuments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 20, offset: 0 }),
      );
      expect(result).toEqual({
        data: [
          {
            documentId: 'l1',
            name: 'My List',
            description: 'desc',
            username: 'alice',
            viewCount: 5,
            itemCount: 4,
            categories: ['food', 'parks'],
          },
        ],
      });
    });

    it('defaults missing description/username/viewCount to null/0', async () => {
      listDocuments.findMany.mockResolvedValue([
        { documentId: 'l2', name: 'Bare List', list_items: [] },
      ]);
      const ctx = createCtx();

      const result = await listController.getAllPublicLists(ctx);

      expect(result).toEqual({
        data: [
          {
            documentId: 'l2',
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

    it('clamps pageSize to the 1-100 range and paginates by page', async () => {
      listDocuments.findMany.mockResolvedValue([]);
      const ctx = createCtx({ query: { page: 3, pageSize: 500 } });

      await listController.getAllPublicLists(ctx);

      expect(listDocuments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 100, offset: 200 }),
      );
    });

    it('clamps pageSize up to a minimum of 1', async () => {
      listDocuments.findMany.mockResolvedValue([]);
      const ctx = createCtx({ query: { pageSize: 0 } });

      await listController.getAllPublicLists(ctx);

      expect(listDocuments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 1 }),
      );
    });
  });

  describe('getPublicListsByUsername', () => {
    it('returns notFound when the user does not exist', async () => {
      userQuery.findMany.mockResolvedValue([]);
      const ctx = createCtx({ params: { username: 'nobody' } });

      const result = await listController.getPublicListsByUsername(ctx);

      expect(ctx.notFound).toHaveBeenCalledWith('User not found');
      expect(result).toEqual({ status: 404, msg: 'User not found' });
    });

    it('returns username and lists with item/completed counts', async () => {
      userQuery.findMany.mockResolvedValue([{ id: 1, username: 'alice' }]);
      listDocuments.findMany.mockResolvedValue([
        { documentId: 'l1', name: 'List One', description: 'a list' },
      ]);
      listItemDocuments.findMany.mockResolvedValue([
        { completed: true },
        { completed: false },
        { completed: true },
      ]);
      const ctx = createCtx({ params: { username: 'alice' } });

      const result = await listController.getPublicListsByUsername(ctx);

      expect(result).toEqual({
        username: 'alice',
        lists: [
          {
            documentId: 'l1',
            name: 'List One',
            description: 'a list',
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
      const ctx = createCtx({ params: { username: 'nobody', listId: 'l1' } });

      const result = await listController.getPublicList(ctx);

      expect(ctx.notFound).toHaveBeenCalledWith('User not found');
      expect(result).toEqual({ status: 404, msg: 'User not found' });
    });

    it('returns notFound when the list does not exist', async () => {
      userQuery.findMany.mockResolvedValue([{ id: 1, username: 'alice' }]);
      listDocuments.findOne.mockResolvedValue(null);
      const ctx = createCtx({ params: { username: 'alice', listId: 'missing' } });

      const result = await listController.getPublicList(ctx);

      expect(ctx.notFound).toHaveBeenCalledWith('List not found');
      expect(result).toEqual({ status: 404, msg: 'List not found' });
    });

    it('returns notFound when the list belongs to a different user', async () => {
      userQuery.findMany.mockResolvedValue([{ id: 1, username: 'alice' }]);
      listDocuments.findOne.mockResolvedValue({
        documentId: 'l1',
        isPublic: true,
        user: { id: 2 },
      });
      const ctx = createCtx({ params: { username: 'alice', listId: 'l1' } });

      const result = await listController.getPublicList(ctx);

      expect(ctx.notFound).toHaveBeenCalledWith('List not found');
      expect(result).toEqual({ status: 404, msg: 'List not found' });
    });

    it('returns 403 when the list is not public', async () => {
      userQuery.findMany.mockResolvedValue([{ id: 1, username: 'alice' }]);
      listDocuments.findOne.mockResolvedValue({
        documentId: 'l1',
        isPublic: false,
        user: { id: 1 },
      });
      const ctx = createCtx({ params: { username: 'alice', listId: 'l1' } });

      const result = await listController.getPublicList(ctx);

      expect(ctx.status).toBe(403);
      expect(result).toEqual({ error: 'This list is private' });
    });

    it('increments viewCount and returns items for an owned, public list', async () => {
      userQuery.findMany.mockResolvedValue([{ id: 1, username: 'alice' }]);
      listDocuments.findOne.mockResolvedValue({
        documentId: 'l1',
        name: 'My List',
        description: 'a list',
        isPublic: true,
        viewCount: 4,
        user: { id: 1 },
      });
      listItemDocuments.findMany.mockResolvedValue([
        {
          documentId: 'i1',
          name: 'Item One',
          category: 'food',
          completed: true,
          osm_id: 'osm1',
          visitedAt: '2026-01-01',
          notes: 'great',
          lat: 51.5,
          lng: -0.1,
        },
      ]);
      const ctx = createCtx({ params: { username: 'alice', listId: 'l1' } });

      const result = await listController.getPublicList(ctx);

      expect(listDocuments.update).toHaveBeenCalledWith({
        documentId: 'l1',
        data: { viewCount: 5 },
      });
      expect(result).toEqual({
        data: [
          {
            documentId: 'i1',
            name: 'Item One',
            category: 'food',
            completed: true,
            osm_id: 'osm1',
            visitedAt: '2026-01-01',
            notes: 'great',
            lat: 51.5,
            lng: -0.1,
          },
        ],
        username: 'alice',
        listName: 'My List',
        description: 'a list',
        viewCount: 5,
      });
    });

    it('defaults missing viewCount, notes, description, lat/lng, and visitedAt to null/0', async () => {
      userQuery.findMany.mockResolvedValue([{ id: 1, username: 'alice' }]);
      listDocuments.findOne.mockResolvedValue({
        documentId: 'l1',
        name: 'Bare List',
        isPublic: true,
        user: { id: 1 },
      });
      listItemDocuments.findMany.mockResolvedValue([
        { documentId: 'i1', name: 'Item One', category: 'food', completed: false, osm_id: 'osm1' },
      ]);
      const ctx = createCtx({ params: { username: 'alice', listId: 'l1' } });

      const result = await listController.getPublicList(ctx);

      expect(listDocuments.update).toHaveBeenCalledWith({
        documentId: 'l1',
        data: { viewCount: 1 },
      });
      expect(result).toEqual(
        expect.objectContaining({
          description: null,
          viewCount: 1,
          data: [
            expect.objectContaining({
              visitedAt: null,
              notes: null,
              lat: null,
              lng: null,
            }),
          ],
        }),
      );
    });
  });
});
