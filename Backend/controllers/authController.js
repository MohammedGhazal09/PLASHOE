import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { JWT_SECURITY } from '../config/security.js';

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    algorithm: JWT_SECURITY.algorithm,
    expiresIn: process.env.JWT_EXPIRE || JWT_SECURITY.defaultExpiresIn
  });
};

const toAuthUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  addresses: user.addresses || [],
  isAdmin: user.isAdmin,
  token: generateToken(user._id)
});

const ensureDefaultAddress = (addresses) => {
  if (addresses.length > 0 && !addresses.some((address) => address.isDefault)) {
    addresses[0].isDefault = true;
  }
};

// @desc    Register user
// @route   POST /api/auth/register
export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }

    // Create user
    const user = await User.create({ name, email, password });

    res.status(201).json({
      success: true,
      data: toAuthUser(user)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Login user
// @route   POST /api/auth/login
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Check for user
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    res.json({
      success: true,
      data: toAuthUser(user)
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get current user
// @route   GET /api/auth/me
export const getMe = async (req, res) => {
  res.json({
    success: true,
    data: req.user
  });
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
export const updateProfile = async (req, res, next) => {
  try {
    const { name, phone } = req.body;
    
    const user = await User.findById(req.user._id);
    
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    
    await user.save();

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Add address
// @route   POST /api/auth/addresses
export const addAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = { ...req.body };
    
    // If this is the first address or isDefault is true, set as default
    if (user.addresses.length === 0 || address.isDefault) {
      user.addresses.forEach(addr => addr.isDefault = false);
      address.isDefault = true;
    }
    
    user.addresses.push(address);
    await user.save();

    res.status(201).json({
      success: true,
      data: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Set default address
// @route   PUT /api/auth/addresses/:id/default
export const setDefaultAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    user.addresses.forEach((savedAddress) => {
      savedAddress.isDefault = savedAddress._id.toString() === req.params.id;
    });

    await user.save();

    res.json({
      success: true,
      data: user.addresses
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete address
// @route   DELETE /api/auth/addresses/:id
export const deleteAddress = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.addresses.id(req.params.id);

    if (!address) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }

    const wasDefault = address.isDefault;
    user.addresses.pull(req.params.id);

    if (wasDefault) {
      ensureDefaultAddress(user.addresses);
    }
    
    await user.save();

    res.json({
      success: true,
      data: user.addresses
    });
  } catch (error) {
    next(error);
  }
};
