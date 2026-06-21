import mongoose from 'mongoose';

const backInStockRequestSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    size: {
      type: Number,
      required: true,
      min: 35,
      max: 45,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Please use a valid email address'],
    },
    consent: {
      type: Boolean,
      required: true,
      validate: {
        validator: (value) => value === true,
        message: 'Back-in-stock consent is required',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'notified', 'cancelled'],
      default: 'pending',
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    notifiedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

backInStockRequestSchema.index(
  { product: 1, size: 1, email: 1, status: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  }
);
backInStockRequestSchema.index({ email: 1, requestedAt: -1 });
backInStockRequestSchema.index({ product: 1, size: 1, status: 1 });

export default mongoose.model('BackInStockRequest', backInStockRequestSchema);

