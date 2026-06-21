import { afterEach, expect, test, vi } from 'vitest';

const loadConfig = async (env = {}) => {
  vi.resetModules();
  vi.unstubAllEnvs();

  Object.entries({
    REACT_APP_MAPTILER_API_KEY: '',
    REACT_APP_ENABLE_WISHLIST: '',
    REACT_APP_ENABLE_REVIEWS: '',
    ...env,
  }).forEach(([name, value]) => {
    vi.stubEnv(name, value);
  });

  return (await import('./config')).config;
};

afterEach(() => {
  vi.unstubAllEnvs();
});

test('uses an empty MapTiler key when no public key is configured', async () => {
  const config = await loadConfig();

  expect(config.map.apiKey).toBe('');
});

test('uses the configured public MapTiler key when provided', async () => {
  const config = await loadConfig({ REACT_APP_MAPTILER_API_KEY: 'public-domain-restricted-key' });

  expect(config.map.apiKey).toBe('public-domain-restricted-key');
});

test('enables wishlist by default', async () => {
  const config = await loadConfig();

  expect(config.features.wishlist).toBe(true);
});

test('allows wishlist to be disabled with an explicit false flag', async () => {
  const config = await loadConfig({ REACT_APP_ENABLE_WISHLIST: 'false' });

  expect(config.features.wishlist).toBe(false);
});

test('enables reviews by default', async () => {
  const config = await loadConfig();

  expect(config.features.reviews).toBe(true);
});

test('allows reviews to be disabled with an explicit false flag', async () => {
  const config = await loadConfig({ REACT_APP_ENABLE_REVIEWS: 'false' });

  expect(config.features.reviews).toBe(false);
});
