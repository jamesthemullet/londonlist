import { factories } from '@strapi/strapi';
import { findUserByUsername } from '../../../lib/find-user-by-username';

export default factories.createCoreController('api::list-setting.list-setting', ({ strapi }) => ({
  async find(ctx) {
    const user = ctx.state.user;
    const results = await strapi.db.query('api::list-setting.list-setting').findMany({
      where: { user: user.id },
    });
    const sanitized = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitized);
  },

  async create(ctx) {
    const user = ctx.state.user;
    ctx.request.body.data = {
      ...(ctx.request.body.data || {}),
      user: user.id,
    };
    return super.create(ctx);
  },

  async getPublicList(ctx) {
    const { username } = ctx.params;

    const user = await findUserByUsername(strapi, username);

    if (!user) {
      return ctx.notFound('User not found');
    }

    const setting = await strapi.db.query('api::list-setting.list-setting').findOne({
      where: { user: user.id },
    });

    if (!setting?.isPublic) {
      ctx.status = 403;
      return { error: 'This list is private' };
    }

    const items = await strapi.db.query('api::list-item.list-item').findMany({
      where: { user: user.id },
      orderBy: { createdAt: 'desc' },
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
    };
  },
}));
