import accountController from './account';

function createCtx(overrides: Record<string, unknown> = {}) {
  return {
    state: {},
    unauthorized: jest.fn((msg: string) => ({ status: 401, msg })),
    ...overrides,
  } as Record<string, unknown> & { unauthorized: jest.Mock; status?: number };
}

describe('account controller', () => {
  const listQuery = { findMany: jest.fn() };
  const listItemQuery = { deleteMany: jest.fn() };
  const userQuery = { delete: jest.fn() };
  const listDocuments = { delete: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    (global as unknown as { strapi: unknown }).strapi = {
      db: {
        query: jest.fn((uid: string) => {
          if (uid === 'api::list.list') return listQuery;
          if (uid === 'api::list-item.list-item') return listItemQuery;
          if (uid === 'plugin::users-permissions.user') return userQuery;
          throw new Error(`unexpected db.query uid: ${uid}`);
        }),
      },
      documents: jest.fn((uid: string) => {
        if (uid === 'api::list.list') return listDocuments;
        throw new Error(`unexpected documents uid: ${uid}`);
      }),
    };
  });

  describe('deleteAccount', () => {
    it('returns unauthorized when there is no authenticated user', async () => {
      const ctx = createCtx();

      const result = await accountController.deleteAccount(ctx);

      expect(ctx.unauthorized).toHaveBeenCalledWith('Authentication required');
      expect(result).toEqual({ status: 401, msg: 'Authentication required' });
    });

    it('deletes the users lists, their items, and the user record', async () => {
      listQuery.findMany.mockResolvedValue([
        { id: 1, documentId: 'list-1' },
        { id: 2, documentId: 'list-2' },
      ]);
      const ctx = createCtx({ state: { user: { id: 7 } } });

      const result = await accountController.deleteAccount(ctx);

      expect(listQuery.findMany).toHaveBeenCalledWith({
        where: { user: { id: 7 } },
        select: ['id', 'documentId'],
      });
      expect(listItemQuery.deleteMany).toHaveBeenCalledWith({
        where: { list: { documentId: 'list-1' } },
      });
      expect(listItemQuery.deleteMany).toHaveBeenCalledWith({
        where: { list: { documentId: 'list-2' } },
      });
      expect(listDocuments.delete).toHaveBeenCalledWith({ documentId: 'list-1' });
      expect(listDocuments.delete).toHaveBeenCalledWith({ documentId: 'list-2' });
      expect(userQuery.delete).toHaveBeenCalledWith({ where: { id: 7 } });
      expect(ctx.status).toBe(200);
      expect(result).toEqual({ deleted: true });
    });

    it('deletes only the user record when the user has no lists', async () => {
      listQuery.findMany.mockResolvedValue([]);
      const ctx = createCtx({ state: { user: { id: 9 } } });

      const result = await accountController.deleteAccount(ctx);

      expect(listItemQuery.deleteMany).not.toHaveBeenCalled();
      expect(listDocuments.delete).not.toHaveBeenCalled();
      expect(userQuery.delete).toHaveBeenCalledWith({ where: { id: 9 } });
      expect(result).toEqual({ deleted: true });
    });
  });
});
