// Centralized configuration file for environment variables
// All environment variables should be accessed through this file

export const config = {
  // API Configuration
  api: {
    baseUrl: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  },

  // Application Info
  app: {
    name: process.env.REACT_APP_NAME || 'PLASHOE',
    description: process.env.REACT_APP_DESCRIPTION || 'Sustainable Footwear for a Better Tomorrow',
  },

  // External Services
  external: {
    unsplashBase: process.env.REACT_APP_UNSPLASH_BASE_URL || 'https://images.unsplash.com',
  },

  // Map Configuration
  map: {
    apiKey: process.env.REACT_APP_MAPTILER_API_KEY || '2FaPE8zf7cPPLPgGQNjC',
    center: {
      lat: parseFloat(process.env.REACT_APP_MAP_CENTER_LAT) || 24.7136,
      lng: parseFloat(process.env.REACT_APP_MAP_CENTER_LNG) || 46.6753,
    },
    zoom: parseInt(process.env.REACT_APP_MAP_ZOOM) || 14,
  },

  // Social Media Links
  social: {
    facebook: process.env.REACT_APP_FACEBOOK_URL || 'https://facebook.com/plashoe',
    instagram: process.env.REACT_APP_INSTAGRAM_URL || 'https://instagram.com/plashoe',
    twitter: process.env.REACT_APP_TWITTER_URL || 'https://twitter.com/plashoe',
    pinterest: process.env.REACT_APP_PINTEREST_URL || 'https://pinterest.com/plashoe',
  },

  // Company Info
  company: {
    email: process.env.REACT_APP_COMPANY_EMAIL || 'info@plashoe.com',
    phone: process.env.REACT_APP_COMPANY_PHONE || '+1 (555) 123-4567',
    address: process.env.REACT_APP_COMPANY_ADDRESS || '123 Eco Street, Green City, CA 90210',
  },

  // Feature Flags
  features: {
    guestCheckout: process.env.REACT_APP_ENABLE_GUEST_CHECKOUT === 'true',
    wishlist: process.env.REACT_APP_ENABLE_WISHLIST === 'true',
    reviews: process.env.REACT_APP_ENABLE_REVIEWS === 'true',
  },
};

export default config;
