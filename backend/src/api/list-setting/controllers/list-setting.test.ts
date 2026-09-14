const mockDbQuery = jest.fn();

jest.mock('@strapi/strapi', () => ({
  factories: {
    createCoreController: (_uid: string, cb: (params: { strapi: unknown }) => unknown) =>
      cb({ strapi: { db: { query: mockDbQuery } } }),
  },
}));

import rawListSettingController from './list-setting';

type ListSettingController = {
  find: (ctx: Record<string, unknown>) => Promise<unknown>;
  create: (ctx: Record<string, unknown>) => Promise<unknown>;
  getPublicList: (ctx: Record<string, unknown>) => Promise<unknown>;
};

// The generated Strapi types for `factories.createCoreController` don't reflect the
// custom action object it produces at runtime, so the default export needs a manual cast.
const listSettingController = rawListSettingController as unknown as ListSettingController;

function createCtx(overrides: Record<string, unknown> = {}) {
  return {
    state: {},
    params: {},
    request: { body: {} },
    notFound: jest.fn((msg: string) => ({ status: 404, msg })),
    ...overrides,
  } as Record<string, unknown> & { notFound: jest.Mock; status?: number };
}

describe('list-setting controller', () => {
  const listSettingQuery = { findMany: jest.fn(), findOne: jest.fn() };
  const userQuery = { findMany: jest.fn() };
  const listItemQuery = { findMany: jest.fn() };
  const superCreate = jest.fn();
  const sanitizeOutput = jest.fn((data: unknown) => Promise.resolve(data));
  const transformResponse = jest.fn((data: unknown) => ({ data }));

  beforeEach(() => {
    jest.clearAllMocks();
    mockDbQuery.mockImplementation((uid: string) => {
      if (uid === 'api::list-setting.list-setting') return listSettingQuery;
      if (uid === 'plugin::users-permissions.user') return userQuery;
      if (uid === 'api::list-item.list-item') return listItemQuery;
      throw new Error(`unexpected db.query uid: ${uid}`);
    });
    sanitizeOutput.mockImplementation((data: unknown) => Promise.resolve(data));
    transformResponse.mockImplementation((data: unknown) => ({ data }));
    // `find`/`create` call `this.sanitizeOutput`/`this.transformResponse`/`super.create`,
    // which are normally provided by the base core controller Strapi merges this object
    // into at runtime; stub them the same way here.
    Object.assign(listSettingController, { sanitizeOutput, transformResponse });
    Object.setPrototypeOf(listSettingController, { create: superCreate });
  });

  describe('find', () => {
    it('scopes results to the authenticated user and sanitizes/transforms the response', async () => {
      listSettingQuery.findMany.mockResolvedValue([{ id: 1, isPublic: true }]);
      const ctx = createCtx({ state: { user: { id: 5 } } });

      const result = await listSettingController.find(ctx);

      expect(listSettingQuery.findMany).toHaveBeenCalledWith({ where: { user: 5 } });
      expect(sanitizeOutput).toHaveBeenCalledWith([{ id: 1, isPublic: true }], ctx);
      expect(transformResponse).toHaveBeenCalledWith([{ id: 1, isPublic: true }]);
      expect(result).toEqual({ data: [{ id: 1, isPublic: true }] });
    });
  });

  describe('create', () => {
    it('injects the authenticated user id into the request body before delegating to the core create', async () => {
      superCreate.mockResolvedValue({ data: { id: 1 } });
      const ctx = createCtx({
        state: { user: { id: 5 } },
        request: { body: { data: { isPublic: true } } },
      });

      const result = await listSettingController.create(ctx);

      expect((ctx.request as { body: { data: Record<string, unknown> } }).body.data).toEqual({
        isPublic: true,
        user: 5,
      });
      expect(superCreate).toHaveBeenCalledWith(ctx);
      expect(result).toEqual({ data: { id: 1 } });
    });

    it('defaults the body data to an empty object when none is provided', async () => {
      superCreate.mockResolvedValue({ data: {} });
      const ctx = createCtx({ state: { user: { id: 5 } }, request: { body: {} } });

      await listSettingController.create(ctx);

      expect((ctx.request as { body: { data: Record<string, unknown> } }).body.data).toEqual({
        user: 5,
      });
    });
  });

  describe('getPublicList', () => {
    it('returns notFound when the user does not exist', async () => {
      userQuery.findMany.mockResolvedValue([]);
      const ctx = createCtx({ params: { username: 'ghost' } });

      const result = await listSettingController.getPublicList(ctx);

      expect(ctx.notFound).toHaveBeenCalledWith('User not found');
      expect(result).toEqual({ status: 404, msg: 'User not found' });
    });

    it('returns 403 when the user has no public list setting', async () => {
      userQuery.findMany.mockResolvedValue([{ id: 1, username: 'alice' }]);
      listSettingQuery.findOne.mockResolvedValue({ isPublic: false });
      const ctx = createCtx({ params: { username: 'alice' } });

      const result = await listSettingController.getPublicList(ctx);

      expect(ctx.status).toBe(403);
      expect(result).toEqual({ error: 'This list is private' });
    });

    it('returns 403 when the user has no list setting at all', async () => {
      userQuery.findMany.mockResolvedValue([{ id: 1, username: 'alice' }]);
      listSettingQuery.findOne.mockResolvedValue(null);
      const ctx = createCtx({ params: { username: 'alice' } });

      const result = await listSettingController.getPublicList(ctx);

      expect(ctx.status).toBe(403);
      expect(result).toEqual({ error: 'This list is private' });
    });

    it('returns the users items when their list setting is public', async () => {
      userQuery.findMany.mockResolvedValue([{ id: 1, username: 'alice' }]);
      listSettingQuery.findOne.mockResolvedValue({ isPublic: true });
      listItemQuery.findMany.mockResolvedValue([
        {
          documentId: 'item-1',
          name: 'The British Museum',
          category: 'Museums',
          completed: true,
          osm_id: 'n1',
        },
      ]);
      const ctx = createCtx({ params: { username: 'alice' } });

      const result = await listSettingController.getPublicList(ctx);

      expect(listItemQuery.findMany).toHaveBeenCalledWith({
        where: { user: 1 },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual({
        data: [
          {
            documentId: 'item-1',
            name: 'The British Museum',
            category: 'Museums',
            completed: true,
            osm_id: 'n1',
          },
        ],
        username: 'alice',
      });
    });
  });
});
