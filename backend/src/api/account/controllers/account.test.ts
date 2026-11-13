const mockStripeInstance = {
  subscriptions: {
    list: jest.fn(),
    cancel: jest.fn(),
  },
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripeInstance);
});

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
  const listSettingQuery = { deleteMany: jest.fn() };
  const userQuery = { findOne: jest.fn(), delete: jest.fn() };
  const listDocuments = { delete: jest.fn() };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    (global as unknown as { strapi: unknown }).strapi = {
      db: {
        query: jest.fn((uid: string) => {
          if (uid === 'api::list.list') return listQuery;
          if (uid === 'api::list-item.list-item') return listItemQuery;
          if (uid === 'api::list-setting.list-setting') return listSettingQuery;
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

      await accountController.deleteAccount(ctx);

      expect(ctx.unauthorized).toHaveBeenCalledWith('Authentication required');
    });

    it('deletes the users lists, their items, list-settings and the user record', async () => {
      userQuery.findOne.mockResolvedValue({ stripeCustomerId: null });
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
      expect(listSettingQuery.deleteMany).toHaveBeenCalledWith({ where: { user: { id: 7 } } });
      expect(userQuery.delete).toHaveBeenCalledWith({ where: { id: 7 } });
      expect(ctx.status).toBe(200);
      expect(result).toEqual({ deleted: true });
    });

    it('deletes only the user record and list-settings when the user has no lists', async () => {
      userQuery.findOne.mockResolvedValue({ stripeCustomerId: null });
      listQuery.findMany.mockResolvedValue([]);
      const ctx = createCtx({ state: { user: { id: 9 } } });

      const result = await accountController.deleteAccount(ctx);

      expect(listItemQuery.deleteMany).not.toHaveBeenCalled();
      expect(listDocuments.delete).not.toHaveBeenCalled();
      expect(listSettingQuery.deleteMany).toHaveBeenCalledWith({ where: { user: { id: 9 } } });
      expect(userQuery.delete).toHaveBeenCalledWith({ where: { id: 9 } });
      expect(result).toEqual({ deleted: true });
    });

    it('cancels active Stripe subscriptions before deleting the account', async () => {
      userQuery.findOne.mockResolvedValue({ stripeCustomerId: 'cus_abc' });
      mockStripeInstance.subscriptions.list.mockResolvedValue({
        data: [{ id: 'sub_1' }, { id: 'sub_2' }],
      });
      mockStripeInstance.subscriptions.cancel.mockResolvedValue({});
      listQuery.findMany.mockResolvedValue([]);
      const ctx = createCtx({ state: { user: { id: 5 } } });

      await accountController.deleteAccount(ctx);

      expect(mockStripeInstance.subscriptions.list).toHaveBeenCalledWith({
        customer: 'cus_abc',
        status: 'active',
      });
      expect(mockStripeInstance.subscriptions.cancel).toHaveBeenCalledWith('sub_1');
      expect(mockStripeInstance.subscriptions.cancel).toHaveBeenCalledWith('sub_2');
      expect(userQuery.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    });

    it('skips Stripe cancellation when STRIPE_SECRET_KEY is not set', async () => {
      delete process.env.STRIPE_SECRET_KEY;
      userQuery.findOne.mockResolvedValue({ stripeCustomerId: 'cus_abc' });
      listQuery.findMany.mockResolvedValue([]);
      const ctx = createCtx({ state: { user: { id: 5 } } });

      await accountController.deleteAccount(ctx);

      expect(mockStripeInstance.subscriptions.list).not.toHaveBeenCalled();
      expect(userQuery.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    });

    it('skips Stripe cancellation when the user has no stripeCustomerId', async () => {
      userQuery.findOne.mockResolvedValue({ stripeCustomerId: null });
      listQuery.findMany.mockResolvedValue([]);
      const ctx = createCtx({ state: { user: { id: 5 } } });

      await accountController.deleteAccount(ctx);

      expect(mockStripeInstance.subscriptions.list).not.toHaveBeenCalled();
      expect(userQuery.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    });
  });
});
