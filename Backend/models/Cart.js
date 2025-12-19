import mongoose from 'mongoose';

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  size: {
    type: Number,
    required: true,
    min: 35,
    max: 45
  },
  priceAtAdd: {
    type: Number,
    required: true
  }
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  items: [cartItemSchema],
  couponCode: String,
  discount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Virtual for subtotal
cartSchema.virtual('subtotal').get(function() {
  return this.items.reduce((total, item) => {
    return total + (item.priceAtAdd * item.quantity);
  }, 0);
});

// Virtual for total after discount
cartSchema.virtual('total').get(function() {
  const subtotal = this.subtotal;
  return subtotal - (subtotal * this.discount / 100);
});

cartSchema.set('toJSON', { virtuals: true });

export default mongoose.model('Cart', cartSchema);
