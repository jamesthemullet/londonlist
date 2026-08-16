export default {
  routes: [
    {
      method: 'DELETE',
      path: '/account/me',
      handler: 'api::account.account.deleteAccount',
      config: {
        policies: [],
        middlewares: [],
      },
    },
  ],
};
