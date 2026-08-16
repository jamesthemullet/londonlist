export default {
  async deleteAccount(ctx) {
    const user = ctx.state.user as { id: number } | undefined;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const lists = await strapi.db.query('api::list.list').findMany({
      where: { user: { id: user.id } },
      select: ['id', 'documentId'],
    });

    for (const list of lists) {
      await strapi.db.query('api::list-item.list-item').deleteMany({
        where: { list: { documentId: (list as { documentId: string }).documentId } },
      });
    }

    for (const list of lists) {
      await strapi.documents('api::list.list').delete({
        documentId: (list as { documentId: string }).documentId,
      });
    }

    await strapi.db.query('plugin::users-permissions.user').delete({
      where: { id: user.id },
    });

    ctx.status = 200;
    return { deleted: true };
  },
};
