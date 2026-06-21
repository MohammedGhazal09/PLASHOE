import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';
import Review from '../models/Review.js';

dotenv.config();

// Helper to parse price string to number
const parsePrice = (priceStr) => {
  return parseFloat(priceStr.replace('$', ''));
};

// Products from database.json
const productsData = {
  female: [
    { name: "Women's Blush Knit Trainer", img: "/database/Female/0.webp", price: { old: "$69.90", new: "$60.00" }, rating: 5, category: "Training" },
    { name: "Women's Soft Blue Runner", img: "/database/Female/1.webp", price: { old: "$54.90", new: "$54.90" }, rating: 5, category: "Running" },
    { name: "Women's Cream Suede Runner", img: "/database/Female/2.webp", price: { old: "$64.00", new: "$64.00" }, rating: 4.5, category: "Running" },
    { name: "Women's Sage Knit Trainer", img: "/database/Female/3.webp", price: { old: "$59.90", new: "$59.90" }, rating: 4, category: "Training" },
    { name: "Women's Dusty Pink Trainer", img: "/database/Female/4.webp", price: { old: "$64.90", new: "$49.90" }, rating: 4, category: "Training" },
    { name: "Women's Lavender Knit Runner", img: "/database/Female/5.webp", price: { old: "$89.90", new: "$89.90" }, rating: 4, category: "Running" },
    { name: "Women's Ivory Garden Sneaker", img: "/database/Female/6.webp", price: { old: "$44.90", new: "$44.90" }, rating: 3.5, category: "Sneaker" },
    { name: "Women's Pearl Knit Runner", img: "/database/Female/7.webp", price: { old: "$69.90", new: "$57.90" }, rating: 3.5, category: "Running" },
    { name: "Women's Champagne Knit Trainer", img: "/database/Female/8.webp", price: { old: "$59.90", new: "$59.90" }, rating: 3.5, category: "Training" },
    { name: "Women's Mint Knit Trainer", img: "/database/Female/9.webp", price: { old: "$64.90", new: "$64.90" }, rating: 0, category: "Training" },
    { name: "Women's Blush Suede Sneaker", img: "/database/Female/10.webp", price: { old: "$64.90", new: "$49.90" }, rating: 0, category: "Sneaker" },
    { name: "Women's Warm White City Sneaker", img: "/database/Female/11.webp", price: { old: "$64.00", new: "$64.00" }, rating: 0, category: "Sneaker" }
  ],
  male: [
    { name: "Men's Black Knit Runner", img: "/database/Male/0.webp", price: { old: "$79.90", new: "$79.90" }, rating: 5, category: "Running" },
    { name: "Men's Navy Classic Sneaker", img: "/database/Male/1.webp", price: { old: "$79.90", new: "$69.00" }, rating: 5, category: "Classic" },
    { name: "Men's Forest Knit Runner", img: "/database/Male/2.webp", price: { old: "$79.90", new: "$79.90" }, rating: 4.5, category: "Running" },
    { name: "Men's Sand Knit Sneaker", img: "/database/Male/3.webp", price: { old: "$74.90", new: "$74.90" }, rating: 4, category: "Sneaker" },
    { name: "Men's Charcoal Knit Runner", img: "/database/Male/4.webp", price: { old: "$104.90", new: "$89.90" }, rating: 3.5, category: "Running" },
    { name: "Men's Burgundy Knit Runner", img: "/database/Male/5.webp", price: { old: "$74.90", new: "$74.90" }, rating: 0, category: "Running" },
    { name: "Men's Taupe Leather Sneaker", img: "/database/Male/6.webp", price: { old: "$104.90", new: "$104.90" }, rating: 0, category: "Sneaker" },
    { name: "Men's White Slate Runner", img: "/database/Male/7.webp", price: { old: "$79.90", new: "$79.90" }, rating: 0, category: "Running" }
  ]
};

