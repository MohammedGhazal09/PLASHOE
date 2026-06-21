import ReturnRequest from '../models/ReturnRequest.js';
import {
  ReturnRequestError,
  createReturnRequestForOrder,
  updateReturnRequestStatus,
} from '../services/returnRequestService.js';
import {
  buildPagination,
  buildPaginationEnvelope,
  escapeRegex,
} from '../utils/adminListQuery.js';

const handleReturnRequestError = (error, res, next) => {
  if (error instanceof ReturnRequestError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: [
        {
          code: error.code,
          details: error.details,
        },
      ],
    });
  }

  return next(error);
};

export const createReturnRequest = async (req, res, next) => {
  try {
    const request = await createReturnRequestForOrder({
      user: req.user,
      payload: req.body,
    });

    res.status(201).json({
      success: true,
      message: 'Return request submitted',
      data: request,
    });
  } catch (error) {
    handleReturnRequestError(error, res, next);
  }
};

export const listReturnRequests = async (req, res, next) => {
  try {
    const query = req.validated?.query || req.query;
    const filter = { user: req.user._id };

    if (query.orderId) filter.order = query.orderId;
    if (query.status) filter.status = query.status;

    const requests = await ReturnRequest.find(filter)
      .sort({ createdAt: -1 })
      .populate('order', 'orderNumber status paymentStatus deliveredAt total');

    res.json({
      success: true,
      count: requests.length,
      data: requests,
    });
  } catch (error) {
    next(error);
  }
};

export const getReturnRequest = async (req, res, next) => {
  try {
    const request = await ReturnRequest.findById(req.params.id)
      .populate('order', 'orderNumber status paymentStatus deliveredAt refundAmount total')
      .populate('user', 'name email');

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Return request not found',
      });
    }

    if (request.user._id.toString() !== req.user._id.toString() && !req.user.isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized',
      });
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const listAdminReturnRequests = async (req, res, next) => {
  try {
    const query = req.validated?.query || req.query;
    const { page, limit, skip } = buildPagination(query);
    const filter = {};

    if (query.status) filter.status = query.status;
    if (query.type) filter.type = query.type;

    if (query.q) {
      const pattern = new RegExp(escapeRegex(query.q), 'i');
      filter.$or = [{ requestNumber: pattern }, { orderNumber: pattern }];
    }

    const [total, requests] = await Promise.all([
      ReturnRequest.countDocuments(filter),
      ReturnRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('user', 'name email')
        .populate('order', 'orderNumber status paymentStatus deliveredAt total'),
    ]);

    res.json(
      buildPaginationEnvelope({
        total,
        page,
        limit,
        data: requests,
      })
    );
  } catch (error) {
    next(error);
  }
};

export const getAdminReturnRequest = getReturnRequest;

export const updateAdminReturnRequestStatus = async (req, res, next) => {
  try {
    const request = await updateReturnRequestStatus({
      requestId: req.params.id,
      adminUser: req.user,
      payload: req.body,
    });

    res.json({
      success: true,
      message: 'Return request updated',
      data: request,
    });
  } catch (error) {
    handleReturnRequestError(error, res, next);
  }
};
