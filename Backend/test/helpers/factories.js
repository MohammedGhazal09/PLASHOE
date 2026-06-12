import Cart from "../../models/Cart.js";
import ContactMessage from "../../models/ContactMessage.js";
import Coupon from "../../models/Coupon.js";
import Order from "../../models/Order.js";
import Product from "../../models/Product.js";
import User from "../../models/User.js";

let sequence = 0;

const nextId = () => {
  sequence += 1;
  return sequence;
};

export const createUser = async (overrides = {}) => {
  const id = nextId();

  return User.create({
    name: `Test User ${id}`,
    email: `user-${id}@example.com`,
    password: "password123",
    ...overrides,
  });
};

export const createProduct = async (overrides = {}) => {
  const id = nextId();

  return Product.create({
    name: `Test Shoe ${id}`,
    gender: "male",
    category: "Running",
    image: `/images/test-shoe-${id}.jpg`,
    price: {
      original: 120,
      current: 100,
    },
    sizes: [40, 41, 42, 43],
    stock: 20,
    ...overrides,
  });
};

export const createCoupon = async (overrides = {}) => {
  const id = nextId();

  return Coupon.create({
    code: `SAVE${id}`,
    discountPercentage: 20,
    minOrderAmount: 0,
    validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000),
    isActive: true,
    ...overrides,
  });
};

export const createCartForUser = async (user, items = [], overrides = {}) => {
  const sourceItems =
    items.length > 0
      ? items
      : [
          {
            product: await createProduct(),
            quantity: 1,
            size: 42,
          },
        ];

  const cartItems = sourceItems.map((item) => {
    const product = item.product;

    return {
      product: product._id || product,
      quantity: item.quantity ?? 1,
      size: item.size ?? 42,
      priceAtAdd: item.priceAtAdd ?? product.price?.current ?? 100,
    };
  });

  return Cart.create({
    user: user._id,
    items: cartItems,
    ...overrides,
  });
};

export const createOrder = async (user, overrides = {}) => {
  const product = overrides.items ? null : await createProduct();
  const items =
    overrides.items || [
      {
        product: product._id,
        name: product.name,
        image: product.image,
        quantity: 1,
        size: 42,
        price: product.price.current,
      },
    ];
  const subtotal =
    overrides.subtotal ??
    items.reduce((total, item) => total + item.price * item.quantity, 0);

  return Order.create({
    user: user._id,
    items,
    shippingAddress: validShippingAddress(),
    subtotal,
    total: overrides.total ?? subtotal,
    ...overrides,
  });
};

export const createProviderBackedOrder = async (user, overrides = {}) =>
  createOrder(user, {
    status: "pending",
    paymentStatus: "payment_pending",
    paymentProvider: "stripe",
    paymentProviderSessionId: `session-${nextId()}`,
    paymentCheckoutUrl: "https://checkout.example.test/session",
    inventoryDecremented: true,
    ...overrides,
  });

export const createContactMessage = async (overrides = {}) =>
  ContactMessage.create({
    name: "Contact User",
    email: "contact@example.com",
    subject: "Question",
    message: "I need help with an order.",
    ...overrides,
  });

export const validShippingAddress = (overrides = {}) => ({
  firstName: "Test",
  lastName: "Buyer",
  country: "United States",
  street: "123 Test Street",
  city: "Testville",
  state: "CA",
  zipCode: "90210",
  phone: "5551234567",
  ...overrides,
});
