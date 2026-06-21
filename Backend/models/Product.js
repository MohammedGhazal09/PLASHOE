import mongoose from 'mongoose';

const materialSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    value: {
      type: String,
      trim: true,
      maxlength: 200,
    },
  },
  { _id: false }
);

const impactMetricSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      trim: true,
      maxlength: 80,
      required: true,
    },
    value: {
      type: String,
      trim: true,
      maxlength: 120,
      required: true,
    },
    unit: {
      type: String,
      trim: true,
      maxlength: 40,
    },
    source: {
      type: String,
      trim: true,
      maxlength: 240,
      required: true,
    },
  },
  { _id: false }
);

const certificationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      maxlength: 120,
      required: true,
    },
    issuer: {
      type: String,
      trim: true,
      maxlength: 160,
      required: true,
    },
    url: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { _id: false }
);

const manufacturingSchema = new mongoose.Schema(
  {
    location: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    facility: {
      type: String,
      trim: true,
      maxlength: 160,
    },
    process: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    source: {
      type: String,
      trim: true,
      maxlength: 240,
    },
  },
  { _id: false }
);

const durabilitySchema = new mongoose.Schema(
  {
    summary: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    repairability: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    expectedUse: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    source: {
      type: String,
      trim: true,
      maxlength: 240,
    },
  },
  { _id: false }
);

const sustainabilitySchema = new mongoose.Schema(
  {
    summary: {
      type: String,
      trim: true,
      maxlength: 700,
    },
    source: {
      type: String,
      trim: true,
      maxlength: 240,
    },
    impactMetrics: {
      type: [impactMetricSchema],
      default: [],
    },
    certifications: {
      type: [certificationSchema],
      default: [],
    },
    manufacturing: {
      type: manufacturingSchema,
      default: () => ({}),
    },
    durability: {
      type: durabilitySchema,
      default: () => ({}),
    },
  },
  { _id: false }
);

const fitGuideSchema = new mongoose.Schema(
  {
    summary: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    sizeNote: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    width: {
      type: String,
      trim: true,
      maxlength: 80,
    },
    archSupport: {
      type: String,
      trim: true,
      maxlength: 80,
    },
  },
  { _id: false }
);

const ratingDistributionSchema = new mongoose.Schema(
  {
    1: { type: Number, default: 0, min: 0 },
    2: { type: Number, default: 0, min: 0 },
    3: { type: Number, default: 0, min: 0 },
    4: { type: Number, default: 0, min: 0 },
    5: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const fitSummarySchema = new mongoose.Schema(
  {
    runsSmall: { type: Number, default: 0, min: 0 },
    trueToSize: { type: Number, default: 0, min: 0 },
    runsLarge: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    dominant: {
      type: String,
      enum: ['runs_small', 'true_to_size', 'runs_large', null],
      default: null,
    },
  },
  { _id: false }
);

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required']
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  category: {
    type: String,
    enum: ['Training', 'Running', 'Sneaker', 'Classic'],
    required: true
  },
  image: {
    type: String,
    required: true
  },
  price: {
    original: { type: Number, required: true },
    current: { type: Number, required: true }
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  sizes: {
    type: [Number],
    default: [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45]
  },
  stock: {
    type: Number,
    default: 100
  },
  isOnSale: {
    type: Boolean,
    default: false
  },
  description: String,
  gallery: {
    type: [String],
    default: [],
  },
  materials: {
    type: [materialSchema],
    default: [],
  },
  careInstructions: {
    type: [String],
    default: [],
  },
  fitGuide: {
    type: fitGuideSchema,
    default: () => ({}),
  },
  sustainability: {
    type: sustainabilitySchema,
    default: () => ({}),
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0,
  },
  ratingDistribution: {
    type: ratingDistributionSchema,
    default: () => ({}),
  },
  fitSummary: {
    type: fitSummarySchema,
    default: () => ({}),
  }
}, {
  timestamps: true
});

productSchema.index({ gender: 1, category: 1, createdAt: -1 });
productSchema.index({ isOnSale: 1, createdAt: -1 });
productSchema.index({ sizes: 1 });
productSchema.index({ 'price.current': 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });
productSchema.index(
  { name: 'text', category: 'text', description: 'text' },
  {
    name: 'product_text_search',
    weights: {
      name: 10,
      category: 5,
      description: 2,
    },
  }
);

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.price.original > this.price.current) {
    return Math.round((1 - this.price.current / this.price.original) * 100);
  }
  return 0;
});

productSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Product', productSchema);
