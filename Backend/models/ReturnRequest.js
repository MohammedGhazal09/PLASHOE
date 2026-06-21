import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';

export const RETURN_REQUEST_TYPES = ['return', 'exchange'];
export const RETURN_REQUEST_STATUSES = [
  'requested',
  'approved',
  'rejected',
  'received',
  'resolved',
  'cancelled',
];

const returnRequestItemSchema = new mongoose.Schema(
  {
    orderItemId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    image: {
      type: String,
      default: '',
    },
    size: Number,
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    exchangeSize: {
      type: Number,
      default: null,
    },
  },
  { _id: false }
);

const statusHistorySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: RETURN_REQUEST_STATUSES,
      required: true,
    },
    note: {
      type: String,
      default: null,
      trim: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    actorRole: {
      type: String,
      enum: ['customer', 'admin', 'system'],
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const returnRequestSchema = new mongoose.Schema(
  {
    requestNumber: {
      type: String,
      unique: true,
      trim: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      required: true,
      index: true,
    },
    orderNumber: {
      type: String,
      trim: true,
    },
    type: {
      type: String,
      enum: RETURN_REQUEST_TYPES,
      required: true,
    },
    status: {
      type: String,
      enum: RETURN_REQUEST_STATUSES,
      default: 'requested',
      index: true,
    },
    items: {
      type: [returnRequestItemSchema],
      default: [],
    },
    customerNotes: {
      type: String,
      default: null,
      trim: true,
    },
    adminNotes: {
      type: String,
      default: null,
      trim: true,
    },
    eligibilitySnapshot: {
      orderStatus: String,
      paymentStatus: String,
      deliveredAt: Date,
      returnWindowDays: Number,
      windowEndsAt: Date,
    },
    refundIntent: {
      requestedAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      resolvedAmount: {
        type: Number,
        default: 0,
        min: 0,
      },
      status: {
        type: String,
        enum: [
          'not_applicable',
          'manual_review_required',
          'manual_refund_recorded',
          'rejected',
        ],
        default: 'not_applicable',
      },
      orderPaymentStatusAtRequest: String,
      orderRefundAmountAtRequest: {
        type: Number,
        default: 0,
      },
      providerRefundIdsAtRequest: {
        type: [String],
        default: [],
      },
      resolvedAt: Date,
    },
    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },
  },
  { timestamps: true }
);

returnRequestSchema.index({ order: 1, status: 1 });
returnRequestSchema.index({ user: 1, createdAt: -1 });
returnRequestSchema.index({ status: 1, createdAt: -1 });

const generateRequestNumber = () => {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = randomUUID().replace(/-/g, '').slice(0, 8).toUpperCase();
  return `RMA-${timePart}-${randomPart}`;
};

returnRequestSchema.pre('save', function setRequestNumber(next) {
  if (!this.requestNumber) {
    this.requestNumber = generateRequestNumber();
  }
  next();
});

export default mongoose.model('ReturnRequest', returnRequestSchema);
