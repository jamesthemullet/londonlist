function isOwnedBy(doc: unknown, userId: number): boolean {
  return ((doc as { user?: { id: number } | null } | null)?.user?.id) === userId;
}

function requireUser(context: { state?: { user?: unknown } }) {
  const user = context.state?.user as { id: number } | undefined;
  if (!user) throw new Error('Forbidden access');
  return user;
}

export default {
  register({ strapi }) {
    const extensionService = strapi.plugin('graphql').service('extension');

    extensionService.use(() => ({
      typeDefs: `
        type ListEntity {
          documentId: ID!
          name: String!
          isPublic: Boolean!
        }
        extend type Query {
          myLists: [ListEntity]
        }
        extend type Mutation {
          createMyList(name: String!): ListEntity
          updateMyList(documentId: ID!, name: String, isPublic: Boolean): ListEntity
          deleteMyList(documentId: ID!): Boolean
        }
      `,
      resolvers: {
        Query: {
          listItems: {
            async resolve(_parent, args, context) {
              const user = requireUser(context);

              const listDocumentId = args.filters?.list?.documentId?.eq;

              if (listDocumentId) {
                // Fetch items via the list relation to ensure correct scoping
                const list = await strapi.documents('api::list.list').findOne({
                  documentId: listDocumentId,
                  populate: {
                    user: true,
                    list_items: { sort: 'createdAt:desc' },
                  },
                });

                if (!list || !isOwnedBy(list, user.id)) {
                  throw new Error('Forbidden access');
                }

                return (list.list_items as unknown[]) ?? [];
              }

              return strapi.documents('api::list-item.list-item').findMany({
                filters: { user: { id: { $eq: user.id } } },
                sort: args.sort ?? 'createdAt:desc',
              });
            },
          },
          listSettings: {
            async resolve(_parent, _args, context) {
              const user = requireUser(context);

              return strapi.documents('api::list-setting.list-setting').findMany({
                filters: { user: { id: { $eq: user.id } } },
              });
            },
          },
          myLists: {
            async resolve(_parent, _args, context) {
              const user = requireUser(context);

              return strapi.documents('api::list.list').findMany({
                filters: { user: { id: { $eq: user.id } } },
                sort: 'createdAt:asc',
              });
            },
          },
        },
        Mutation: {
          createListItem: {
            async resolve(_parent, args, context) {
              const user = requireUser(context);

              const { list: listDocumentId, ...itemData } = args.data;

              if (listDocumentId) {
                const list = await strapi.documents('api::list.list').findOne({
                  documentId: listDocumentId,
                  populate: ['user'],
                });
                if (!list || !isOwnedBy(list, user.id)) {
                  throw new Error('Forbidden access');
                }
              }

              return strapi.documents('api::list-item.list-item').create({
                data: {
                  ...itemData,
                  user: user.id,
                  list: listDocumentId ?? null,
                },
              });
            },
          },
          createListSetting: {
            async resolve(_parent, args, context) {
              const user = requireUser(context);

              return strapi.documents('api::list-setting.list-setting').create({
                data: { ...args.data, user: user.id },
              });
            },
          },
          updateListSetting: {
            async resolve(_parent, args, context) {
              const user = requireUser(context);

              const existing = await strapi.documents('api::list-setting.list-setting').findOne({
                documentId: args.documentId,
                populate: ['user'],
              });

              if (!existing || !isOwnedBy(existing, user.id)) {
                throw new Error('Forbidden access');
              }

              return strapi.documents('api::list-setting.list-setting').update({
                documentId: args.documentId,
                data: args.data,
              });
            },
          },
          createMyList: {
            async resolve(_parent, args, context) {
              const user = requireUser(context);

              const existingLists = await strapi.documents('api::list.list').findMany({
                filters: { user: { id: { $eq: user.id } } },
              });

              const newList = await strapi.documents('api::list.list').create({
                data: { name: args.name, isPublic: false, user: user.id },
              });

              // On first list creation, migrate any pre-existing unassigned items into it
              if (existingLists.length === 0) {
                await strapi.db.query('api::list-item.list-item').updateMany({
                  where: { user: user.id, list: null },
                  data: { list: newList.id },
                });
              }

              return newList;
            },
          },
          updateMyList: {
            async resolve(_parent, args, context) {
              const user = requireUser(context);

              const existing = await strapi.documents('api::list.list').findOne({
                documentId: args.documentId,
                populate: ['user'],
              });

              if (!existing || !isOwnedBy(existing, user.id)) {
                throw new Error('Forbidden access');
              }

              const updateData: Record<string, unknown> = {};
              if (args.name !== undefined) updateData.name = args.name;
              if (args.isPublic !== undefined) updateData.isPublic = args.isPublic;

              return strapi.documents('api::list.list').update({
                documentId: args.documentId,
                data: updateData,
              });
            },
          },
          deleteMyList: {
            async resolve(_parent, args, context) {
              const user = requireUser(context);

              const existing = await strapi.documents('api::list.list').findOne({
                documentId: args.documentId,
                populate: ['user'],
              });

              if (!existing || !isOwnedBy(existing, user.id)) {
                throw new Error('Forbidden access');
              }

              await strapi.db.query('api::list-item.list-item').deleteMany({
                where: { list: { document_id: args.documentId } },
              });

              await strapi.documents('api::list.list').delete({ documentId: args.documentId });
              return true;
            },
          },
        },
      },
    }));
  },

  async bootstrap({ strapi }) {
    await grantPermissions(strapi);
  },
};

async function grantPermissions(strapi) {
  const authenticatedRole = await strapi.db
    .query('plugin::users-permissions.role')
    .findOne({ where: { type: 'authenticated' } });

  if (!authenticatedRole) return;

  const actions = [
    'api::list-setting.list-setting.find',
    'api::list-setting.list-setting.findOne',
    'api::list-setting.list-setting.create',
    'api::list-setting.list-setting.update',
    'api::list.list.find',
    'api::list.list.findOne',
    'api::list.list.create',
    'api::list.list.update',
    'api::list.list.delete',
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
