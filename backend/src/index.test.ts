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
    createListItem: { resolve: Resolve };
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
});

describe('createListItem', () => {
  const context = { state: { user: { id: 1 } } };

  function getCreateListItemResolvers(options: {
    list?: { user: { id: number } } | null;
    isPro?: boolean;
    existingItemCount?: number;
  }) {
    const listDocuments = { findOne: jest.fn().mockResolvedValue(options.list ?? null) };
    const listItemDocuments = {
      findMany: jest.fn().mockResolvedValue(
        Array.from({ length: options.existingItemCount ?? 0 }, (_, i) => ({ documentId: `item-${i}` })),
      ),
      create: jest.fn().mockResolvedValue({ documentId: 'new-item' }),
    };
    const findOne = jest.fn().mockResolvedValue(
      options.isPro === undefined ? null : { id: 1, isPro: options.isPro },
    );
    const resolvers = getResolvers({
      documents: jest.fn((uid: string) => {
        if (uid === 'api::list.list') return listDocuments;
        if (uid === 'api::list-item.list-item') return listItemDocuments;
        return {};
      }),
      db: { query: jest.fn(() => ({ findOne })) },
    });

    return { resolvers, listDocuments, listItemDocuments };
  }

  it('throws Forbidden access when the list is not owned by the caller', async () => {
    const { resolvers, listItemDocuments } = getCreateListItemResolvers({
      list: { user: { id: 2 } },
    });

    await expect(
      resolvers.Mutation.createListItem.resolve(
        null,
        { data: { name: 'Item', list: 'list-1' } },
        context,
      ),
    ).rejects.toThrow('Forbidden access');
    expect(listItemDocuments.create).not.toHaveBeenCalled();
  });

  it('throws Forbidden access when the list does not exist', async () => {
    const { resolvers, listItemDocuments } = getCreateListItemResolvers({ list: null });

    await expect(
      resolvers.Mutation.createListItem.resolve(
        null,
        { data: { name: 'Item', list: 'list-1' } },
        context,
      ),
    ).rejects.toThrow('Forbidden access');
    expect(listItemDocuments.create).not.toHaveBeenCalled();
  });

  it('throws Free plan item limit reached when a non-Pro owner is at the limit', async () => {
    const { resolvers, listItemDocuments } = getCreateListItemResolvers({
      list: { user: { id: 1 } },
      isPro: false,
      existingItemCount: 20,
    });

    await expect(
      resolvers.Mutation.createListItem.resolve(
        null,
        { data: { name: 'Item', list: 'list-1' } },
        context,
      ),
    ).rejects.toMatchObject({
      message: 'Free plan item limit reached',
      extensions: { code: 'FREE_ITEM_LIMIT_REACHED' },
    });
    expect(listItemDocuments.create).not.toHaveBeenCalled();
  });

  it('creates the item for a non-Pro owner under the free item limit', async () => {
    const { resolvers, listItemDocuments } = getCreateListItemResolvers({
      list: { user: { id: 1 } },
      isPro: false,
      existingItemCount: 19,
    });

    const result = await resolvers.Mutation.createListItem.resolve(
      null,
      { data: { name: 'Item', list: 'list-1' } },
      context,
    );

    expect(listItemDocuments.create).toHaveBeenCalledWith({
      data: { name: 'Item', user: 1, list: 'list-1' },
    });
    expect(result).toEqual({ documentId: 'new-item' });
  });

  it('creates the item for a Pro owner without checking the free item limit', async () => {
    const { resolvers, listItemDocuments } = getCreateListItemResolvers({
      list: { user: { id: 1 } },
      isPro: true,
    });

    await resolvers.Mutation.createListItem.resolve(
      null,
      { data: { name: 'Item', list: 'list-1' } },
      context,
    );

    expect(listItemDocuments.findMany).not.toHaveBeenCalled();
    expect(listItemDocuments.create).toHaveBeenCalledWith({
      data: { name: 'Item', user: 1, list: 'list-1' },
    });
  });

  it('creates the item with no list and skips ownership/limit checks when no list is supplied', async () => {
    const { resolvers, listDocuments, listItemDocuments } = getCreateListItemResolvers({});

    const result = await resolvers.Mutation.createListItem.resolve(
      null,
      { data: { name: 'Item' } },
      context,
    );

    expect(listDocuments.findOne).not.toHaveBeenCalled();
    expect(listItemDocuments.create).toHaveBeenCalledWith({
      data: { name: 'Item', user: 1, list: null },
    });
    expect(result).toEqual({ documentId: 'new-item' });
  });
});

