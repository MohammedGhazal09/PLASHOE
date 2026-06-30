import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  name: String,
  image: String,
  quantity: Number,
  size: Number,
  price: Number
});

const refundRecordSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      default: 'stripe',
      trim: true,
    },
    providerRefundId: {
      type: String,
      required: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      default: null,
    },
    providerEventId: {
      type: String,
      default: null,
      trim: true,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

export const PAYMENT_STATUSES = [
  'requires_payment',
  'payment_pending',
  'paid',
  'payment_failed',
  'payment_canceled',
  'refunded',
  'partially_refunded',
  'not_required',
];

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  orderNumber: {
    type: String,
    unique: true
  },
  idempotencyKey: {
    type: String,
    trim: true
  },
  cartFingerprint: String,
  inventoryDecremented: {
    type: Boolean,
    default: false
  },
  items: [orderItemSchema],
  shippingAddress: {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    company: String,
    country: { type: String, required: true },
    street: { type: String, required: true },
    apartment: String,
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    phone: { type: String, required: true }
  },
  subtotal: {
    type: Number,
    required: true
  },
  discount: {
    type: Number,
    default: 0
  },
  total: {
    type: Number,
    required: true
  },
  couponCode: String,
  status: {
    type: String,
    enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
    default: 'processing' // Auto-confirm
  },
  paymentStatus: {
    type: String,
    enum: PAYMENT_STATUSES,
    default: 'not_required',
    get: (value) => value || 'not_required'
  },
  paymentProvider: {
    type: String,
    default: null
  },
  paymentProviderSessionId: {
    type: String,
    default: null
  },
  paymentProviderIntentId: {
    type: String,
    default: null
  },
  paymentProviderCustomerId: {
    type: String,
    default: null
  },
  paymentCheckoutUrl: {
    type: String,
    default: null
  },
  checkoutHoldExpiresAt: {
    type: Date,
    default: null
  },
  paidAt: {
    type: Date,
    default: null
  },
  paymentFailureReason: {
    type: String,
    default: null
  },
  refundedAt: {
    type: Date,
    default: null
  },
  refundAmount: {
    type: Number,
    default: 0,
    min: 0
  },
  refundRecords: {
    type: [refundRecordSchema],
    default: [],
  },
  notes: String,
  // Shipment tracking fields
  trackingNumber: {
    type: String,
    default: null
  },
  carrier: {
    type: String,
    default: null
  },
  shippingMethod: {
    type: String,
    enum: ['standard', 'express'],
    default: 'standard'
  },
  shippingMethodName: {
    type: String,
    default: 'Standard'
  },
  shippingPrice: {
    type: Number,
    default: 0,
    min: 0
  },
  shippingCountryCode: {
    type: String,
    default: null,
    trim: true
  },
  estimatedDeliveryDate: {
    type: Date,
    default: null
  },
  shippedAt: {
    type: Date,
    default: null
  },
  deliveredAt: {
    type: Date,
    default: null
  },
  trackingHistory: [{
    status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      required: true
    },
    description: String,
    timestamp: {
      type: Date,
      default: Date.now
    },
    location: String
  }]
}, {
  timestamps: true,
  toJSON: { getters: true },
  toObject: { getters: true }
});

orderSchema.index(
  { user: 1, idempotencyKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      idempotencyKey: { $type: 'string' }
    }
  }
);
orderSchema.index({ status: 1, paymentStatus: 1, createdAt: -1 });
orderSchema.index({ paymentStatus: 1, checkoutHoldExpiresAt: 1 });
orderSchema.index({ user: 1, createdAt: -1 });

const generateOrderNumber = () => {
  const timePart = Date.now().toString(36).toUpperCase();
  const randomPart = randomUUID().replace(/-/g, '').slice(0, 10).toUpperCase();
  return `PLS-${timePart}-${randomPart}`;
};

// Generate order number before save
orderSchema.pre('save', function(next) {
  if (!this.orderNumber) {
    this.orderNumber = generateOrderNumber();
  }
  next();
});

export default mongoose.model('Order', orderSchema);
