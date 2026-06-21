import { afterEach, expect, test, vi } from 'vitest';
import { normalizeProduct, normalizeProducts } from './normalizeProduct';

afterEach(() => {
  vi.unstubAllEnvs();
});

test('normalizes backend products into the catalog view model', () => {
  const product = normalizeProduct({
    _id: 'backend-1',
    name: 'Backend Runner',
    gender: 'male',
    category: 'Running',
    image: '/images/runner.jpg',
    price: { original: 150, current: 120 },
    rating: 4.5,
    sizes: [40, 41],
    stock: 7,
    isOnSale: true,
    description: 'Fast shoe',
    gallery: ['/images/runner-side.jpg'],
    materials: [{ label: 'Upper', value: 'Recycled knit' }],
    careInstructions: ['Spot clean'],
    fitGuide: { summary: 'Runs true to size.' },
    recommendationReason: 'Similar running styles',
    sustainability: {
      summary: 'Supplier-documented recycled upper textile.',
      source: 'Supplier material declaration',
      impactMetrics: [
        { label: 'Recycled upper textile', value: 'Documented', source: 'Supplier material declaration' },
        { label: 'Missing source', value: 'Hidden' },
      ],
      certifications: [
        { name: 'Material declaration', issuer: 'PLASHOE supplier compliance' },
        { name: 'Missing issuer' },
      ],
      manufacturing: {
        location: 'Portugal',
        source: 'Supplier onboarding record',
      },
      durability: {
        summary: 'Care-tested for everyday city wear.',
        source: 'PLASHOE care standard',
      },
    },
    reviewCount: 4,
    ratingDistribution: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 2 },
    fitSummary: {
      runsSmall: 0,
      trueToSize: 3,
      runsLarge: 1,
      total: 4,
      dominant: 'true_to_size',
    },
  });

  expect(product).toMatchObject({
    id: 'backend-1',
    name: 'Backend Runner',
    gender: 'male',
    category: 'Running',
    image: '/images/runner.jpg',
    price: { original: 150, current: 120 },
    rating: 4.5,
    sizes: [40, 41],
    stock: 7,
    isOnSale: true,
    description: 'Fast shoe',
    gallery: ['/images/runner-side.jpg'],
    materials: [{ label: 'Upper', value: 'Recycled knit' }],
    careInstructions: ['Spot clean'],
    fitGuide: { summary: 'Runs true to size.' },
    recommendationReason: 'Similar running styles',
    sustainability: {
      summary: 'Supplier-documented recycled upper textile.',
      source: 'Supplier material declaration',
      impactMetrics: [
        { label: 'Recycled upper textile', value: 'Documented', source: 'Supplier material declaration' },
      ],
      certifications: [
        { name: 'Material declaration', issuer: 'PLASHOE supplier compliance' },
      ],
      manufacturing: {
        location: 'Portugal',
        facility: '',
        process: '',
        source: 'Supplier onboarding record',
      },
      durability: {
        summary: 'Care-tested for everyday city wear.',
        repairability: '',
        expectedUse: '',
        source: 'PLASHOE care standard',
      },
    },
    reviewCount: 4,
    ratingDistribution: { 1: 0, 2: 0, 3: 1, 4: 1, 5: 2 },
    fitSummary: {
      runsSmall: 0,
      trueToSize: 3,
      runsLarge: 1,
      total: 4,
      dominant: 'true_to_size',
    },
    source: 'backend',
  });
});

test('normalizes static fallback products with deterministic local ids', () => {
  const product = normalizeProduct(
    {
      name: 'Fallback Runner',
      img: '/database/Male/0.jpg',
      price: { old: '$69.90', new: '$49.90' },
      rating: 5,
      category: 'Training',
    },
    { source: 'fallback', sourceGroup: 'male', index: 0 }
  );

  expect(product).toMatchObject({
    id: 'local-male-0',
    gender: 'male',
    image: '/database/Male/0.webp',
    price: { original: 69.9, current: 49.9 },
    isOnSale: true,
    source: 'fallback',
  });
});

test('uses stable defaults when optional fields are missing', () => {
  const product = normalizeProduct(
    { name: 'Minimal Shoe', price: { current: 80 } },
    { source: 'fallback', sourceGroup: 'female', index: 2 }
  );

  expect(product).toMatchObject({
    id: 'local-female-2',
    name: 'Minimal Shoe',
    gender: 'female',
    category: '',
    image: '',
    price: { original: 80, current: 80 },
    rating: 0,
    stock: 0,
    isOnSale: false,
    description: '',
    materials: [],
    careInstructions: [],
    sustainability: {
      summary: '',
      source: '',
      impactMetrics: [],
      certifications: [],
      manufacturing: {
        location: '',
        facility: '',
        process: '',
        source: '',
      },
      durability: {
        summary: '',
        repairability: '',
        expectedUse: '',
        source: '',
      },
    },
    reviewCount: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    fitSummary: {
      runsSmall: 0,
      trueToSize: 0,
      runsLarge: 0,
      total: 0,
      dominant: null,
    },
  });
  expect(product.gallery).toEqual([]);
  expect(product.sizes).toContain(40);
});

test('normalizes relative image paths against a non-root Vite base URL', () => {
  vi.stubEnv('BASE_URL', '/storefront/');

  const product = normalizeProduct({
    _id: 'backend-2',
    image: '/images/subpath-runner.jpg',
    price: { current: 120 },
  });

  expect(product.image).toBe('/storefront/images/subpath-runner.jpg');
});

test('preserves absolute product image URLs', () => {
  const product = normalizeProduct({
    _id: 'backend-3',
    image: 'https://cdn.example.com/shoe.jpg',
    price: { current: 120 },
  });

  expect(product.image).toBe('https://cdn.example.com/shoe.jpg');
});

test('normalizes product lists with indexed fallback ids', () => {
  const products = normalizeProducts(
    [{ name: 'A' }, { name: 'B' }],
    { source: 'fallback', sourceGroup: 'sale' }
  );

  expect(products.map((product) => product.id)).toEqual(['local-sale-0', 'local-sale-1']);
});
