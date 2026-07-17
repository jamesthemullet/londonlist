import Stripe from 'stripe';

const unparsedBodySymbol = Symbol.for('unparsedBody');

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey);
}

export default {
  async createCheckoutSession(ctx) {
    const user = ctx.state.user as { id: number; email: string } | undefined;
    if (!user) {
      return ctx.unauthorized('Authentication required');
    }

    const priceId = process.env.STRIPE_PRO_PRICE_ID;
    if (!priceId) {
      return ctx.internalServerError('Stripe is not configured');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: user.email,
      client_reference_id: String(user.id),
      metadata: { userId: String(user.id) },
      success_url: `${frontendUrl}/pricing?checkout=success`,
      cancel_url: `${frontendUrl}/pricing?checkout=cancelled`,
    });

    return { url: session.url };
  },

  async webhook(ctx) {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const signature = ctx.request.headers['stripe-signature'];
    const rawBody = ctx.request.body?.[unparsedBodySymbol];

    if (!webhookSecret || !signature || !rawBody) {
      return ctx.badRequest('Missing Stripe signature or webhook secret');
    }

    const stripe = getStripeClient();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } catch (err) {
      strapi.log.error(`Stripe webhook signature verification failed: ${(err as Error).message}`);
      return ctx.badRequest('Invalid signature');
    }

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? session.metadata?.userId;

        if (userId) {
          await strapi.db.query('plugin::users-permissions.user').update({
            where: { id: userId },
            data: {
              isPro: true,
              stripeCustomerId: session.customer as string,
            },
          });
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await strapi.db.query('plugin::users-permissions.user').updateMany({
          where: { stripeCustomerId: subscription.customer as string },
          data: { isPro: false },
        });
        break;
      }

      default:
        break;
    }

    ctx.status = 200;
    ctx.body = { received: true };
  },
};
