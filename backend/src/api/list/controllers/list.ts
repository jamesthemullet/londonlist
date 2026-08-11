import { factories } from '@strapi/strapi';

function isOwnedBy(doc: unknown, userId: number): boolean {
  return ((doc as { user?: { id: number } | null } | null)?.user?.id) === userId;
}

export default factories.createCoreController('api::list.list', ({ strapi }) => ({
  async getAllPublicLists(ctx) {
    const { page = 1, pageSize = 20 } = ctx.query as { page?: number; pageSize?: number };
    const safePageSize = Math.min(Math.max(1, Number(pageSize)), 100);

    const lists = await strapi.documents('api::list.list').findMany({
      filters: { isPublic: { $eq: true } },
      populate: {
        user: true,
        list_items: { fields: ['category', 'completed'] },
      },
      sort: 'createdAt:desc',
      limit: safePageSize,
      offset: (Number(page) - 1) * safePageSize,
    });

    return {
      data: lists.map((list) => {
        const typedList = list as typeof list & {
          user?: { username?: string } | null;
          viewCount?: number;
          description?: string | null;
          list_items?: { category?: string | null; completed?: boolean }[];
        };
        const items = typedList.list_items ?? [];
        const categories = [...new Set(items.map((i) => i.category).filter((c): c is string => Boolean(c)))];
        return {
          documentId: list.documentId,
          name: list.name,
          description: typedList.description ?? null,
          username: typedList.user?.username ?? null,
          viewCount: typedList.viewCount ?? 0,
          itemCount: items.length,
          categories,
        };
      }),
    };
  },

  async getPublicListsByUsername(ctx) {
    const { username } = ctx.params;

    const [user] = await strapi.db.query('plugin::users-permissions.user').findMany({
      where: { username },
    });

    if (!user) {
      return ctx.notFound('User not found');
    }

    const lists = await strapi.documents('api::list.list').findMany({
      filters: { isPublic: { $eq: true }, user: { id: { $eq: user.id } } },
      sort: 'createdAt:desc',
    });

    const listsWithCounts = await Promise.all(
      lists.map(async (list) => {
        const items = await strapi.documents('api::list-item.list-item').findMany({
          filters: { list: { documentId: { $eq: list.documentId } } },
        });
        const completedCount = items.filter((i) => (i as { completed?: boolean }).completed).length;
        return {
          documentId: list.documentId,
          name: list.name,
          description: (list as { description?: string | null }).description ?? null,
          itemCount: items.length,
          completedCount,
        };
      }),
    );

    return {
      username: user.username,
      lists: listsWithCounts,
    };
  },

  async getPublicList(ctx) {
    const { username, listId } = ctx.params;

    const [user] = await strapi.db.query('plugin::users-permissions.user').findMany({
      where: { username },
    });

    if (!user) {
      return ctx.notFound('User not found');
    }

    const list = await strapi.documents('api::list.list').findOne({
      documentId: listId,
      populate: ['user'],
    });

    if (!list || !isOwnedBy(list, user.id)) {
      return ctx.notFound('List not found');
    }

    if (!list.isPublic) {
      ctx.status = 403;
      return { error: 'This list is private' };
    }

    const typedList = list as typeof list & { viewCount?: number };
    await strapi.documents('api::list.list').update({
      documentId: listId,
      // viewCount is declared in schema.json but Strapi's build-time type
      // generation can lag behind on CI, so the generated Input type omits it.
      data: { viewCount: (typedList.viewCount ?? 0) + 1 } as unknown as never,
    });

    const items = await strapi.documents('api::list-item.list-item').findMany({
      filters: { list: { documentId: { $eq: listId } } },
      sort: 'createdAt:desc',
    });

    return {
      data: items.map((item) => ({
        documentId: item.documentId,
        name: item.name,
        category: item.category,
        completed: item.completed,
        osm_id: item.osm_id,
        visitedAt: item.visitedAt ?? null,
        notes: (item as { notes?: string | null }).notes ?? null,
        lat: item.lat ?? null,
        lng: item.lng ?? null,
      })),
      username: user.username,
      listName: list.name,
      description: (list as { description?: string | null }).description ?? null,
      viewCount: (typedList.viewCount ?? 0) + 1,
    };
  },
}));