describe('createMyList', () => {
  const context = { state: { user: { id: 1 } } };

  function getCreateMyListResolvers(options: { isPro?: boolean; existingListCount?: number }) {
    const listDocuments = {
      findMany: jest.fn().mockResolvedValue(
        Array.from({ length: options.existingListCount ?? 0 }, (_, i) => ({ documentId: `list-${i}` })),
      ),
      create: jest.fn().mockResolvedValue({ id: 42, documentId: 'new-list' }),
    };
    const findOne = jest.fn().mockResolvedValue(
      options.isPro === undefined ? null : { id: 1, isPro: options.isPro },
    );
    const updateMany = jest.fn();
    const resolvers = getResolvers({
      documents: jest.fn((uid: string) => (uid === 'api::list.list' ? listDocuments : {})),
      db: { query: jest.fn(() => ({ findOne, updateMany })) },
    });

    return { resolvers, listDocuments, updateMany };
  }

  it('throws Free plan limit reached when a non-Pro user is at the list limit', async () => {
    const { resolvers, listDocuments } = getCreateMyListResolvers({
      isPro: false,
      existingListCount: 3,
    });

    await expect(
      resolvers.Mutation.createMyList.resolve(null, { name: 'My list' }, context),
    ).rejects.toMatchObject({
      message: 'Free plan limit reached',
      extensions: { code: 'FREE_LIST_LIMIT_REACHED' },
    });
    expect(listDocuments.create).not.toHaveBeenCalled();
  });

  it('creates the list for a non-Pro user under the free list limit', async () => {
    const { resolvers, listDocuments } = getCreateMyListResolvers({
      isPro: false,
      existingListCount: 2,
    });

    const result = await resolvers.Mutation.createMyList.resolve(
      null,
      { name: 'My list', description: 'desc' },
      context,
    );

    expect(listDocuments.create).toHaveBeenCalledWith({
      data: { name: 'My list', description: 'desc', isPublic: false, user: 1 },
    });
    expect(result).toEqual({ id: 42, documentId: 'new-list' });
  });

  it('creates the list for a Pro user without checking the free list limit', async () => {
    const { resolvers, listDocuments } = getCreateMyListResolvers({
      isPro: true,
      existingListCount: 5,
    });

    await resolvers.Mutation.createMyList.resolve(null, { name: 'My list' }, context);

    expect(listDocuments.create).toHaveBeenCalledWith({
      data: { name: 'My list', description: null, isPublic: false, user: 1 },
    });
  });

  it('migrates pre-existing unassigned items into the first list created', async () => {
    const { resolvers, updateMany } = getCreateMyListResolvers({ isPro: false, existingListCount: 0 });

    const result = await resolvers.Mutation.createMyList.resolve(null, { name: 'My list' }, context);

    expect(updateMany).toHaveBeenCalledWith({
      where: { user: 1, list: null },
      data: { list: 42 },
    });
    expect(result).toEqual({ id: 42, documentId: 'new-list' });
  });

  it('does not migrate unassigned items when the user already has a list', async () => {
    const { resolvers, updateMany } = getCreateMyListResolvers({ isPro: false, existingListCount: 1 });

    await resolvers.Mutation.createMyList.resolve(null, { name: 'My list' }, context);

    expect(updateMany).not.toHaveBeenCalled();
  });
});

