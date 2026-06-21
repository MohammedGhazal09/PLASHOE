import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const DEFAULT_QUERY = { page: 1, limit: 20 };
const CATALOG_QUERY_KEYS = [
  'q',
  'gender',
  'category',
  'sale',
  'size',
  'minPrice',
  'maxPrice',
  'minRating',
  'sort',
  'page',
  'limit',
];

const normalizeValue = (value) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const normalizePageValue = (value, fallback) => {
  const number = Number(value);
  return Number.isInteger(number) && number > 0 ? number : fallback;
};

const shouldOmitFromUrl = (key, value, defaultQuery, forcedParams) => {
  if (Object.prototype.hasOwnProperty.call(forcedParams, key)) return true;
  if (value === undefined || value === null || value === '') return true;
  if (key === 'category' && value === 'all') return true;
  if (key === 'sort' && value === 'default') return true;
  if (key === 'sale' && (value === false || value === 'false')) return true;
  if (key === 'page' && Number(value) === Number(defaultQuery.page || DEFAULT_QUERY.page)) return true;
  if (key === 'limit' && Number(value) === Number(defaultQuery.limit || DEFAULT_QUERY.limit)) return true;
  return false;
};

const readQueryFromSearch = (searchParams, defaultQuery, forcedParams) => {
  const query = { ...DEFAULT_QUERY, ...defaultQuery };

  CATALOG_QUERY_KEYS.forEach((key) => {
    const value = normalizeValue(searchParams.get(key));
    if (value !== undefined) query[key] = value;
  });

  query.page = normalizePageValue(query.page, DEFAULT_QUERY.page);
  query.limit = normalizePageValue(query.limit, DEFAULT_QUERY.limit);

  return {
    ...query,
    ...forcedParams,
  };
};

const serializeQuery = (query, defaultQuery, forcedParams) => {
  const nextSearchParams = new URLSearchParams();

  CATALOG_QUERY_KEYS.forEach((key) => {
    const value = normalizeValue(query[key]);
    if (!shouldOmitFromUrl(key, value, defaultQuery, forcedParams)) {
      nextSearchParams.set(key, String(value));
    }
  });

  return nextSearchParams;
};

export const useCatalogUrlQuery = ({
  defaultQuery = DEFAULT_QUERY,
  forcedParams = {},
} = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const defaultQueryKey = JSON.stringify(defaultQuery);
  const forcedParamsKey = JSON.stringify(forcedParams);

  const query = useMemo(
    () =>
      readQueryFromSearch(
        searchParams,
        JSON.parse(defaultQueryKey),
        JSON.parse(forcedParamsKey)
      ),
    [defaultQueryKey, forcedParamsKey, searchParams]
  );

  const updateUrlQuery = useCallback(
    (nextQuery) => {
      setSearchParams(
        serializeQuery(
          nextQuery,
          JSON.parse(defaultQueryKey),
          JSON.parse(forcedParamsKey)
        )
      );
    },
    [defaultQueryKey, forcedParamsKey, setSearchParams]
  );

  const setQuery = useCallback(
    (updates) => {
      updateUrlQuery({
        ...query,
        ...updates,
        page: updates.page || DEFAULT_QUERY.page,
      });
    },
    [query, updateUrlQuery]
  );

  const setPage = useCallback(
    (page) => {
      updateUrlQuery({
        ...query,
        page,
      });
    },
    [query, updateUrlQuery]
  );

  return {
    query,
    setQuery,
    setPage,
  };
};

