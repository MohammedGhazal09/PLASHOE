// Centralized configuration file for environment variables
// All environment variables should be accessed through this file
import { readPublicEnv } from './env';

export const config = {
  // API Configuration
  api: {
    baseUrl: readPublicEnv('REACT_APP_API_URL', 'http://localhost:5000/api'),
  },

  // Application Info
  app: {
    name: readPublicEnv('REACT_APP_NAME', 'PLASHOE'),
    description: readPublicEnv(
      'REACT_APP_DESCRIPTION',
      'Sustainable Footwear for a Better Tomorrow'
    ),
  },

  // External Services
  external: {
    unsplashBase: readPublicEnv('REACT_APP_UNSPLASH_BASE_URL', 'https://images.unsplash.com'),
  },

  // Map Configuration
  map: {
    apiKey: readPublicEnv('REACT_APP_MAPTILER_API_KEY'),
    center: {
      lat: parseFloat(readPublicEnv('REACT_APP_MAP_CENTER_LAT')) || 24.7136,
      lng: parseFloat(readPublicEnv('REACT_APP_MAP_CENTER_LNG')) || 46.6753,
    },
    zoom: parseInt(readPublicEnv('REACT_APP_MAP_ZOOM'), 10) || 14,
  },

  // Social Media Links
  social: {
    facebook: readPublicEnv('REACT_APP_FACEBOOK_URL', 'https://facebook.com/plashoe'),
    instagram: readPublicEnv('REACT_APP_INSTAGRAM_URL', 'https://instagram.com/plashoe'),
    twitter: readPublicEnv('REACT_APP_TWITTER_URL', 'https://twitter.com/plashoe'),
    pinterest: readPublicEnv('REACT_APP_PINTEREST_URL', 'https://pinterest.com/plashoe'),
  },

  // Company Info
  company: {
    email: readPublicEnv('REACT_APP_COMPANY_EMAIL', 'info@plashoe.com'),
    phone: readPublicEnv('REACT_APP_COMPANY_PHONE', '+1 (555) 123-4567'),
    address: readPublicEnv(
      'REACT_APP_COMPANY_ADDRESS',
      '123 Eco Street, Green City, CA 90210'
    ),
  },

  // Feature Flags
  features: {
    guestCheckout: readPublicEnv('REACT_APP_ENABLE_GUEST_CHECKOUT') === 'true',
    wishlist: readPublicEnv('REACT_APP_ENABLE_WISHLIST') === 'true',
    reviews: readPublicEnv('REACT_APP_ENABLE_REVIEWS') === 'true',
  },
};

export default config;
