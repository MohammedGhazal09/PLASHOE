export const DEMO_ADMIN_RESTRICTION_MESSAGE =
  'Demo admin preview is read-only. This portfolio account can inspect sample operations data, but real admin changes are restricted.';

const generatedAt = '2026-06-30T09:00:00.000Z';

const demoProducts = [
  {
    _id: '64f000000000000000000101',
    name: 'City Runner Demo',
    gender: 'male',
    category: 'Running',
    image: '/images/product-1.jpg',
    price: { original: 140, current: 112 },
    rating: 4.7,
    sizes: [40, 41, 42, 43],
    stock: 4,
    isOnSale: true,
    description: 'Sample low-stock runner used for the portfolio admin preview.',
    materials: [{ label: 'Upper', value: 'Recycled knit textile' }],
    careInstructions: ['Spot clean with mild soap', 'Air dry away from direct heat'],
    sustainability: {
      summary: 'Demo sustainability evidence attached to the product record.',
      source: 'Portfolio sample data',
      impactMetrics: [
        { label: 'Recycled upper textile', value: 'Documented', source: 'Portfolio sample data' },
      ],
      manufacturing: {
        location: 'Portugal',
        source: 'Portfolio sample data',
      },
      durability: {
        summary: 'Care-tested for everyday city wear.',
        source: 'Portfolio sample data',
      },
    },
  },
  {
    _id: '64f000000000000000000102',
    name: 'Court Classic Demo',
    gender: 'female',
    category: 'Classic',
    image: '/images/product-2.jpg',
    price: { original: 120, current: 120 },
    rating: 4.5,
    sizes: [36, 37, 38, 39, 40],
    stock: 18,
    isOnSale: false,
    description: 'Sample catalog product for merchandising review.',
  },
];

const demoOrders = [
  {
    _id: '64f000000000000000000201',
    orderNumber: 'PLS-DEMO-1001',
    user: { name: 'Demo Customer', email: 'customer@example.com' },
    status: 'processing',
    paymentStatus: 'paid',
    total: 224,
    createdAt: '2026-06-28T14:15:00.000Z',
    shippingAddress: {
      address: '100 Portfolio Avenue',
      street: '100 Portfolio Avenue',
      city: 'Riyadh',
      state: 'Riyadh',
      country: 'Saudi Arabia',
      zipCode: '12211',
    },
    items: [
      {
        _id: '64f000000000000000000301',
        product: demoProducts[0]._id,
        name: demoProducts[0].name,
        quantity: 2,
        size: 42,
        price: 112,
      },
    ],
  },
  {
    _id: '64f000000000000000000202',
    orderNumber: 'PLS-DEMO-1002',
    user: { name: 'Sandbox Buyer', email: 'buyer@example.com' },
    status: 'pending',
    paymentStatus: 'payment_pending',
    total: 120,
    createdAt: '2026-06-29T08:35:00.000Z',
    shippingAddress: {
      address: '42 Demo Street',
      street: '42 Demo Street',
      city: 'Toronto',
      state: 'ON',
      country: 'Canada',
      zipCode: 'M5V 2T6',
    },
    items: [
      {
        _id: '64f000000000000000000302',
        product: demoProducts[1]._id,
        name: demoProducts[1].name,
        quantity: 1,
        size: 38,
        price: 120,
      },
    ],
  },
];

const demoReturns = [
  {
    _id: '64f000000000000000000401',
    requestNumber: 'RMA-DEMO-1001',
    user: { name: 'Demo Customer', email: 'customer@example.com' },
    order: { orderNumber: 'PLS-DEMO-1001' },
    orderNumber: 'PLS-DEMO-1001',
    type: 'return',
    status: 'requested',
    refundIntent: { status: 'requested', requestedAmount: 112 },
    items: [
      {
        orderItemId: '64f000000000000000000301',
        name: demoProducts[0].name,
        quantity: 1,
        reason: 'Size exchange requested',
      },
    ],
    statusHistory: [
      {
        status: 'requested',
        actorRole: 'customer',
        timestamp: '2026-06-29T10:00:00.000Z',
        note: 'Customer opened the sample request.',
      },
    ],
    createdAt: '2026-06-29T10:00:00.000Z',
  },
];

const demoReviews = [
  {
    _id: '64f000000000000000000501',
    product: { _id: demoProducts[0]._id, name: demoProducts[0].name },
    user: { name: 'Verified Demo Buyer', email: 'reviewer@example.com' },
    rating: 5,
    title: 'Comfortable all day',
    comment: 'The cushioning feels stable for city walking and light runs.',
    fit: 'true_to_size',
    isApproved: true,
    createdAt: '2026-06-27T12:00:00.000Z',
  },
  {
    _id: '64f000000000000000000502',
    product: { _id: demoProducts[1]._id, name: demoProducts[1].name },
    user: { name: 'Moderation Demo', email: 'moderation@example.com' },
    rating: 3,
    title: 'Needs review',
    comment: 'Sample hidden review for moderation controls.',
    fit: 'runs_small',
    isApproved: false,
    createdAt: '2026-06-26T12:00:00.000Z',
  },
];

const demoBackInStockRequests = [
  {
    _id: '64f000000000000000000601',
    product: { _id: demoProducts[0]._id, name: demoProducts[0].name, stock: 4 },
    size: 42,
    email: 'waitlist@example.com',
    status: 'pending',
    requestedAt: '2026-06-29T09:20:00.000Z',
  },
  {
    _id: '64f000000000000000000602',
    product: { _id: demoProducts[1]._id, name: demoProducts[1].name, stock: 18 },
    size: 38,
    email: 'customer@example.com',
    status: 'notified',
    requestedAt: '2026-06-25T11:20:00.000Z',
  },
];

