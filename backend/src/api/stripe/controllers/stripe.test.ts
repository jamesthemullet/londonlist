const mockStripeInstance = {
  checkout: {
    sessions: {
      create: jest.fn(),
      retrieve: jest.fn(),
    },
  },
  billingPortal: {
    sessions: {
      create: jest.fn(),
    },
  },
  webhooks: {
    constructEvent: jest.fn(),
  },
};

jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => mockStripeInstance);
});

import stripeController from './stripe';

const unparsedBodySymbol = Symbol.for('unparsedBody');

function createCtx(overrides: Record<string, unknown> = {}) {
  return {
    state: {},
    request: { body: {}, headers: {} },
    unauthorized: jest.fn((msg: string) => ({ status: 401, msg })),
    badRequest: jest.fn((msg: string) => ({ status: 400, msg })),
    forbidden: jest.fn((msg: string) => ({ status: 403, msg })),
    internalServerError: jest.fn((msg: string) => ({ status: 500, msg })),
    ...overrides,
  };
}

describe('stripe controller', () => {
  const dbQuery = {
    update: jest.fn(),
    updateMany: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_PRO_PRICE_ID = 'price_monthly';
    process.env.STRIPE_PRO_ANNUAL_PRICE_ID = 'price_annual';
    process.env.FRONTEND_URL = 'https://example.com';

    (global as unknown as { strapi: unknown }).strapi = {
      db: { query: jest.fn(() => dbQuery) },
      log: { error: jest.fn() },
    };
  });

  describe('createCheckoutSession', () => {
    it('returns unauthorized when there is no authenticated user', async () => {
      const ctx = createCtx();
      const result = await stripeController.createCheckoutSession(ctx);
      expect(ctx.unauthorized).toHaveBeenCalledWith('Authentication required');
      expect(result).toEqual({ status: 401, msg: 'Authentication required' });
    });

    it('returns internalServerError when the relevant price id is not configured', async () => {
      delete process.env.STRIPE_PRO_PRICE_ID;
      const ctx = createCtx({ state: { user: { id: 1, email: 'a@example.com' } } });
      const result = await stripeController.createCheckoutSession(ctx);
      expect(ctx.internalServerError).toHaveBeenCalledWith('Stripe is not configured');
      expect(result).toEqual({ status: 500, msg: 'Stripe is not configured' });
    });

    it('creates a monthly checkout session for an authenticated user', async () => {
      mockStripeInstance.checkout.sessions.create.mockResolvedValue({
        url: 'https://checkout/monthly',
      });
      const ctx = createCtx({
        state: { user: { id: 42, email: 'user@example.com' } },
        request: { body: {} },
      });

      const result = await stripeController.createCheckoutSession(ctx);

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          mode: 'subscription',
          line_items: [{ price: 'price_monthly', quantity: 1 }],
          customer_email: 'user@example.com',
          client_reference_id: '42',
          metadata: { userId: '42' },
          success_url: expect.stringContaining('https://example.com/pricing'),
          cancel_url: 'https://example.com/pricing?checkout=cancelled',
        }),
      );
      expect(result).toEqual({ url: 'https://checkout/monthly' });
    });

    it('creates an annual checkout session when billingPeriod is annual', async () => {
      mockStripeInstance.checkout.sessions.create.mockResolvedValue({
        url: 'https://checkout/annual',
      });
      const ctx = createCtx({
        state: { user: { id: 42, email: 'user@example.com' } },
        request: { body: { billingPeriod: 'annual' } },
      });

      await stripeController.createCheckoutSession(ctx);

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({ line_items: [{ price: 'price_annual', quantity: 1 }] }),
      );
    });
  });

  describe('confirmCheckoutSession', () => {
    it('returns unauthorized when there is no authenticated user', async () => {
      const ctx = createCtx();
      await stripeController.confirmCheckoutSession(ctx);
      expect(ctx.unauthorized).toHaveBeenCalledWith('Authentication required');
    });

    it('returns badRequest when sessionId is missing', async () => {
      const ctx = createCtx({ state: { user: { id: 1 } }, request: { body: {} } });
      await stripeController.confirmCheckoutSession(ctx);
      expect(ctx.badRequest).toHaveBeenCalledWith('Missing sessionId');
    });

    it('returns forbidden when the session does not belong to the requesting user', async () => {
      mockStripeInstance.checkout.sessions.retrieve.mockResolvedValue({
        client_reference_id: '999',
        payment_status: 'paid',
      });
      const ctx = createCtx({
        state: { user: { id: 1 } },
        request: { body: { sessionId: 'cs_123' } },
      });

      await stripeController.confirmCheckoutSession(ctx);

      expect(ctx.forbidden).toHaveBeenCalledWith('This checkout session does not belong to you');
    });

    it('returns isPro: false when the session is not paid or trialing/active', async () => {
      mockStripeInstance.checkout.sessions.retrieve.mockResolvedValue({
        client_reference_id: '1',
        payment_status: 'unpaid',
        subscription: null,
      });
      const ctx = createCtx({
        state: { user: { id: 1 } },
        request: { body: { sessionId: 'cs_123' } },
      });

      const result = await stripeController.confirmCheckoutSession(ctx);

      expect(result).toEqual({ isPro: false });
      expect(dbQuery.update).not.toHaveBeenCalled();
    });

    it('activates pro and returns isPro: true for a paid session', async () => {
      mockStripeInstance.checkout.sessions.retrieve.mockResolvedValue({
        client_reference_id: '1',
        payment_status: 'paid',
        customer: 'cus_123',
        subscription: null,
      });
      const ctx = createCtx({
        state: { user: { id: 1 } },
        request: { body: { sessionId: 'cs_123' } },
      });

      const result = await stripeController.confirmCheckoutSession(ctx);

      expect(dbQuery.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { isPro: true, stripeCustomerId: 'cus_123' },
      });
      expect(result).toEqual({ isPro: true });
    });

    it('activates pro for a trialing subscription even when payment_status is not paid', async () => {
      mockStripeInstance.checkout.sessions.retrieve.mockResolvedValue({
        client_reference_id: '1',
        payment_status: 'unpaid',
        customer: 'cus_123',
        subscription: { status: 'trialing' },
      });
      const ctx = createCtx({
        state: { user: { id: 1 } },
        request: { body: { sessionId: 'cs_123' } },
      });

      const result = await stripeController.confirmCheckoutSession(ctx);

      expect(result).toEqual({ isPro: true });
    });
  });

  describe('createCustomerPortalSession', () => {
    it('returns unauthorized when there is no authenticated user', async () => {
      const ctx = createCtx();
      await stripeController.createCustomerPortalSession(ctx);
      expect(ctx.unauthorized).toHaveBeenCalledWith('Authentication required');
    });

    it('returns badRequest when the user has no stripeCustomerId', async () => {
      dbQuery.findOne.mockResolvedValue(null);
      const ctx = createCtx({ state: { user: { id: 1 } } });

      await stripeController.createCustomerPortalSession(ctx);

      expect(ctx.badRequest).toHaveBeenCalledWith('No active subscription found');
    });

    it('creates a billing portal session for a subscribed user', async () => {
      dbQuery.findOne.mockResolvedValue({ stripeCustomerId: 'cus_123' });
      mockStripeInstance.billingPortal.sessions.create.mockResolvedValue({
        url: 'https://portal/session',
      });
      const ctx = createCtx({ state: { user: { id: 1 } } });

      const result = await stripeController.createCustomerPortalSession(ctx);

      expect(mockStripeInstance.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        return_url: 'https://example.com/pricing',
      });
      expect(result).toEqual({ url: 'https://portal/session' });
    });
  });

  describe('webhook', () => {
    function webhookCtx(overrides: Record<string, unknown> = {}) {
      const ctx: Record<string, unknown> = {
        request: {
          headers: { 'stripe-signature': 'sig_123' },
          body: { [unparsedBodySymbol]: 'raw-body' },
        },
        badRequest: jest.fn((msg: string) => ({ status: 400, msg })),
        ...overrides,
      };
      return ctx;
    }

    beforeEach(() => {
      process.env.STRIPE_WEBHOOK_SECRET = 'whsec_123';
    });

    it('returns badRequest when the webhook secret, signature or raw body is missing', async () => {
      delete process.env.STRIPE_WEBHOOK_SECRET;
      const ctx = webhookCtx();

      await stripeController.webhook(ctx);

      expect(ctx.badRequest).toHaveBeenCalledWith('Missing Stripe signature or webhook secret');
    });

    it('returns badRequest when signature verification fails', async () => {
      mockStripeInstance.webhooks.constructEvent.mockImplementation(() => {
        throw new Error('bad signature');
      });
      const ctx = webhookCtx();

      await stripeController.webhook(ctx);

      expect(ctx.badRequest).toHaveBeenCalledWith('Invalid signature');
    });

    it('activates pro on checkout.session.completed', async () => {
      mockStripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'checkout.session.completed',
        data: { object: { client_reference_id: '7', customer: 'cus_7' } },
      });
      const ctx = webhookCtx();

      await stripeController.webhook(ctx);

      expect(dbQuery.update).toHaveBeenCalledWith({
        where: { id: '7' },
        data: { isPro: true, stripeCustomerId: 'cus_7' },
      });
      expect(ctx.status).toBe(200);
      expect(ctx.body).toEqual({ received: true });
    });

    it('deactivates pro on customer.subscription.deleted', async () => {
      mockStripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'customer.subscription.deleted',
        data: { object: { customer: 'cus_7', status: 'canceled' } },
      });
      const ctx = webhookCtx();

      await stripeController.webhook(ctx);

      expect(dbQuery.updateMany).toHaveBeenCalledWith({
        where: { stripeCustomerId: 'cus_7' },
        data: { isPro: false },
      });
    });

    it.each(['past_due', 'unpaid', 'canceled', 'paused'])(
      'deactivates pro on customer.subscription.updated with status %s',
      async (status) => {
        mockStripeInstance.webhooks.constructEvent.mockReturnValue({
          type: 'customer.subscription.updated',
          data: { object: { customer: 'cus_7', status } },
        });
        const ctx = webhookCtx();

        await stripeController.webhook(ctx);

        expect(dbQuery.updateMany).toHaveBeenCalledWith({
          where: { stripeCustomerId: 'cus_7' },
          data: { isPro: false },
        });
      },
    );

    it('activates pro on customer.subscription.updated with status active', async () => {
      mockStripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'customer.subscription.updated',
        data: { object: { customer: 'cus_7', status: 'active' } },
      });
      const ctx = webhookCtx();

      await stripeController.webhook(ctx);

      expect(dbQuery.updateMany).toHaveBeenCalledWith({
        where: { stripeCustomerId: 'cus_7' },
        data: { isPro: true },
      });
    });

    it('acknowledges unhandled event types without touching the database', async () => {
      mockStripeInstance.webhooks.constructEvent.mockReturnValue({
        type: 'customer.created',
        data: { object: {} },
      });
      const ctx = webhookCtx();

      await stripeController.webhook(ctx);

      expect(dbQuery.update).not.toHaveBeenCalled();
      expect(dbQuery.updateMany).not.toHaveBeenCalled();
      expect(ctx.status).toBe(200);
      expect(ctx.body).toEqual({ received: true });
    });
  });
});
