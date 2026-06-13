import mongoose from 'mongoose';

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
  description: String
}, {
  timestamps: true
});

productSchema.index({ gender: 1, category: 1, createdAt: -1 });
productSchema.index({ isOnSale: 1, createdAt: -1 });
productSchema.index({ 'price.current': 1 });
productSchema.index({ rating: -1 });
productSchema.index({ createdAt: -1 });

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (this.price.original > this.price.current) {
    return Math.round((1 - this.price.current / this.price.original) * 100);
  }
  return 0;
});

productSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Product', productSchema);
