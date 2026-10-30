import indexPlugin, { isOwnedBy, requireUser } from './index';

describe('isOwnedBy', () => {
  it('returns true when the document user id matches', () => {
    expect(isOwnedBy({ user: { id: 1 } }, 1)).toBe(true);
  });

  it('returns false when the document user id does not match', () => {
    expect(isOwnedBy({ user: { id: 2 } }, 1)).toBe(false);
  });

  it('returns false when the document has no user', () => {
    expect(isOwnedBy({ user: null }, 1)).toBe(false);
  });

  it('returns false when the document itself is null', () => {
    expect(isOwnedBy(null, 1)).toBe(false);
  });
});

describe('requireUser', () => {
  it('returns the user when context.state.user is set', () => {
    const user = { id: 7 };
    expect(requireUser({ state: { user } })).toBe(user);
  });

  it('throws Forbidden access when there is no user', () => {
    expect(() => requireUser({ state: {} })).toThrow('Forbidden access');
  });

  it('throws Forbidden access when state is missing', () => {
    expect(() => requireUser({})).toThrow('Forbidden access');
  });
});

type Resolve = (parent: unknown, args: unknown, context: unknown) => Promise<unknown>;

type ResolverMap = {
  Query: {
    listItems: { resolve: Resolve };
  };
  Mutation: {
    updateListItem: { resolve: Resolve };
    deleteListItem: { resolve: Resolve };
    createMyList: { resolve: Resolve };
    updateMyList: { resolve: Resolve };
    deleteMyList: { resolve: Resolve };
  };
};

function getResolvers(strapi: unknown): ResolverMap {
  const use = jest.fn();
  const mockStrapi = {
    ...(strapi as object),
    plugin: jest.fn(() => ({ service: jest.fn(() => ({ use })) })),
  };

  (indexPlugin as { register: (args: { strapi: unknown }) => void }).register({ strapi: mockStrapi });

  const factory = use.mock.calls[0][0] as () => { resolvers: ResolverMap };
  return factory().resolvers;
}

