import Cart from '../models/Cart.js';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';

const stockConflict = ({ message, product, cartItemId, requested }) => ({
  success: false,
  message,
  errors: [
    {
      code: 'INSUFFICIENT_STOCK',
      resource: 'product',
      productId: product._id.toString(),
      cartItemId,
      requested,
      available: product.stock
    }
  ]
});

const productUnavailableConflict = ({ productId, cartItemId, requested }) => ({
  code: 'PRODUCT_UNAVAILABLE',
  resource: 'product',
  productId,
  ...(cartItemId ? { cartItemId } : {}),
  requested,
  available: 0
});

const toIdString = (value) => {
  if (!value) return '';
  if (value._id) return value._id.toString();
  return value.toString();
};

const cartLineKey = ({ productId, size }) => `${productId}:${size}`;

const aggregateMergeItems = (items = []) => {
  const byKey = new Map();

  for (const item of items) {
    const productId = toIdString(item.productId);
    const size = Number(item.size);
    const key = cartLineKey({ productId, size });
    const current = byKey.get(key) || { productId, size, quantity: 0 };

    current.quantity += Number(item.quantity || 1);
    byKey.set(key, current);
  }

  return [...byKey.values()];
};

const getCartLineProductId = (item) => toIdString(item.product);

const getCartLineKey = (item) =>
  cartLineKey({ productId: getCartLineProductId(item), size: Number(item.size) });

const mergeConflictResponse = (res, message, errors) =>
  res.status(409).json({
    success: false,
    message,
    errors
  });

