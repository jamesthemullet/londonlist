export default {
  register({ strapi }) {
    const extensionService = strapi.plugin('graphql').service('extension');

    extensionService.use(() => ({
      resolvers: {
        Query: {
          listItems: {
            async resolve(_parent, args, context) {
              const user = context.state?.user;
              if (!user) throw new Error('Forbidden access');

              return strapi.documents('api::list-item.list-item').findMany({
                filters: { user: { id: { $eq: user.id } } },
                sort: args.sort ?? 'createdAt:desc',
              });
            },
          },
          listSettings: {
            async resolve(_parent, _args, context) {
              const user = context.state?.user;
              if (!user) throw new Error('Forbidden access');

              return strapi.documents('api::list-setting.list-setting').findMany({
                filters: { user: { id: { $eq: user.id } } },
              });
            },
          },
        },
        Mutation: {
          createListItem: {
            async resolve(_parent, args, context) {
              const user = context.state?.user;
              if (!user) throw new Error('Forbidden access');

              return strapi.documents('api::list-item.list-item').create({
                data: {
                  ...args.data,
                  user: user.id,
                },
              });
            },
          },
          createListSetting: {
            async resolve(_parent, args, context) {
              const user = context.state?.user;
              if (!user) throw new Error('Forbidden access');

              return strapi.documents('api::list-setting.list-setting').create({
                data: {
                  ...args.data,
                  user: user.id,
                },
              });
            },
          },
          updateListSetting: {
            async resolve(_parent, args, context) {
              const user = context.state?.user;
              if (!user) throw new Error('Forbidden access');

              const existing = await strapi.documents('api::list-setting.list-setting').findOne({
                documentId: args.documentId,
                populate: ['user'],
              });

              if (!existing || (existing.user as { id: number } | null)?.id !== user.id) {
                throw new Error('Forbidden access');
              }

              return strapi.documents('api::list-setting.list-setting').update({
                documentId: args.documentId,
                data: args.data,
              });
            },
          },
        },
      },
    }));
  },

  async bootstrap({ strapi }) {
    await grantListSettingPermissions(strapi);
  },
};

async function grantListSettingPermissions(strapi) {
  const authenticatedRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'authenticated' } });

  if (!authenticatedRole) return;

  const actions = [
    'api::list-setting.list-setting.find',
    'api::list-setting.list-setting.findOne',
    'api::list-setting.list-setting.create',
    'api::list-setting.list-setting.update',
  ];

  for (const action of actions) {
    const existing = await strapi.db
      .query('plugin::users-permissions.permission')
      .findOne({ where: { action, role: authenticatedRole.id } });

    if (!existing) {
      await strapi.db.query('plugin::users-permissions.permission').create({
        data: { action, role: authenticatedRole.id, enabled: true },
      });
    } else if (existing.enabled === false) {
      await strapi.db.query('plugin::users-permissions.permission').update({
        where: { id: existing.id },
        data: { enabled: true },
      });
    }
  }
}
