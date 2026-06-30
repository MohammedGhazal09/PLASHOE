export const DEFAULT_SHIPPING_METHOD_ID = 'standard';

export const SHIPPING_COUNTRY_RULES = [
  {
    country: 'United States',
    countryCode: 'US',
    aliases: ['us', 'usa', 'united states of america'],
    methods: [
      {
        id: 'standard',
        name: 'Standard',
        price: 0,
        estimatedDelivery: '3-5 business days',
      },
      {
        id: 'express',
        name: 'Express',
        price: 15,
        estimatedDelivery: '1-2 business days',
      },
    ],
  },
  {
    country: 'Canada',
    countryCode: 'CA',
    aliases: ['ca'],
    methods: [
      {
        id: 'standard',
        name: 'Standard',
        price: 12,
        estimatedDelivery: '5-8 business days',
      },
      {
        id: 'express',
        name: 'Express',
        price: 28,
        estimatedDelivery: '2-4 business days',
      },
    ],
  },
  {
    country: 'United Kingdom',
    countryCode: 'GB',
    aliases: ['uk', 'gb', 'great britain'],
    methods: [
      {
        id: 'standard',
        name: 'Standard',
        price: 18,
        estimatedDelivery: '6-9 business days',
      },
      {
        id: 'express',
        name: 'Express',
        price: 35,
        estimatedDelivery: '3-5 business days',
      },
    ],
  },
  {
    country: 'Germany',
    countryCode: 'DE',
    aliases: ['de', 'deutschland'],
    methods: [
      {
        id: 'standard',
        name: 'Standard',
        price: 16,
        estimatedDelivery: '5-8 business days',
      },
      {
        id: 'express',
        name: 'Express',
        price: 32,
        estimatedDelivery: '2-4 business days',
      },
    ],
  },
  {
    country: 'France',
    countryCode: 'FR',
    aliases: ['fr'],
    methods: [
      {
        id: 'standard',
        name: 'Standard',
        price: 16,
        estimatedDelivery: '5-8 business days',
      },
      {
        id: 'express',
        name: 'Express',
        price: 32,
        estimatedDelivery: '2-4 business days',
      },
    ],
  },
];

const normalizeCountry = (country = '') => country.trim().toLowerCase();

export const findShippingRuleForCountry = (country) => {
  const normalizedCountry = normalizeCountry(country);

  return SHIPPING_COUNTRY_RULES.find((rule) => {
    if (normalizeCountry(rule.country) === normalizedCountry) return true;
    return rule.aliases.some((alias) => normalizeCountry(alias) === normalizedCountry);
  });
};

export const getShippingCountries = () =>
  SHIPPING_COUNTRY_RULES.map(({ country, countryCode }) => ({
    country,
    countryCode,
  }));
