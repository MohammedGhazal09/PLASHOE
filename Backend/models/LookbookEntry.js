import mongoose from 'mongoose';

const hotspotSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    x: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    y: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    label: {
      type: String,
      trim: true,
      maxlength: 120,
    },
  },
  { _id: false }
);

const bundleItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    defaultSize: {
      type: Number,
      min: 35,
      max: 45,
    },
    quantity: {
      type: Number,
      default: 1,
      min: 1,
      max: 5,
    },
  },
  { _id: false }
);

const bundleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 160,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 600,
    },
    items: {
      type: [bundleItemSchema],
      default: [],
      validate: {
        validator: (items) => Array.isArray(items) && items.length > 0,
        message: 'Bundle requires at least one item',
      },
    },
  },
  { _id: false }
);

const lookbookEntrySchema = new mongoose.Schema(
  {
    title: {
      type: String,
      trim: true,
      maxlength: 160,
      required: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 900,
    },
    image: {
      type: String,
      trim: true,
      maxlength: 500,
      required: true,
    },
    status: {
      type: String,
      enum: ['draft', 'active'],
      default: 'active',
    },
    sortOrder: {
      type: Number,
      default: 0,
      min: 0,
    },
    hotspots: {
      type: [hotspotSchema],
      default: [],
    },
    bundle: bundleSchema,
  },
  {
    timestamps: true,
  }
);

lookbookEntrySchema.index({ status: 1, sortOrder: 1, createdAt: -1 });
lookbookEntrySchema.index({ 'hotspots.product': 1 });
lookbookEntrySchema.index({ 'bundle.items.product': 1 });

export default mongoose.model('LookbookEntry', lookbookEntrySchema);

