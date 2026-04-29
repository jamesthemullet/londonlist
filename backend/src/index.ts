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
        },
      },
    }));
  },

  bootstrap(/*{ strapi }*/) {},
};
