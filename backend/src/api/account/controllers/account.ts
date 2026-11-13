import Stripe from 'stripe';
import { requireAuth } from '../../../lib/auth';

export default {
  async deleteAccount(ctx) {
    const user = requireAuth(ctx);
    if (!user) return;

    const dbUser = await strapi.db.query('plugin::users-permissions.user').findOne({
      where: { id: user.id },
      select: ['stripeCustomerId'],
    });

    if (dbUser?.stripeCustomerId) {
      const secretKey = process.env.STRIPE_SECRET_KEY;
      if (secretKey) {
        const stripe = new Stripe(secretKey);
        const subscriptions = await stripe.subscriptions.list({
          customer: dbUser.stripeCustomerId as string,
          status: 'active',
        });
        for (const sub of subscriptions.data) {
          await stripe.subscriptions.cancel(sub.id);
        }
      }
    }

    const lists = await strapi.db.query('api::list.list').findMany({
      where: { user: { id: user.id } },
      select: ['id', 'documentId'],
    });

    for (const list of lists) {
      await strapi.db.query('api::list-item.list-item').deleteMany({
        where: { list: { documentId: (list as { documentId: string }).documentId } },
      });
    }

    for (const list of lists) {
      await strapi.documents('api::list.list').delete({
        documentId: (list as { documentId: string }).documentId,
      });
    }

    await strapi.db.query('api::list-setting.list-setting').deleteMany({
      where: { user: { id: user.id } },
    });

    await strapi.db.query('plugin::users-permissions.user').delete({
      where: { id: user.id },
    });

    ctx.status = 200;
    return { deleted: true };
  },
};