const demoNewsletterSubscriptions = [
  {
    _id: '64f000000000000000000701',
    email: 'subscriber@example.com',
    status: 'active',
    source: 'home_newsletter',
    subscribedAt: '2026-06-20T09:00:00.000Z',
  },
  {
    _id: '64f000000000000000000702',
    email: 'lookbook@example.com',
    status: 'active',
    source: 'lookbook_signup',
    subscribedAt: '2026-06-22T09:00:00.000Z',
  },
];

const demoLookbookEntries = [
  {
    _id: '64f000000000000000000801',
    title: 'Demo City Commute',
    status: 'active',
    image: '/images/lookbook-1.jpg',
    description: 'Sample shoppable scene for the portfolio admin preview.',
    sortOrder: 1,
    hotspots: [
      {
        product: { _id: demoProducts[0]._id, name: demoProducts[0].name },
        x: 48,
        y: 55,
        label: demoProducts[0].name,
      },
    ],
    bundle: {
      title: 'Commute Set',
      items: [
        {
          product: { _id: demoProducts[0]._id, name: demoProducts[0].name },
          defaultSize: 42,
          quantity: 1,
        },
      ],
    },
  },
];

const demoCoupons = [
  {
    _id: '64f000000000000000000901',
    code: 'DEMO15',
    discountPercentage: 15,
    minOrderAmount: 80,
    maxUses: 100,
    usedCount: 18,
    validFrom: '2026-06-01T00:00:00.000Z',
    validUntil: '2026-08-31T00:00:00.000Z',
    isActive: true,
  },
];

const demoMessages = [
  {
    _id: '64f000000000000000001001',
    name: 'Portfolio Reviewer',
    email: 'reviewer@example.com',
    subject: 'Admin demo access',
    message: 'This sample message shows how support tickets are reviewed without exposing real customer data.',
    isRead: false,
  },
];

const clone = (value) => JSON.parse(JSON.stringify(value));

const paginate = (data, params = {}) => {
  const page = Number(params.page || 1);
  const limit = Number(params.limit || data.length || 20);
  const start = (page - 1) * limit;
  const rows = data.slice(start, start + limit);

  return {
    success: true,
    data: clone(rows),
    total: data.length,
    page,
    pages: Math.max(1, Math.ceil(data.length / limit)),
    limit,
  };
};

const findById = (data, id) => data.find((item) => item._id === id) || data[0] || null;

export const createAdminDemoRestrictionError = () => {
  const error = new Error(DEMO_ADMIN_RESTRICTION_MESSAGE);
  error.response = {
    status: 403,
    data: {
      success: false,
      code: 'DEMO_ADMIN_READ_ONLY',
      message: DEMO_ADMIN_RESTRICTION_MESSAGE,
    },
  };
  return error;
};

export const getAdminDemoResponse = (name, ...args) => {
  switch (name) {
    case 'getSummary':
      return clone({
        success: true,
        data: {
          generatedAt,
          revenue: {
            paidTotal: 224,
            paidOrderCount: 1,
            averagePaidOrderValue: 224,
          },
          orders: {
            total: demoOrders.length,
            byStatus: { processing: 1, pending: 1 },
            paymentsByStatus: { paid: 1, payment_pending: 1 },
          },
          inventory: {
            productCount: demoProducts.length,
            lowStockThreshold: 5,
            lowStockCount: 1,
            outOfStockCount: 0,
            lowStockProducts: [{ _id: demoProducts[0]._id, name: demoProducts[0].name, stock: demoProducts[0].stock }],
          },
          returns: { openCount: 1, byStatus: { requested: 1 } },
          messages: { unreadCount: 1 },
          coupons: { activeCount: 1, totalRedemptions: 18 },
        },
      });
    case 'getBackInStockSummary':
      return clone({
        success: true,
        data: {
          totalCount: demoBackInStockRequests.length,
          pendingCount: 1,
          statusCounts: { pending: 1, notified: 1 },
          pendingBySize: [{ size: 42, count: 1 }],
          topDemand: [
            {
              product: { _id: demoProducts[0]._id, name: demoProducts[0].name },
              size: 42,
              pendingCount: 1,
              emailCount: 1,
            },
          ],
        },
      });
    case 'getBackInStockRequests':
      return paginate(demoBackInStockRequests, args[0]);
    case 'getNewsletterSummary':
      return clone({
        success: true,
        data: {
          totalCount: demoNewsletterSubscriptions.length,
          activeCount: 2,
          statusCounts: { active: 2 },
          sourceCounts: [
            { source: 'home_newsletter', count: 1 },
            { source: 'lookbook_signup', count: 1 },
          ],
        },
      });
    case 'getNewsletterSubscriptions':
      return paginate(demoNewsletterSubscriptions, args[0]);
    case 'getAdminReviews':
      return paginate(demoReviews, args[0]);
    case 'getAdminReview':
      return clone({ success: true, data: findById(demoReviews, args[0]) });
    case 'getProducts':
      return paginate(demoProducts, args[0]);
    case 'getLookbookEntries':
      return clone({ success: true, data: demoLookbookEntries });
    case 'getOrders':
      return paginate(demoOrders, args[0]);
    case 'getOrder':
      return clone({ success: true, data: findById(demoOrders, args[0]) });
    case 'getReturns':
      return paginate(demoReturns, args[0]);
    case 'getReturn':
      return clone({ success: true, data: findById(demoReturns, args[0]) });
    case 'getCoupons':
      return paginate(demoCoupons, args[0]);
    case 'getContactMessages':
      return paginate(demoMessages, args[0]);
    default:
      return clone({ success: true, data: [] });
  }
};
