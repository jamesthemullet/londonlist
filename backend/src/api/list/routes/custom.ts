export default {
  routes: [
    {
      method: 'GET',
      path: '/lists/public',
      handler: 'api::list.list.getAllPublicLists',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
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
    {
      method: 'GET',
      path: '/lists/public/:username',
      handler: 'api::list.list.getPublicListsByUsername',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
