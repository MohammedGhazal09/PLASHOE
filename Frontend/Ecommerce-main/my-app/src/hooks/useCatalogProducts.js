import { useCallback, useEffect, useMemo, useState } from 'react';
import { loadCatalogProducts } from '../services/catalog/catalogService';

const initialPagination = {
  count: 0,
  total: 0,
  page: 1,
  limit: 20,
  pages: 0,
};

export const useCatalogProducts = (params = {}) => {
  const paramsKey = JSON.stringify(params);
  const catalogParams = useMemo(() => JSON.parse(paramsKey), [paramsKey]);
  const [state, setState] = useState({
    products: [],
    pagination: initialPagination,
    loading: true,
    error: null,
    source: 'backend',
  });

  const load = useCallback(
    async ({ keepProducts = true } = {}) => {
      setState((current) => ({
        ...current,
        products: keepProducts ? current.products : [],
        loading: true,
        error: null,
      }));

      const result = await loadCatalogProducts(catalogParams);

      setState({
        products: result.products,
        pagination: result.pagination,
        loading: false,
        error: result.error,
        source: result.source,
      });

      return result;
    },
    [catalogParams]
  );

  useEffect(() => {
    let active = true;

    const run = async () => {
      setState((current) => ({
        ...current,
        loading: true,
        error: null,
      }));

      const result = await loadCatalogProducts(catalogParams);

      if (active) {
        setState({
          products: result.products,
          pagination: result.pagination,
          loading: false,
          error: result.error,
          source: result.source,
        });
      }
    };

    run();

    return () => {
      active = false;
    };
  }, [catalogParams]);

  return {
    ...state,
    reload: load,
  };
};