describe('updateMyList', () => {
  const context = { state: { user: { id: 1 } } };

  function getUpdateMyListResolvers(list: { user: { id: number } } | null) {
    const listDocuments = {
      findOne: jest.fn().mockResolvedValue(list),
      update: jest.fn().mockResolvedValue({ documentId: 'list-1', name: 'Updated' }),
    };
    const resolvers = getResolvers({
      documents: jest.fn((uid: string) => (uid === 'api::list.list' ? listDocuments : {})),
    });

    return { resolvers, listDocuments };
  }

  it('throws Forbidden access when the list is not owned by the caller', async () => {
    const { resolvers, listDocuments } = getUpdateMyListResolvers({ user: { id: 2 } });

    await expect(
      resolvers.Mutation.updateMyList.resolve(
        null,
        { documentId: 'list-1', name: 'Updated' },
        context,
      ),
    ).rejects.toThrow('Forbidden access');
    expect(listDocuments.update).not.toHaveBeenCalled();
  });

  it('throws Forbidden access when the list does not exist', async () => {
    const { resolvers, listDocuments } = getUpdateMyListResolvers(null);

    await expect(
      resolvers.Mutation.updateMyList.resolve(
        null,
        { documentId: 'list-1', name: 'Updated' },
        context,
      ),
    ).rejects.toThrow('Forbidden access');
    expect(listDocuments.update).not.toHaveBeenCalled();
  });

  it('updates only the supplied fields when owned by the caller', async () => {
    const { resolvers, listDocuments } = getUpdateMyListResolvers({ user: { id: 1 } });

    const result = await resolvers.Mutation.updateMyList.resolve(
      null,
      { documentId: 'list-1', name: 'Updated' },
      context,
    );

    expect(listDocuments.update).toHaveBeenCalledWith({
      documentId: 'list-1',
      data: { name: 'Updated' },
    });
    expect(result).toEqual({ documentId: 'list-1', name: 'Updated' });
  });

  it('includes isPublic and description when supplied', async () => {
    const { resolvers, listDocuments } = getUpdateMyListResolvers({ user: { id: 1 } });

    await resolvers.Mutation.updateMyList.resolve(
      null,
      { documentId: 'list-1', isPublic: true, description: 'new desc' },
      context,
    );

    expect(listDocuments.update).toHaveBeenCalledWith({
      documentId: 'list-1',
      data: { isPublic: true, description: 'new desc' },
    });
  });
});

describe('deleteMyList', () => {
  const context = { state: { user: { id: 1 } } };

  function getDeleteMyListResolvers(list: { user: { id: number } } | null) {
    const listDocuments = {
      findOne: jest.fn().mockResolvedValue(list),
      delete: jest.fn().mockResolvedValue({ documentId: 'list-1' }),
    };
    const deleteMany = jest.fn();
    const resolvers = getResolvers({
      documents: jest.fn((uid: string) => (uid === 'api::list.list' ? listDocuments : {})),
      db: { query: jest.fn(() => ({ deleteMany })) },
    });

    return { resolvers, listDocuments, deleteMany };
  }

  it('throws Forbidden access when the list is not owned by the caller', async () => {
    const { resolvers, listDocuments, deleteMany } = getDeleteMyListResolvers({ user: { id: 2 } });

    await expect(
      resolvers.Mutation.deleteMyList.resolve(null, { documentId: 'list-1' }, context),
    ).rejects.toThrow('Forbidden access');
    expect(listDocuments.delete).not.toHaveBeenCalled();
    expect(deleteMany).not.toHaveBeenCalled();
  });

  it('throws Forbidden access when the list does not exist', async () => {
    const { resolvers, listDocuments } = getDeleteMyListResolvers(null);

    await expect(
      resolvers.Mutation.deleteMyList.resolve(null, { documentId: 'list-1' }, context),
    ).rejects.toThrow('Forbidden access');
    expect(listDocuments.delete).not.toHaveBeenCalled();
  });

  it('deletes the list and its items when owned by the caller', async () => {
    const { resolvers, listDocuments, deleteMany } = getDeleteMyListResolvers({ user: { id: 1 } });

    const result = await resolvers.Mutation.deleteMyList.resolve(
      null,
      { documentId: 'list-1' },
      context,
    );

    expect(deleteMany).toHaveBeenCalledWith({
      where: { list: { document_id: 'list-1' } },
    });
    expect(listDocuments.delete).toHaveBeenCalledWith({ documentId: 'list-1' });
    expect(result).toBe(true);
  });
});