// @desc    Get user's cart
// @route   GET /api/cart
export const getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user._id })
      .populate('items.product', 'name image price');
    
    if (!cart) {
      cart = await Cart.create({ user: req.user._id, items: [] });
    }

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart/items
export const addToCart = async (req, res, next) => {
  try {
    const { productId, quantity = 1, size } = req.body;

    // Validate product
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found'
      });
    }

    // Validate size
    if (!size || size < 35 || size > 45) {
      return res.status(400).json({
        success: false,
        message: 'Valid size (35-45) is required'
      });
    }

    let cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    // Check if item already in cart with same size
    const existingItem = cart.items.find(
      item => item.product.toString() === productId && item.size === size
    );
    const requestedQuantity = existingItem
      ? existingItem.quantity + quantity
      : quantity;

    if (requestedQuantity > product.stock) {
      return res.status(409).json(
        stockConflict({
          message: 'Requested quantity exceeds available stock',
          product,
          cartItemId: existingItem?._id?.toString(),
          requested: requestedQuantity
        })
      );
    }

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.items.push({
        product: productId,
        quantity,
        size,
        priceAtAdd: product.price.current
      });
    }

    await cart.save();
    
    // Populate for response
    await cart.populate('items.product', 'name image price');

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Merge guest cart items into authenticated cart
// @route   POST /api/cart/merge
export const mergeCartItems = async (req, res, next) => {
  try {
    const incomingItems = aggregateMergeItems(req.body.items);
    let cart = await Cart.findOne({ user: req.user._id });
    const existingItems = cart?.items || [];
    const productIds = new Set(incomingItems.map((item) => item.productId));

    for (const item of existingItems) {
      productIds.add(getCartLineProductId(item));
    }

    const products = await Product.find({ _id: { $in: [...productIds] } });
    const productsById = new Map(products.map((product) => [product._id.toString(), product]));
    const errors = [];
    const finalQuantities = new Map();

    for (const item of existingItems) {
      const productId = getCartLineProductId(item);
      const key = getCartLineKey(item);
      const current = finalQuantities.get(key) || {
        productId,
        size: Number(item.size),
        quantity: 0,
        cartItemId: item._id.toString()
      };

      current.quantity += item.quantity;
      finalQuantities.set(key, current);

      if (!productsById.has(productId)) {
        errors.push(
          productUnavailableConflict({
            productId,
            cartItemId: item._id.toString(),
            requested: item.quantity
          })
        );
      }
    }

    for (const item of incomingItems) {
      const key = cartLineKey(item);
      const current = finalQuantities.get(key) || {
        productId: item.productId,
        size: item.size,
        quantity: 0
      };

      current.quantity += item.quantity;
      finalQuantities.set(key, current);

      if (!productsById.has(item.productId)) {
        errors.push(
          productUnavailableConflict({
            productId: item.productId,
            requested: item.quantity
          })
        );
      }
    }

    for (const item of finalQuantities.values()) {
      const product = productsById.get(item.productId);
      if (product && item.quantity > product.stock) {
        errors.push({
          code: 'INSUFFICIENT_STOCK',
          resource: 'product',
          productId: item.productId,
          ...(item.cartItemId ? { cartItemId: item.cartItemId } : {}),
          requested: item.quantity,
          available: product.stock
        });
      }
    }

    if (errors.length > 0) {
      return mergeConflictResponse(
        res,
        'Some cart items need review before checkout',
        errors
      );
    }

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    for (const item of incomingItems) {
      const existingItem = cart.items.find(
        (cartItem) => getCartLineKey(cartItem) === cartLineKey(item)
      );

      if (existingItem) {
        existingItem.quantity += item.quantity;
      } else {
        const product = productsById.get(item.productId);
        cart.items.push({
          product: item.productId,
          quantity: item.quantity,
          size: item.size,
          priceAtAdd: product.price.current
        });
      }
    }

    await cart.save();
    await cart.populate('items.product', 'name image price');

    res.json({
      success: true,
      message: 'Cart merged',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update cart item quantity
// @route   PUT /api/cart/items/:itemId
export const updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        message: 'Quantity must be at least 1'
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    const item = cart.items.id(req.params.itemId);
    
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found in cart'
      });
    }

    const product = await Product.findById(item.product);
    if (!product) {
      return res.status(409).json({
        success: false,
        message: 'Cart item product is no longer available',
        errors: [
          {
            code: 'PRODUCT_UNAVAILABLE',
            resource: 'product',
            productId: item.product.toString(),
            cartItemId: item._id.toString(),
            requested: quantity,
            available: 0
          }
        ]
      });
    }

    if (quantity > product.stock) {
      return res.status(409).json(
        stockConflict({
          message: 'Requested quantity exceeds available stock',
          product,
          cartItemId: item._id.toString(),
          requested: quantity
        })
      );
    }

    item.quantity = quantity;
    await cart.save();
    
    await cart.populate('items.product', 'name image price');

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/items/:itemId
export const removeFromCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    cart.items = cart.items.filter(
      item => item._id.toString() !== req.params.itemId
    );
    
    await cart.save();
    await cart.populate('items.product', 'name image price');

    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
export const clearCart = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (cart) {
      cart.items = [];
      cart.couponCode = undefined;
      cart.discount = 0;
      await cart.save();
    }

    res.json({
      success: true,
      message: 'Cart cleared'
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Apply coupon to cart
// @route   POST /api/cart/coupon
export const applyCoupon = async (req, res, next) => {
  try {
    const { code } = req.body;
    
    const coupon = await Coupon.findOne({ code: code.toUpperCase() });
    
    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: 'Coupon not found'
      });
    }

    if (!coupon.isValid()) {
      return res.status(400).json({
        success: false,
        message: 'Coupon is not valid or has expired'
      });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Cart not found'
      });
    }

    // Check minimum order amount
    const subtotal = cart.items.reduce((sum, item) => sum + (item.priceAtAdd * item.quantity), 0);
    if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is $${coupon.minOrderAmount}`
      });
    }

    cart.couponCode = coupon.code;
    cart.discount = coupon.discountPercentage;
    await cart.save();
    
    await cart.populate('items.product', 'name image price');

    res.json({
      success: true,
      message: `Coupon applied: ${coupon.discountPercentage}% off`,
      data: cart
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Remove coupon from cart
// @route   DELETE /api/cart/coupon
export const removeCoupon = async (req, res, next) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id });
    
    if (!cart) {
      return res.json({
        success: true,
        message: 'Coupon removed',
        data: null
      });
    }

    cart.couponCode = undefined;
    cart.discount = 0;
    await cart.save();

    await cart.populate('items.product', 'name image price');

    res.json({
      success: true,
      message: 'Coupon removed',
      data: cart
    });
  } catch (error) {
    next(error);
  }
};
