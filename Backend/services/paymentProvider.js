import Stripe from 'stripe';

const DEFAULT_CURRENCY = 'usd';
const DEFAULT_SECRET_PLACEHOLDER = 'stripe-secret-placeholder';
const PAYPAL_BASE_URLS = Object.freeze({
  sandbox: 'https://api-m.sandbox.paypal.com',
  live: 'https://api-m.paypal.com',
});

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

const toPayPalCurrencyValue = (amount) => {
  const numericAmount = Number(amount);

  if (!Number.isFinite(numericAmount) || numericAmount < 0) {
    throw new Error('Order total must be a non-negative number');
  }

  return numericAmount.toFixed(2);
};

const getTrimmedEnv = (env, key) => {
  const value = env[key];
  return typeof value === 'string' ? value.trim() : '';
};

export const getPayPalBaseUrl = (env = process.env) => {
  const paypalEnv = getTrimmedEnv(env, 'PAYPAL_ENV').toLowerCase();
  return PAYPAL_BASE_URLS[paypalEnv] || PAYPAL_BASE_URLS.sandbox;
};

const getHeaderValue = (headers = {}, headerName) => {
  if (typeof headers.get === 'function') {
    return headers.get(headerName) || headers.get(headerName.toLowerCase()) || '';
  }

  return headers[headerName] || headers[headerName.toLowerCase()] || '';
};

const parseJsonResponse = async (response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
};

const assertFetchAvailable = (fetchImpl) => {
  if (typeof fetchImpl !== 'function') {
    throw new Error('PayPal provider requires a fetch implementation');
  }
};

const requestPayPalJson = async ({
  path,
  method,
  accessToken,
  body,
  headers = {},
  fetchImpl = globalThis.fetch,
  env = process.env,
}) => {
  assertFetchAvailable(fetchImpl);

  const response = await fetchImpl(`${getPayPalBaseUrl(env)}${path}`, {
    method,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await parseJsonResponse(response);

  if (!response.ok) {
    const error = new Error(`PayPal API request failed with status ${response.status}`);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data;
};

const getPayPalAccessToken = async ({
  clientId = process.env.PAYPAL_CLIENT_ID,
  clientSecret = process.env.PAYPAL_CLIENT_SECRET,
  fetchImpl = globalThis.fetch,
  env = process.env,
} = {}) => {
  assertFetchAvailable(fetchImpl);

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are not configured');
  }

  const response = await fetchImpl(`${getPayPalBaseUrl(env)}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await parseJsonResponse(response);

  if (!response.ok || !data?.access_token) {
    const error = new Error(`PayPal OAuth request failed with status ${response.status}`);
    error.status = response.status;
    error.details = data;
    throw error;
  }

  return data.access_token;
};

const getPayPalApprovalUrl = (order) =>
  order?.links?.find((link) => link.rel === 'approve')?.href ||
  order?.links?.find((link) => link.rel === 'payer-action')?.href ||
  null;

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

export const createPayPalOrder = async ({
  order,
  user,
  successUrl,
  cancelUrl,
  metadata = {},
  idempotencyKey,
  fetchImpl = globalThis.fetch,
  env = process.env,
  provider,
} = {}) => {
  const override = getOverride(provider, 'createPayPalOrder');

  if (override) {
    return override({ order, user, successUrl, cancelUrl, metadata, idempotencyKey });
  }

  const accessToken = await getPayPalAccessToken({ fetchImpl, env });
  const paypalOrder = await requestPayPalJson({
    path: '/v2/checkout/orders',
    method: 'POST',
    accessToken,
    fetchImpl,
    env,
    headers: {
      ...(idempotencyKey ? { 'PayPal-Request-Id': idempotencyKey } : {}),
    },
    body: {
      intent: 'CAPTURE',
      purchase_units: [
        {
          reference_id: order._id.toString(),
          custom_id: metadata.orderId || order._id.toString(),
          invoice_id: order.orderNumber,
          description: `PLASHOE Order ${order.orderNumber}`,
          amount: {
            currency_code: DEFAULT_CURRENCY.toUpperCase(),
            value: toPayPalCurrencyValue(order.total),
          },
        },
      ],
      payment_source: {
        paypal: {
          experience_context: {
            brand_name: 'PLASHOE',
            shipping_preference: 'NO_SHIPPING',
            user_action: 'PAY_NOW',
            return_url: successUrl,
            cancel_url: cancelUrl,
          },
        },
      },
    },
  });
  const approvalUrl = getPayPalApprovalUrl(paypalOrder);

  if (!paypalOrder?.id || !approvalUrl) {
    throw new Error('PayPal did not return an approval URL');
  }

  return {
    id: paypalOrder.id,
    url: approvalUrl,
    status: paypalOrder.status,
    raw: paypalOrder,
    customer: user?.email || null,
  };
};

export const capturePayPalOrder = async ({
  paypalOrderId,
  idempotencyKey,
  fetchImpl = globalThis.fetch,
  env = process.env,
  provider,
} = {}) => {
  const override = getOverride(provider, 'capturePayPalOrder');

  if (override) {
    return override({ paypalOrderId, idempotencyKey });
  }

  if (!paypalOrderId) {
    throw new Error('PayPal order id is required');
  }

  const accessToken = await getPayPalAccessToken({ fetchImpl, env });

  return requestPayPalJson({
    path: `/v2/checkout/orders/${encodeURIComponent(paypalOrderId)}/capture`,
    method: 'POST',
    accessToken,
    fetchImpl,
    env,
    headers: {
      ...(idempotencyKey ? { 'PayPal-Request-Id': idempotencyKey } : {}),
    },
  });
};

export const verifyPayPalWebhookEvent = async ({
  payload,
  headers,
  webhookId = process.env.PAYPAL_WEBHOOK_ID,
  fetchImpl = globalThis.fetch,
  env = process.env,
  provider,
} = {}) => {
  const override = getOverride(provider, 'verifyPayPalWebhookEvent');

  if (override) {
    return override({ payload, headers, webhookId });
  }

  const webhookEvent = Buffer.isBuffer(payload)
    ? JSON.parse(payload.toString('utf8'))
    : typeof payload === 'string'
      ? JSON.parse(payload)
      : payload;
  const verificationBody = {
    auth_algo: getHeaderValue(headers, 'paypal-auth-algo'),
    cert_url: getHeaderValue(headers, 'paypal-cert-url'),
    transmission_id: getHeaderValue(headers, 'paypal-transmission-id'),
    transmission_sig: getHeaderValue(headers, 'paypal-transmission-sig'),
    transmission_time: getHeaderValue(headers, 'paypal-transmission-time'),
    webhook_id: webhookId,
    webhook_event: webhookEvent,
  };
  const missingFields = Object.entries(verificationBody)
    .filter(([key, value]) => key !== 'webhook_event' && !value)
    .map(([key]) => key);

  if (missingFields.length > 0) {
    throw new Error('PayPal webhook verification headers are missing');
  }

  const accessToken = await getPayPalAccessToken({ fetchImpl, env });
  const verification = await requestPayPalJson({
    path: '/v1/notifications/verify-webhook-signature',
    method: 'POST',
    accessToken,
    body: verificationBody,
    fetchImpl,
    env,
  });

  if (verification?.verification_status !== 'SUCCESS') {
    throw new Error('Invalid PayPal webhook signature');
  }

  return webhookEvent;
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
