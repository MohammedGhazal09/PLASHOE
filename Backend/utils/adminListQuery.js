export const DEFAULT_ADMIN_LIMIT = 20;
export const MAX_ADMIN_LIMIT = 100;

export const escapeRegex = (value = '') =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const buildPagination = ({ page = 1, limit = DEFAULT_ADMIN_LIMIT } = {}) => {
  const normalizedPage = Math.max(1, Number(page) || 1);
  const normalizedLimit = Math.min(
    MAX_ADMIN_LIMIT,
    Math.max(1, Number(limit) || DEFAULT_ADMIN_LIMIT)
  );

  return {
    page: normalizedPage,
    limit: normalizedLimit,
    skip: (normalizedPage - 1) * normalizedLimit,
  };
};

export const buildPaginationEnvelope = ({ total, page, limit, data }) => ({
  success: true,
  count: data.length,
  total,
  page,
  limit,
  pages: Math.ceil(total / limit),
  data,
});

export const buildDateRangeFilter = ({ from, to } = {}) => {
  const range = {};

  if (from) {
    range.$gte = from;
  }

  if (to) {
    range.$lte = to;
  }

  return Object.keys(range).length > 0 ? range : undefined;
};
