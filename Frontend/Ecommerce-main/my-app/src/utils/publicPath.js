const absoluteUrlPattern = /^(https?:|data:|blob:)/i;

export const getPublicBasePath = () => {
  const base = import.meta.env.BASE_URL || '/';
  return base.endsWith('/') ? base : `${base}/`;
};

export const joinPublicPath = (value = '') => {
  if (!value) return '';
  if (absoluteUrlPattern.test(value)) return value;

  const path = String(value).replace(/^\/+/, '');
  return `${getPublicBasePath()}${path}`;
};
