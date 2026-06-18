import { factories } from '@strapi/strapi';

function isOwnedBy(doc: unknown, userId: number): boolean {
  return ((doc as { user?: { id: number } | null } | null)?.user?.id) === userId;
}

export default factories.createCoreController('api::list.list', ({ strapi }) => ({
  async getAllPublicLists(ctx) {
    const { page = 1, pageSize = 20 } = ctx.query as { page?: number; pageSize?: number };

    const lists = await strapi.documents('api::list.list').findMany({
      filters: { isPublic: { $eq: true } },
      populate: ['user'],
      sort: 'createdAt:desc',
      limit: Number(pageSize),
      offset: (Number(page) - 1) * Number(pageSize),
    });

    return {
      data: lists.map((list) => ({
        documentId: list.documentId,
        name: list.name,
        username: (list as { user?: { username?: string } | null }).user?.username ?? null,
      })),
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
      })),
      username: user.username,
      listName: list.name,
    };
  },
}));