const detailFieldsFor = (product, gender) => {
  const genderLabel = gender === 'female' ? "Women's" : "Men's";
  const activity = product.category.toLowerCase();

  return {
    description: `${product.name} pairs a breathable upper with a cushioned sole for everyday ${activity} wear.`,
    gallery: [product.img],
    materials: [
      { label: 'Upper', value: 'Recycled knit textile with reinforced panels' },
      { label: 'Lining', value: 'Soft recycled polyester mesh' },
      { label: 'Outsole', value: 'Durable rubber traction sole' },
    ],
    careInstructions: [
      'Brush off dry dirt with a soft brush.',
      'Spot clean with mild soap and cold water.',
      'Air dry away from direct heat.',
    ],
    fitGuide: {
      summary: `${genderLabel} ${product.category.toLowerCase()} fit with a balanced true-to-size feel.`,
      sizeNote: 'Choose your usual EU size. If you are between sizes, size up for extra toe room.',
      width: 'Standard width',
      archSupport: product.category === 'Running' ? 'Medium support' : 'Light support',
    },
    sustainability: {
      summary: 'Product sustainability details are based on the material bill and supplier onboarding records captured for this sample catalog.',
      source: 'PLASHOE sample material bill v2026',
      impactMetrics: [
        {
          label: 'Recycled upper textile',
          value: 'Documented',
          source: 'Supplier material declaration',
        },
      ],
      manufacturing: {
        location: 'Partner workshop',
        process: 'Cut, stitch, assemble, and finish using the documented product bill of materials.',
        source: 'Supplier onboarding record',
      },
      durability: {
        summary: 'Care instructions are provided to help extend normal product life.',
        expectedUse: 'Everyday wear when cleaned and dried according to care guidance.',
        source: 'PLASHOE product care standard',
      },
    },
  };
};

// Transform products to our schema
const transformProducts = () => {
  const products = [];

  // Female products
  productsData.female.forEach(p => {
    const original = parsePrice(p.price.old);
    const current = parsePrice(p.price.new);
    products.push({
      name: p.name,
      gender: 'female',
      category: p.category,
      image: p.img,
      price: { original, current },
      rating: p.rating,
      isOnSale: current < original,
      stock: 100,
      sizes: [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45],
      ...detailFieldsFor(p, 'female'),
    });
  });

  // Male products
  productsData.male.forEach(p => {
    const original = parsePrice(p.price.old);
    const current = parsePrice(p.price.new);
    products.push({
      name: p.name,
      gender: 'male',
      category: p.category,
      image: p.img,
      price: { original, current },
      rating: p.rating,
      isOnSale: current < original,
      stock: 100,
      sizes: [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45],
      ...detailFieldsFor(p, 'male'),
    });
  });

  return products;
};

// Default coupons
const coupons = [
  {
    code: 'MRZRZ',
    discountPercentage: 20,
    minOrderAmount: 0,
    isActive: true
  },
  {
    code: 'WELCOME10',
    discountPercentage: 10,
    minOrderAmount: 50,
    isActive: true
  },
  {
    code: 'SAVE25',
    discountPercentage: 25,
    minOrderAmount: 100,
    isActive: true
  }
];

const LOCAL_MONGO_HOSTS = new Set(['localhost', '127.0.0.1', '::1']);

export const isLocalMongoUri = (mongoUri = '') => {
  try {
    const parsed = new URL(mongoUri);

    return parsed.protocol === 'mongodb:' && LOCAL_MONGO_HOSTS.has(parsed.hostname);
  } catch {
    return false;
  }
};

export const assertSafeSeedTarget = (env = process.env) => {
  if (!env.MONGO_URI) {
    throw new Error('MONGO_URI is required for database seeding');
  }

  if (env.ALLOW_NON_LOCAL_SEED === 'true') {
    return;
  }

  if (!isLocalMongoUri(env.MONGO_URI)) {
    throw new Error(
      'Refusing to seed a non-local MongoDB URI. Set ALLOW_NON_LOCAL_SEED=true only for disposable data.'
    );
  }
};

export const resolveAdminUser = (env = process.env) => {
  const email = env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = env.SEED_ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error('SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required for admin seeding');
  }

  if (password.length < 12) {
    throw new Error('SEED_ADMIN_PASSWORD must be at least 12 characters');
  }

  return {
    name: env.SEED_ADMIN_NAME?.trim() || 'Admin',
    email,
    password,
    isAdmin: true,
  };
};

export const seedDB = async (env = process.env) => {
  try {
    assertSafeSeedTarget(env);
    const adminUser = resolveAdminUser(env);

    await mongoose.connect(env.MONGO_URI);
    console.log('MongoDB Connected');

    // Clear existing data
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    await User.deleteMany({});
    await Review.deleteMany({});
    console.log('Cleared existing data');

    // Insert products
    const products = transformProducts();
    await Product.insertMany(products);
    console.log(`Inserted ${products.length} products`);

    // Insert coupons
    await Coupon.insertMany(coupons);
    console.log(`Inserted ${coupons.length} coupons`);

    // Create admin user
    await User.create(adminUser);
    console.log(`Created admin user (${adminUser.email})`);

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  seedDB();
}
