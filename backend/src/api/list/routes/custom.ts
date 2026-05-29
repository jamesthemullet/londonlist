export default {
  routes: [
    {
      method: 'GET',
      path: '/lists/public/:username/:listId',
      handler: 'api::list.list.getPublicList',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
