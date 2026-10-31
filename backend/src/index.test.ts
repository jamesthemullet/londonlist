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
    planLimits: { resolve: Resolve };
    place: { resolve: Resolve };
    placesByArea: { resolve: Resolve };
    relatedPlaces: { resolve: Resolve };
    allPlaces: { resolve: Resolve };
    listItems: { resolve: Resolve };
  };
  Mutation: {
    createListItem: { resolve: Resolve };
    updateListItem: { resolve: Resolve };
    deleteListItem: { resolve: Resolve };
    createMyList: { resolve: Resolve };
    updateMyList: { resolve: Resolve };
    deleteMyList: { resolve: Resolve };
    copyPublicList: { resolve: Resolve };
  };
};

function getResolvers(strapi: unknown): ResolverMap {
  const use = jest.fn();
  const mockStrapi = {
    ...(strapi as object),
    plugin: jest.fn(() => ({ service: jest.fn(() => ({ use })) })),
  };

  (indexPlugin as { register: (args: { strapi: unknown }) => void }).register({
    strapi: mockStrapi,
  });

  const factory = use.mock.calls[0][0] as () => { resolvers: ResolverMap };
  return factory().resolvers;
}

describe('GraphQL resolvers — public place queries', () => {
  const anonymousContext = { state: {} };

  describe('planLimits', () => {
    it('returns the free plan limits without requiring a user', async () => {
      const resolvers = getResolvers({});

      const result = await resolvers.Query.planLimits.resolve(null, {}, anonymousContext);

      expect(result).toEqual({ freeListLimit: 3, freeItemLimit: 20 });
    });
  });

  describe('place', () => {
    it('returns a place for an anonymous caller', async () => {
      const listItemDocuments = {
        findMany: jest
          .fn()
          .mockResolvedValue([
            {
              osm_id: 'osm-1',
              name: 'Tate Modern',
              category: 'museum',
              area: 'Southwark',
              lat: 1,
              lng: 2,
            },
          ]),
      };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) =>
          uid === 'api::list-item.list-item' ? listItemDocuments : {},
        ),
      });

      const result = await resolvers.Query.place.resolve(
        null,
        { osm_id: 'osm-1' },
        anonymousContext,
      );

      expect(result).toEqual({
        osm_id: 'osm-1',
        name: 'Tate Modern',
        category: 'museum',
        area: 'Southwark',
        lat: 1,
        lng: 2,
      });
    });

    it('returns null when no matching item exists', async () => {
      const listItemDocuments = { findMany: jest.fn().mockResolvedValue([]) };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) =>
          uid === 'api::list-item.list-item' ? listItemDocuments : {},
        ),
      });

      const result = await resolvers.Query.place.resolve(
        null,
        { osm_id: 'missing' },
        anonymousContext,
      );

      expect(result).toBeNull();
    });
  });

  describe('placesByArea', () => {
    it('dedupes items sharing the same osm_id for an anonymous caller', async () => {
      const listItemDocuments = {
        findMany: jest.fn().mockResolvedValue([
          {
            osm_id: 'osm-1',
            name: 'Tate Modern',
            category: 'museum',
            area: 'Southwark',
            lat: 1,
            lng: 2,
          },
          {
            osm_id: 'osm-1',
            name: 'Tate Modern (dup)',
            category: 'museum',
            area: 'Southwark',
            lat: 1,
            lng: 2,
          },
          {
            osm_id: 'osm-2',
            name: 'Borough Market',
            category: 'market',
            area: 'Southwark',
            lat: 3,
            lng: 4,
          },
        ]),
      };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) =>
          uid === 'api::list-item.list-item' ? listItemDocuments : {},
        ),
      });

      const result = await resolvers.Query.placesByArea.resolve(
        null,
        { area: 'Southwark' },
        anonymousContext,
      );

      expect(result).toEqual([
        {
          osm_id: 'osm-1',
          name: 'Tate Modern',
          category: 'museum',
          area: 'Southwark',
          lat: 1,
          lng: 2,
        },
        {
          osm_id: 'osm-2',
          name: 'Borough Market',
          category: 'market',
          area: 'Southwark',
          lat: 3,
          lng: 4,
        },
      ]);
    });

    it('returns an empty array when no items are found for the area', async () => {
      const listItemDocuments = { findMany: jest.fn().mockResolvedValue([]) };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) =>
          uid === 'api::list-item.list-item' ? listItemDocuments : {},
        ),
      });

      const result = await resolvers.Query.placesByArea.resolve(
        null,
        { area: 'Nowhere' },
        anonymousContext,
      );

      expect(result).toEqual([]);
    });
  });

  describe('relatedPlaces', () => {
    it('returns an empty array when the target place has no category', async () => {
      const listItemDocuments = {
        findMany: jest.fn().mockResolvedValue([{ osm_id: 'osm-1', category: null }]),
      };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) =>
          uid === 'api::list-item.list-item' ? listItemDocuments : {},
        ),
      });

      const result = await resolvers.Query.relatedPlaces.resolve(
        null,
        { osm_id: 'osm-1' },
        anonymousContext,
      );

      expect(result).toEqual([]);
    });

    it('caps the result length at 12 even when a higher limit is requested', async () => {
      const candidates = Array.from({ length: 20 }, (_, i) => ({
        osm_id: `osm-related-${i}`,
        name: `Place ${i}`,
        category: 'museum',
        lat: 1,
        lng: 2,
      }));
      const listItemDocuments = {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([{ osm_id: 'osm-1', category: 'museum' }])
          .mockResolvedValueOnce(candidates),
      };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) =>
          uid === 'api::list-item.list-item' ? listItemDocuments : {},
        ),
      });

      const result = await resolvers.Query.relatedPlaces.resolve(
        null,
        { osm_id: 'osm-1', limit: 50 },
        anonymousContext,
      );

      expect(result).toHaveLength(12);
    });

    it('dedupes candidates sharing the same osm_id', async () => {
      const listItemDocuments = {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([{ osm_id: 'osm-1', category: 'museum' }])
          .mockResolvedValueOnce([
            { osm_id: 'osm-2', name: 'Natural History Museum', category: 'museum', lat: 1, lng: 2 },
            {
              osm_id: 'osm-2',
              name: 'Natural History Museum (dup)',
              category: 'museum',
              lat: 1,
              lng: 2,
            },
          ]),
      };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) =>
          uid === 'api::list-item.list-item' ? listItemDocuments : {},
        ),
      });

      const result = await resolvers.Query.relatedPlaces.resolve(
        null,
        { osm_id: 'osm-1' },
        anonymousContext,
      );

      expect(result).toEqual([
        { osm_id: 'osm-2', name: 'Natural History Museum', category: 'museum', lat: 1, lng: 2 },
      ]);
    });
  });

  describe('allPlaces', () => {
    it('caps the fetch limit at 10000 even when a higher limit is requested', async () => {
      const listItemDocuments = { findMany: jest.fn().mockResolvedValue([]) };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) =>
          uid === 'api::list-item.list-item' ? listItemDocuments : {},
        ),
      });

      await resolvers.Query.allPlaces.resolve(null, { limit: 50000 }, anonymousContext);

      expect(listItemDocuments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 30000 }),
      );
    });

    it('defaults the cap to 5000 when no limit is requested', async () => {
      const listItemDocuments = { findMany: jest.fn().mockResolvedValue([]) };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) =>
          uid === 'api::list-item.list-item' ? listItemDocuments : {},
        ),
      });

      await resolvers.Query.allPlaces.resolve(null, {}, anonymousContext);

      expect(listItemDocuments.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 15000 }),
      );
    });

    it('dedupes items sharing the same osm_id', async () => {
      const listItemDocuments = {
        findMany: jest.fn().mockResolvedValue([
          {
            osm_id: 'osm-1',
            name: 'Tate Modern',
            category: 'museum',
            area: 'Southwark',
            lat: 1,
            lng: 2,
          },
          {
            osm_id: 'osm-1',
            name: 'Tate Modern (dup)',
            category: 'museum',
            area: 'Southwark',
            lat: 1,
            lng: 2,
          },
          {
            osm_id: 'osm-2',
            name: 'Borough Market',
            category: 'market',
            area: 'Southwark',
            lat: 3,
            lng: 4,
          },
        ]),
      };
      const resolvers = getResolvers({
        documents: jest.fn((uid: string) =>
          uid === 'api::list-item.list-item' ? listItemDocuments : {},
        ),
      });

      const result = await resolvers.Query.allPlaces.resolve(null, {}, anonymousContext);

      expect(result).toEqual([
        {
          osm_id: 'osm-1',
          name: 'Tate Modern',
          category: 'museum',
          area: 'Southwark',
          lat: 1,
          lng: 2,
        },
        {
          osm_id: 'osm-2',
          name: 'Borough Market',
          category: 'market',
          area: 'Southwark',
          lat: 3,
          lng: 4,
        },
      ]);
    });
  });
});

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
    function strapiFor(options: { isPro?: boolean; existingLists?: unknown[]; created?: unknown }) {
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
              return {
                findOne: jest.fn().mockResolvedValue({ id: 1, isPro: options.isPro ?? false }),
              };
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

  describe('copyPublicList', () => {
    function strapiFor(options: {
      sourceUser?: { id: number; username: string };
      sourceList?: unknown;
      isPro?: boolean;
      existingLists?: unknown[];
    }) {
      const listDocuments = {
        findOne: jest.fn().mockResolvedValue(options.sourceList ?? null),
        findMany: jest.fn().mockResolvedValue(options.existingLists ?? []),
        create: jest.fn().mockResolvedValue({ documentId: 'new-list' }),
      };
      const listItemDocuments = {
        findMany: jest.fn().mockResolvedValue([]),
        create: jest.fn().mockResolvedValue({ documentId: 'new-item' }),
      };
      const userQuery = {
        findMany: jest.fn().mockResolvedValue(options.sourceUser ? [options.sourceUser] : []),
        findOne: jest.fn().mockResolvedValue({ id: 1, isPro: options.isPro ?? false }),
      };
      return {
        documents: jest.fn((uid: string) => {
          if (uid === 'api::list.list') return listDocuments;
          if (uid === 'api::list-item.list-item') return listItemDocuments;
          return {};
        }),
        db: { query: jest.fn(() => userQuery) },
        listDocuments,
      };
    }

    it('throws Source user not found when the source username does not resolve', async () => {
      const strapi = strapiFor({ sourceUser: undefined });
      const resolvers = getResolvers(strapi);

      await expect(
        resolvers.Mutation.copyPublicList.resolve(
          null,
          { sourceDocumentId: 'list-1', sourceUsername: 'nobody' },
          context,
        ),
      ).rejects.toThrow('Source user not found');
      expect(strapi.listDocuments.create).not.toHaveBeenCalled();
    });

    it('throws List not found when the source list does not exist or is not owned by the source user', async () => {
      const strapi = strapiFor({
        sourceUser: { id: 2, username: 'bob' },
        sourceList: null,
      });
      const resolvers = getResolvers(strapi);

      await expect(
        resolvers.Mutation.copyPublicList.resolve(
          null,
          { sourceDocumentId: 'list-1', sourceUsername: 'bob' },
          context,
        ),
      ).rejects.toThrow('List not found');
      expect(strapi.listDocuments.create).not.toHaveBeenCalled();
    });

    it('throws List is private when the source list is not public', async () => {
      const strapi = strapiFor({
        sourceUser: { id: 2, username: 'bob' },
        sourceList: { user: { id: 2 }, isPublic: false, name: 'Private List' },
      });
      const resolvers = getResolvers(strapi);

      await expect(
        resolvers.Mutation.copyPublicList.resolve(
          null,
          { sourceDocumentId: 'list-1', sourceUsername: 'bob' },
          context,
        ),
      ).rejects.toThrow('List is private');
      expect(strapi.listDocuments.create).not.toHaveBeenCalled();
    });

    it('throws the free-plan list limit error when a non-pro caller is at the limit', async () => {
      const strapi = strapiFor({
        sourceUser: { id: 2, username: 'bob' },
        sourceList: { user: { id: 2 }, isPublic: true, name: 'Public List' },
        isPro: false,
        existingLists: [{ documentId: 'l1' }, { documentId: 'l2' }, { documentId: 'l3' }],
      });
      const resolvers = getResolvers(strapi);

      await expect(
        resolvers.Mutation.copyPublicList.resolve(
          null,
          { sourceDocumentId: 'list-1', sourceUsername: 'bob' },
          context,
        ),
      ).rejects.toMatchObject({
        message: 'Free plan list limit reached',
        extensions: { code: 'FREE_LIST_LIMIT_REACHED' },
      });
      expect(strapi.listDocuments.create).not.toHaveBeenCalled();
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
      findMany: jest
        .fn()
        .mockResolvedValue(
          Array.from({ length: options.existingItemCount ?? 0 }, (_, i) => ({
            documentId: `item-${i}`,
          })),
        ),
      create: jest.fn().mockResolvedValue({ documentId: 'new-item' }),
    };
    const findOne = jest
      .fn()
      .mockResolvedValue(options.isPro === undefined ? null : { id: 1, isPro: options.isPro });
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
