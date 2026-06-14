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

test('joins non-root public paths against Vite base URL', () => {
  vi.stubEnv('BASE_URL', '/storefront/');

  expect(joinPublicPath('/database/database.json')).toBe('/storefront/database/database.json');
});

test('preserves absolute and browser object URLs', () => {
  expect(joinPublicPath('https://example.com/shoe.jpg')).toBe('https://example.com/shoe.jpg');
  expect(joinPublicPath('data:image/png;base64,abc')).toBe('data:image/png;base64,abc');
  expect(joinPublicPath('blob:https://example.com/id')).toBe('blob:https://example.com/id');
});
