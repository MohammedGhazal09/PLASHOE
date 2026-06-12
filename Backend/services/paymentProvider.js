import Stripe from 'stripe';

const DEFAULT_CURRENCY = 'usd';
const DEFAULT_SECRET_PLACEHOLDER = 'stripe-secret-placeholder';

let providerOverride = null;

export const setPaymentProviderOverride = (override) => {
  providerOverride = override;
};

export const resetPaymentProviderOverride = () => {
  providerOverride = null;
};

const getOverride = (override, methodName) => override?.[methodName] || providerOverride?.[methodName];

export const createStripeClient = (secretKey = process.env.STRIPE_SECRET_KEY) =>
  new Stripe(secretKey || DEFAULT_SECRET_PLACEHOLDER, {
    apiVersion: '2024-06-20',
    appInfo: {
      name: 'PLASHOE',
      version: '1.0.0',
    },
  });

const toMinorCurrencyUnit = (amount) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    throw new Error('Order total must be a non-negative number');
  }

  return Math.round(numericAmount * 100);
};

export const createCheckoutSession = async ({
  order,
  user,
  successUrl,
  cancelUrl,
  metadata,
  idempotencyKey,
  stripeClient,
  provider,
} = {}) => {
  const override = getOverride(provider, 'createCheckoutSession');

  if (override) {
    return override({ order, user, successUrl, cancelUrl, metadata, idempotencyKey });
  }

  const client = stripeClient || createStripeClient();
  const session = await client.checkout.sessions.create(
    {
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user?.email,
      line_items: [
        {
          price_data: {
            currency: DEFAULT_CURRENCY,
            product_data: {
              name: `PLASHOE Order ${order.orderNumber}`,
            },
            unit_amount: toMinorCurrencyUnit(order.total),
          },
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata,
      payment_intent_data: {
        metadata,
      },
    },
    { idempotencyKey }
  );

  return session;
};

export const constructWebhookEvent = ({
  payload,
  signature,
  webhookSecret = process.env.STRIPE_WEBHOOK_SECRET,
  stripeClient,
  provider,
} = {}) => {
  const override = getOverride(provider, 'constructWebhookEvent');

  if (override) {
    return override({ payload, signature, webhookSecret });
  }

  const client = stripeClient || createStripeClient();
  return client.webhooks.constructEvent(payload, signature, webhookSecret);
};

export const retrieveCheckoutSession = async ({ sessionId, stripeClient, provider } = {}) => {
  const override = getOverride(provider, 'retrieveCheckoutSession');

  if (override) {
    return override({ sessionId });
  }

  const client = stripeClient || createStripeClient();
  return client.checkout.sessions.retrieve(sessionId);
};

export const retrievePaymentIntent = async ({ paymentIntentId, stripeClient, provider } = {}) => {
  const override = getOverride(provider, 'retrievePaymentIntent');

  if (override) {
    return override({ paymentIntentId });
  }

  const client = stripeClient || createStripeClient();
  return client.paymentIntents.retrieve(paymentIntentId);
};
