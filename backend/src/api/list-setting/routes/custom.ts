export default {
  routes: [
    {
      method: 'GET',
      path: '/list-settings/public/:username',
      handler: 'api::list-setting.list-setting.getPublicList',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
