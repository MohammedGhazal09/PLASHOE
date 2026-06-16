import { afterEach, expect, test, vi } from 'vitest';
import { joinPublicPath } from './publicPath';

afterEach(() => {
  vi.unstubAllEnvs();
});

test('joins root public paths without duplicate slashes', () => {
  vi.stubEnv('BASE_URL', '/');

  expect(joinPublicPath('/database/database.json')).toBe('/database/database.json');
  expect(joinPublicPath('database/database.json')).toBe('/database/database.json');
});

test('normalizes legacy product image folder casing for hosted static assets', () => {
  vi.stubEnv('BASE_URL', '/');

  expect(joinPublicPath('/database/male/0.jpg')).toBe('/database/Male/0.webp');
  expect(joinPublicPath('/database/female/0.jpg')).toBe('/database/Female/0.webp');
});

test('does not rewrite non-product public jpg paths to webp', () => {
  vi.stubEnv('BASE_URL', '/');

  expect(joinPublicPath('/database/salesImgs/SalesImg1.jpg')).toBe(
    '/database/salesImgs/SalesImg1.jpg'
  );
});

test('joins non-root public paths against Vite base URL', () => {
  vi.stubEnv('BASE_URL', '/storefront/');

  expect(joinPublicPath('/database/database.json')).toBe('/storefront/database/database.json');
});

test('preserves absolute and browser object URLs', () => {
  expect(joinPublicPath('https://example.com/shoe.jpg')).toBe('https://example.com/shoe.jpg');
  expect(joinPublicPath('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
  expect(joinPublicPath('blob:https://example.com/id')).toBe('blob:https://example.com/id');
});
