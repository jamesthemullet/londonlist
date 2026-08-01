export default {
  routes: [
    {
      method: 'POST',
      path: '/stripe/create-checkout-session',
      handler: 'stripe.createCheckoutSession',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/stripe/confirm-checkout-session',
      handler: 'stripe.confirmCheckoutSession',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/stripe/customer-portal',
      handler: 'stripe.createCustomerPortalSession',
      config: {
        policies: [],
        middlewares: [],
      },
    },
    {
      method: 'POST',
      path: '/stripe/webhook',
      handler: 'stripe.webhook',
      config: {
        auth: false,
        policies: [],
        middlewares: [],
      },
    },
  ],
};
