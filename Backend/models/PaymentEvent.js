import mongoose from 'mongoose';

const paymentEventSchema = new mongoose.Schema(
  {
    provider: {
      type: String,
      required: true,
      default: 'stripe',
      trim: true,
    },
    providerEventId: {
      type: String,
      required: true,
      trim: true,
    },
    eventType: {
      type: String,
      required: true,
      trim: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Order',
      default: null,
    },
    status: {
      type: String,
      enum: ['processing', 'processed', 'failed'],
      default: 'processed',
    },
    processedAt: {
      type: Date,
      default: null,
    },
    error: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

paymentEventSchema.index({ provider: 1, providerEventId: 1 }, { unique: true });

export default mongoose.model('PaymentEvent', paymentEventSchema);
