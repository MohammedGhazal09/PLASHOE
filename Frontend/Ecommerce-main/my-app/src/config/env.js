export const readPublicEnv = (name, fallback = '') => {
  const value = import.meta.env?.[name];

  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return value;
};
