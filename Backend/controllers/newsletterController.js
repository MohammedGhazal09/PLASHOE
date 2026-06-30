import NewsletterSubscription, { createUnsubscribeToken } from '../models/NewsletterSubscription.js';
import {
  buildPagination,
  buildPaginationEnvelope,
  escapeRegex,
} from '../utils/adminListQuery.js';

const publicSubscriptionFields = (subscription) => ({
  _id: subscription._id,
  email: subscription.email,
  source: subscription.source,
  status: subscription.status,
  subscribedAt: subscription.subscribedAt,
  unsubscribedAt: subscription.unsubscribedAt,
});

const toCountMap = (rows) =>
  rows.reduce((acc, row) => {
    acc[row._id || 'unknown'] = row.count;
    return acc;
  }, {});

const buildAdminFilter = (query) => {
  const filter = {};

  if (query.status) {
    filter.status = query.status;
  }

  if (query.email) {
    filter.email = new RegExp(escapeRegex(query.email), 'i');
  }

  if (query.source) {
    filter.source = new RegExp(`^${escapeRegex(query.source)}$`, 'i');
  }

  if (query.q) {
    const pattern = new RegExp(escapeRegex(query.q), 'i');
    filter.$or = [{ email: pattern }, { source: pattern }];
  }

  return filter;
};

// @desc    Subscribe to the newsletter
// @route   POST /api/newsletter
export const subscribeNewsletter = async (req, res, next) => {
  try {
    const now = new Date();
    const { email, consent, source } = req.body;
    let subscription = await NewsletterSubscription.findOne({ email }).select('+unsubscribeToken');

    if (subscription) {
      subscription.consent = consent;
      subscription.source = source || subscription.source;
      subscription.lastConsentAt = now;

      if (subscription.status !== 'active') {
        subscription.status = 'active';
        subscription.unsubscribeToken = createUnsubscribeToken();
        subscription.subscribedAt = now;
        subscription.unsubscribedAt = null;
      }

      await subscription.save();

      return res.json({
        success: true,
        message:
          subscription.status === 'active'
            ? 'Newsletter subscription is active'
            : 'Newsletter subscription updated',
        data: publicSubscriptionFields(subscription),
      });
    }

    subscription = await NewsletterSubscription.create({
      email,
      consent,
      source,
      unsubscribeToken: createUnsubscribeToken(),
      subscribedAt: now,
      lastConsentAt: now,
    });

    res.status(201).json({
      success: true,
      message: 'Newsletter subscription saved',
      data: publicSubscriptionFields(subscription),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Unsubscribe from the newsletter
// @route   POST /api/newsletter/unsubscribe/:token
export const unsubscribeNewsletter = async (req, res, next) => {
  try {
    const subscription = await NewsletterSubscription.findOne({
      unsubscribeToken: req.params.token,
    }).select('+unsubscribeToken');

    if (!subscription) {
      return res.status(404).json({
        success: false,
        message: 'Newsletter subscription not found',
      });
    }

    if (subscription.status !== 'unsubscribed') {
      subscription.status = 'unsubscribed';
      subscription.unsubscribedAt = new Date();
      await subscription.save();
    }

    res.json({
      success: true,
      message: 'Newsletter subscription unsubscribed',
      data: publicSubscriptionFields(subscription),
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get newsletter subscription summary for admins
// @route   GET /api/newsletter/admin/summary
export const getNewsletterSummary = async (req, res, next) => {
  try {
    const [totalCount, statusRows, sourceRows] = await Promise.all([
      NewsletterSubscription.countDocuments(),
      NewsletterSubscription.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      NewsletterSubscription.aggregate([
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1, _id: 1 } },
        { $limit: 10 },
      ]),
    ]);

    const statusCounts = toCountMap(statusRows);

    res.json({
      success: true,
      data: {
        generatedAt: new Date().toISOString(),
        totalCount,
        activeCount: statusCounts.active || 0,
        statusCounts,
        sourceCounts: sourceRows.map((row) => ({
          source: row._id || 'unknown',
          count: row.count,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
};

// @desc    List newsletter subscriptions for admins
// @route   GET /api/newsletter/admin
export const getNewsletterSubscriptions = async (req, res, next) => {
  try {
    const query = req.validated?.query || req.query;
    const { page, limit, skip } = buildPagination(query);
    const filter = buildAdminFilter(query);

    const [total, subscriptions] = await Promise.all([
      NewsletterSubscription.countDocuments(filter),
      NewsletterSubscription.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
    ]);

    res.json(buildPaginationEnvelope({ total, page, limit, data: subscriptions }));
  } catch (error) {
    next(error);
  }
};