describe('GraphQL resolvers — ownership checks', () => {
  const context = { state: { user: { id: 1 } } };

  describe('listItems', () => {
    it('throws Forbidden access when the requested list is not owned by the caller', async () => {
      const listDocuments = { findOne: jest.fn().mockResolvedValue({ user: { id: 2 } }) };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) => (uid === 'api::list.list' ? listDocuments : {})),
      });

      await expect(
        resolvers.Query.listItems.resolve(
          null,
          { filters: { list: { documentId: { eq: 'list-1' } } } },
          context,
        ),
      ).rejects.toThrow('Forbidden access');
    });

    it('throws Forbidden access when the requested list does not exist', async () => {
      const listDocuments = { findOne: jest.fn().mockResolvedValue(null) };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) => (uid === 'api::list.list' ? listDocuments : {})),
      });

      await expect(
        resolvers.Query.listItems.resolve(
          null,
          { filters: { list: { documentId: { eq: 'list-1' } } } },
          context,
        ),
      ).rejects.toThrow('Forbidden access');
    });

    it('returns the list items when the list is owned by the caller', async () => {
      const listItems = [{ documentId: 'item-1' }];
      const listDocuments = {
        findOne: jest.fn().mockResolvedValue({ user: { id: 1 }, list_items: listItems }),
      };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) => (uid === 'api::list.list' ? listDocuments : {})),
      });

      const result = await resolvers.Query.listItems.resolve(
        null,
        { filters: { list: { documentId: { eq: 'list-1' } } } },
        context,
      );

      expect(result).toBe(listItems);
    });
  });

  describe('updateListItem', () => {
    it('throws Forbidden access when the item is not owned by the caller', async () => {
      const listItemDocuments = {
        findOne: jest.fn().mockResolvedValue({ user: { id: 2 } }),
        update: jest.fn(),
      };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) =>
          uid === 'api::list-item.list-item' ? listItemDocuments : {},
        ),
      });

      await expect(
        resolvers.Mutation.updateListItem.resolve(
          null,
          { documentId: 'item-1', data: { completed: true } },
          context,
        ),
      ).rejects.toThrow('Forbidden access');
      expect(listItemDocuments.update).not.toHaveBeenCalled();
    });

    it('throws Forbidden access when the item does not exist', async () => {
      const listItemDocuments = { findOne: jest.fn().mockResolvedValue(null), update: jest.fn() };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) =>
          uid === 'api::list-item.list-item' ? listItemDocuments : {},
        ),
      });

      await expect(
        resolvers.Mutation.updateListItem.resolve(
          null,
          { documentId: 'item-1', data: { completed: true } },
          context,
        ),
      ).rejects.toThrow('Forbidden access');
    });

    it('updates the item when owned by the caller', async () => {
      const listItemDocuments = {
        findOne: jest.fn().mockResolvedValue({ user: { id: 1 } }),
        update: jest.fn().mockResolvedValue({ documentId: 'item-1', completed: true }),
      };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) =>
          uid === 'api::list-item.list-item' ? listItemDocuments : {},
        ),
      });

      const result = await resolvers.Mutation.updateListItem.resolve(
        null,
        { documentId: 'item-1', data: { completed: true } },
        context,
      );

      expect(listItemDocuments.update).toHaveBeenCalledWith({
        documentId: 'item-1',
        data: { completed: true },
      });
      expect(result).toEqual({ documentId: 'item-1', completed: true });
    });
  });

  describe('deleteListItem', () => {
    it('throws Forbidden access when the item is not owned by the caller', async () => {
      const listItemDocuments = {
        findOne: jest.fn().mockResolvedValue({ user: { id: 2 } }),
        delete: jest.fn(),
      };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) =>
          uid === 'api::list-item.list-item' ? listItemDocuments : {},
        ),
      });

      await expect(
        resolvers.Mutation.deleteListItem.resolve(null, { documentId: 'item-1' }, context),
      ).rejects.toThrow('Forbidden access');
      expect(listItemDocuments.delete).not.toHaveBeenCalled();
    });

    it('throws Forbidden access when the item does not exist', async () => {
      const listItemDocuments = { findOne: jest.fn().mockResolvedValue(null), delete: jest.fn() };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) =>
          uid === 'api::list-item.list-item' ? listItemDocuments : {},
        ),
      });

      await expect(
        resolvers.Mutation.deleteListItem.resolve(null, { documentId: 'item-1' }, context),
      ).rejects.toThrow('Forbidden access');
    });

    it('deletes the item when owned by the caller', async () => {
      const listItemDocuments = {
        findOne: jest.fn().mockResolvedValue({ user: { id: 1 } }),
        delete: jest.fn().mockResolvedValue({ documentId: 'item-1' }),
      };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) =>
          uid === 'api::list-item.list-item' ? listItemDocuments : {},
        ),
      });

      const result = await resolvers.Mutation.deleteListItem.resolve(
        null,
        { documentId: 'item-1' },
        context,
      );

      expect(listItemDocuments.delete).toHaveBeenCalledWith({ documentId: 'item-1' });
      expect(result).toEqual({ documentId: 'item-1' });
    });
  });

  describe('createMyList', () => {
    function strapiFor(options: {
      isPro?: boolean;
      existingLists?: unknown[];
      created?: unknown;
    }) {
      const listDocuments = {
        findMany: jest.fn().mockResolvedValue(options.existingLists ?? []),
        create: jest.fn().mockResolvedValue(options.created ?? { documentId: 'new-list' }),
      };
      const listItemQuery = { updateMany: jest.fn().mockResolvedValue(undefined) };
      return {
        documents: jest.fn((uid: string) => (uid === 'api::list.list' ? listDocuments : {})),
        db: {
          query: jest.fn((uid: string) => {
            if (uid === 'plugin::users-permissions.user') {
              return { findOne: jest.fn().mockResolvedValue({ id: 1, isPro: options.isPro ?? false }) };
            }
            return listItemQuery;
          }),
        },
        listDocuments,
        listItemQuery,
      };
    }

    it('throws the free-plan list limit error when a non-pro user is at the limit', async () => {
      const strapi = strapiFor({
        isPro: false,
        existingLists: [{ documentId: 'l1' }, { documentId: 'l2' }, { documentId: 'l3' }],
      });
      const resolvers = getResolvers(strapi);

      await expect(
        resolvers.Mutation.createMyList.resolve(null, { name: 'Weekend trip' }, context),
      ).rejects.toMatchObject({
        message: 'Free plan limit reached',
        extensions: { code: 'FREE_LIST_LIMIT_REACHED' },
      });
      expect(strapi.listDocuments.create).not.toHaveBeenCalled();
    });

    it('creates the list for a non-pro user under the limit', async () => {
      const strapi = strapiFor({ isPro: false, existingLists: [{ documentId: 'l1' }] });
      const resolvers = getResolvers(strapi);

      const result = await resolvers.Mutation.createMyList.resolve(
        null,
        { name: 'Weekend trip', description: 'Fun stuff' },
        context,
      );

      expect(strapi.listDocuments.create).toHaveBeenCalledWith({
        data: { name: 'Weekend trip', description: 'Fun stuff', isPublic: false, user: 1 },
      });
      expect(result).toEqual({ documentId: 'new-list' });
    });

    it('creates the list for a pro user even at or above the free limit', async () => {
      const strapi = strapiFor({
        isPro: true,
        existingLists: [{ documentId: 'l1' }, { documentId: 'l2' }, { documentId: 'l3' }],
      });
      const resolvers = getResolvers(strapi);

      await resolvers.Mutation.createMyList.resolve(null, { name: 'Weekend trip' }, context);

      expect(strapi.listDocuments.create).toHaveBeenCalled();
    });

    it('migrates pre-existing unassigned items when creating the first list', async () => {
      const strapi = strapiFor({
        isPro: false,
        existingLists: [],
        created: { id: 42, documentId: 'new-list' },
      });
      const resolvers = getResolvers(strapi);

      await resolvers.Mutation.createMyList.resolve(null, { name: 'First list' }, context);

      expect(strapi.listItemQuery.updateMany).toHaveBeenCalledWith({
        where: { user: 1, list: null },
        data: { list: 42 },
      });
    });

    it('does not migrate unassigned items when the user already has a list', async () => {
      const strapi = strapiFor({ isPro: false, existingLists: [{ documentId: 'l1' }] });
      const resolvers = getResolvers(strapi);

      await resolvers.Mutation.createMyList.resolve(null, { name: 'Another list' }, context);

      expect(strapi.listItemQuery.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('updateMyList', () => {
    it('throws Forbidden access when the list is not owned by the caller', async () => {
      const listDocuments = {
        findOne: jest.fn().mockResolvedValue({ user: { id: 2 } }),
        update: jest.fn(),
      };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) => (uid === 'api::list.list' ? listDocuments : {})),
      });

      await expect(
        resolvers.Mutation.updateMyList.resolve(
          null,
          { documentId: 'list-1', name: 'New name' },
          context,
        ),
      ).rejects.toThrow('Forbidden access');
      expect(listDocuments.update).not.toHaveBeenCalled();
    });

    it('throws Forbidden access when the list does not exist', async () => {
      const listDocuments = { findOne: jest.fn().mockResolvedValue(null), update: jest.fn() };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) => (uid === 'api::list.list' ? listDocuments : {})),
      });

      await expect(
        resolvers.Mutation.updateMyList.resolve(
          null,
          { documentId: 'list-1', name: 'New name' },
          context,
        ),
      ).rejects.toThrow('Forbidden access');
    });

    it('updates only the fields provided when owned by the caller', async () => {
      const listDocuments = {
        findOne: jest.fn().mockResolvedValue({ user: { id: 1 } }),
        update: jest.fn().mockResolvedValue({ documentId: 'list-1', isPublic: true }),
      };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) => (uid === 'api::list.list' ? listDocuments : {})),
      });

      const result = await resolvers.Mutation.updateMyList.resolve(
        null,
        { documentId: 'list-1', isPublic: true },
        context,
      );

      expect(listDocuments.update).toHaveBeenCalledWith({
        documentId: 'list-1',
        data: { isPublic: true },
      });
      expect(result).toEqual({ documentId: 'list-1', isPublic: true });
    });
  });

  describe('deleteMyList', () => {
    it('throws Forbidden access when the list is not owned by the caller', async () => {
      const listDocuments = {
        findOne: jest.fn().mockResolvedValue({ user: { id: 2 } }),
        delete: jest.fn(),
      };
      const listItemQuery = { deleteMany: jest.fn() };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) => (uid === 'api::list.list' ? listDocuments : {})),
        db: { query: jest.fn(() => listItemQuery) },
      });

      await expect(
        resolvers.Mutation.deleteMyList.resolve(null, { documentId: 'list-1' }, context),
      ).rejects.toThrow('Forbidden access');
      expect(listDocuments.delete).not.toHaveBeenCalled();
      expect(listItemQuery.deleteMany).not.toHaveBeenCalled();
    });

    it('throws Forbidden access when the list does not exist', async () => {
      const listDocuments = { findOne: jest.fn().mockResolvedValue(null), delete: jest.fn() };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) => (uid === 'api::list.list' ? listDocuments : {})),
        db: { query: jest.fn(() => ({ deleteMany: jest.fn() })) },
      });

      await expect(
        resolvers.Mutation.deleteMyList.resolve(null, { documentId: 'list-1' }, context),
      ).rejects.toThrow('Forbidden access');
    });

    it('deletes the list and its items when owned by the caller', async () => {
      const listDocuments = {
        findOne: jest.fn().mockResolvedValue({ user: { id: 1 } }),
        delete: jest.fn().mockResolvedValue(undefined),
      };
      const listItemQuery = { deleteMany: jest.fn().mockResolvedValue(undefined) };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) => (uid === 'api::list.list' ? listDocuments : {})),
        db: { query: jest.fn(() => listItemQuery) },
      });

      const result = await resolvers.Mutation.deleteMyList.resolve(
        null,
        { documentId: 'list-1' },
        context,
      );

      expect(listItemQuery.deleteMany).toHaveBeenCalledWith({
        where: { list: { document_id: 'list-1' } },
      });
      expect(listDocuments.delete).toHaveBeenCalledWith({ documentId: 'list-1' });
      expect(result).toBe(true);
    });
  });
});
