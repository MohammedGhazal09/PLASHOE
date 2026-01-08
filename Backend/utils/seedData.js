import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Product from '../models/Product.js';
import Coupon from '../models/Coupon.js';
import User from '../models/User.js';

dotenv.config();

// Helper to parse price string to number
const parsePrice = (priceStr) => {
  return parseFloat(priceStr.replace('$', ''));
};

// Products from database.json
const productsData = {
  female: [
    { name: "Women's Blue Training", img: "/database/female/0.jpg", price: { old: "$69.90", new: "$60.00" }, rating: 5, category: "Training" },
    { name: "Women's Candy City Run", img: "/database/female/1.jpg", price: { old: "$54.90", new: "$54.90" }, rating: 5, category: "Running" },
    { name: "Women's Choco City Run", img: "/database/female/2.jpg", price: { old: "$64.00", new: "$64.00" }, rating: 4.5, category: "Running" },
    { name: "Women's Cream Suede", img: "/database/female/3.jpg", price: { old: "$59.90", new: "$59.90" }, rating: 4, category: "Sneaker" },
    { name: "Women's Green Training", img: "/database/female/4.jpg", price: { old: "$64.90", new: "$49.90" }, rating: 4, category: "Training" },
    { name: "Women's Mint Sneaker", img: "/database/female/5.jpg", price: { old: "$89.90", new: "$89.90" }, rating: 4, category: "Sneaker" },
    { name: "Women's Orange Sneaker", img: "/database/female/6.jpg", price: { old: "$44.90", new: "$44.90" }, rating: 3.5, category: "Sneaker" },
    { name: "Women's Peach Training", img: "/database/female/7.jpg", price: { old: "$69.90", new: "$57.90" }, rating: 3.5, category: "Training" },
    { name: "Women's Pink Suede", img: "/database/female/8.jpg", price: { old: "$59.90", new: "$59.90" }, rating: 3.5, category: "Sneaker" },
    { name: "Women's Pink Training", img: "/database/female/9.jpg", price: { old: "$64.90", new: "$64.90" }, rating: 0, category: "Training" },
    { name: "Women's Beige Training", img: "/database/female/10.jpg", price: { old: "$64.90", new: "$49.90" }, rating: 0, category: "Training" },
    { name: "Women's Tosca City Run", img: "/database/female/11.jpg", price: { old: "$64.00", new: "$64.00" }, rating: 0, category: "Running" }
  ],
  male: [
    { name: "Men's Black Running", img: "/database/male/0.jpg", price: { old: "$79.90", new: "$79.90" }, rating: 5, category: "Running" },
    { name: "Men's Classic Blue", img: "/database/male/1.jpg", price: { old: "$79.90", new: "$69.00" }, rating: 5, category: "Classic" },
    { name: "Men's Classic Mint", img: "/database/male/2.jpg", price: { old: "$79.90", new: "$79.90" }, rating: 4.5, category: "Classic" },
    { name: "Men's Earth-Tone Sneaker", img: "/database/male/3.jpg", price: { old: "$74.90", new: "$74.90" }, rating: 4, category: "Sneaker" },
    { name: "Men's Green Running", img: "/database/male/4.jpg", price: { old: "$104.90", new: "$89.90" }, rating: 3.5, category: "Running" },
    { name: "Men's Moonstone Sneaker", img: "/database/male/5.jpg", price: { old: "$74.90", new: "$74.90" }, rating: 0, category: "Sneaker" },
    { name: "Men's Navy Running", img: "/database/male/6.jpg", price: { old: "$104.90", new: "$104.90" }, rating: 0, category: "Running" },
    { name: "Men's Red Running", img: "/database/male/7.jpg", price: { old: "$79.90", new: "$79.90" }, rating: 0, category: "Running" }
  ]
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
      sizes: [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45]
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
      sizes: [35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45]
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

// Admin user
const adminUser = {
  name: 'Admin',
  email: 'admin@plashoe.com',
  password: 'admin123',
  isAdmin: true
};

const seedDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');

    // Clear existing data
    await Product.deleteMany({});
    await Coupon.deleteMany({});
    await User.deleteMany({});
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
    console.log('Created admin user (admin@plashoe.com / admin123)');

    console.log('\n✅ Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedDB();
