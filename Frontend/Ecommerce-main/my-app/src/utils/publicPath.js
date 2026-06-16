const absoluteUrlPattern = /^(https?:|data:|blob:)/i;

const normalizePublicAssetPath = (value) =>
  value
    .replace(/^database\/male\//i, 'database/Male/')
    .replace(/^database\/female\//i, 'database/Female/')
    .replace(/^(database\/(?:Male|Female)\/\d+)\.jpe?g$/i, '$1.webp');

export const getPublicBasePath = () => {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
};

export const joinPublicPath = (value = '') => {
  if (!value) return '';
  if (absoluteUrlPattern.test(value)) return value;

  const path = normalizePublicAssetPath(String(value).replace(/^\/+/, ''));
  return `${getPublicBasePath()}${path}`;
};
