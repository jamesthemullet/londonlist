import { factories } from '@strapi/strapi';

export default factories.createCoreController('api::list.list', ({ strapi }) => ({
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

    if (!list || (list.user as { id: number } | null)?.id !== user.id) {
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
      })),
      username: user.username,
      listName: list.name,
    };
  },
}));
