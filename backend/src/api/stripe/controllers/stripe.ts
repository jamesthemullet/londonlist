import Stripe from 'stripe';
import { requireAuth } from '../../../lib/auth';

const unparsedBodySymbol = Symbol.for('unparsedBody');

function getStripeClient(): Stripe {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  return new Stripe(secretKey);
}

async function activateProFromSession(session: Stripe.Checkout.Session) {
  const userId = session.client_reference_id ?? session.metadata?.userId;
  if (!userId) return;

  await strapi.db.query('plugin::users-permissions.user').update({
    where: { id: userId },
    data: {
      isPro: true,
      stripeCustomerId: session.customer as string,
    },
  });
}

export default {
  async createCheckoutSession(ctx) {
    const user = requireAuth(ctx);
    if (!user) return;

    const dbUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: user.id },
      select: ['isPro', 'stripeCustomerId'],
    });

    if (dbUser?.isPro) {
      return ctx.badRequest('Already subscribed to a Pro plan');
    }

    const { billingPeriod } = (ctx.request.body as { billingPeriod?: string }) ?? {};
    const isAnnual = billingPeriod === 'annual';

    const priceId = isAnnual
      ? process.env.STRIPE_PRO_ANNUAL_PRICE_ID
      : process.env.STRIPE_PRO_PRICE_ID;

    if (!priceId) {
      return ctx.internalServerError('Stripe is not configured');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const stripe = getStripeClient();

    const existingCustomerId = dbUser?.stripeCustomerId as string | undefined;

    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      client_reference_id: String(user.id),
      metadata: { userId: String(user.id) },
      success_url: `${frontendUrl}/pricing?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${frontendUrl}/pricing?checkout=cancelled`,
    };

    if (existingCustomerId) {
      sessionParams.customer = existingCustomerId;
    } else {
      sessionParams.customer_email = user.email;
      sessionParams.subscription_data = { trial_period_days: 14 };
    }

    const session = await stripe.checkout.sessions.create(sessionParams);
    return { url: session.url };
  },

  async confirmCheckoutSession(ctx) {
    const user = requireAuth(ctx);
    if (!user) return;

    const { sessionId } = ctx.request.body as { sessionId?: string };
    if (!sessionId) {
      return ctx.badRequest('Missing sessionId');
    }

    const stripe = getStripeClient();
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    const ownerId = session.client_reference_id ?? session.metadata?.userId;
    if (String(ownerId) !== String(user.id)) {
      return ctx.forbidden('This checkout session does not belong to you');
    }

    const subscription = session.subscription as { status?: string } | null;
    const isActive =
      session.payment_status === 'paid' ||
      subscription?.status === 'trialing' ||
      subscription?.status === 'active';

    if (!isActive) {
      return { isPro: false };
    }

    await activateProFromSession(session);
    return { isPro: true };
  },

  async createCustomerPortalSession(ctx) {
    const user = requireAuth(ctx);
    if (!user) return;

    const dbUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: user.id },
      select: ['stripeCustomerId'],
    });

    if (!dbUser?.stripeCustomerId) {
      return ctx.badRequest('No active subscription found');
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const stripe = getStripeClient();

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: dbUser.stripeCustomerId as string,
      return_url: `${frontendUrl}/pricing`,
    });

    return { url: portalSession.url };
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
        await activateProFromSession(event.data.object as Stripe.Checkout.Session);
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

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const inactiveStatuses = ['past_due', 'unpaid', 'canceled', 'paused'];
        if (inactiveStatuses.includes(subscription.status)) {
          await strapi.db.query('plugin::users-permissions.user').updateMany({
            where: { stripeCustomerId: subscription.customer as string },
            data: { isPro: false },
          });
        } else if (subscription.status === 'active') {
          await strapi.db.query('plugin::users-permissions.user').updateMany({
            where: { stripeCustomerId: subscription.customer as string },
            data: { isPro: true },
          });
        }
        break;
      }

      default:
        break;
    }

    ctx.status = 200;
    ctx.body = { received: true };
  },
};
