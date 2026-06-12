const ORIGINAL_ENV = process.env;

const loadConfig = (env = {}) => {
  jest.resetModules();
  process.env = { ...ORIGINAL_ENV };
  delete process.env.REACT_APP_MAPTILER_API_KEY;
  Object.assign(process.env, env);

  return require('./config').config;
};

afterEach(() => {
  process.env = ORIGINAL_ENV;
});

test('uses an empty MapTiler key when no public key is configured', () => {
  const config = loadConfig();

  expect(config.map.apiKey).toBe('');
});

test('uses the configured public MapTiler key when provided', () => {
  const config = loadConfig({ REACT_APP_MAPTILER_API_KEY: 'public-domain-restricted-key' });

  expect(config.map.apiKey).toBe('public-domain-restricted-key');
});
