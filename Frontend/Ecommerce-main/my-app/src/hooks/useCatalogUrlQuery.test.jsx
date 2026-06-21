import { fireEvent, screen } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { renderWithRouter } from '../test/routerTestUtils';
import { useCatalogUrlQuery } from './useCatalogUrlQuery';

function CatalogQueryHarness({ forcedParams = {} }) {
  const { query, setQuery, setPage } = useCatalogUrlQuery({ forcedParams });
  const location = useLocation();

  return (
    <div>
      <pre data-testid="query">{JSON.stringify(query)}</pre>
      <pre data-testid="location">{location.search}</pre>
      <button type="button" onClick={() => setQuery({ q: 'trail', sort: 'price-asc' })}>
        Search
      </button>
      <button type="button" onClick={() => setPage(3)}>
        Page 3
      </button>
    </div>
  );
}

test('restores catalog filters from the URL query string', () => {
  renderWithRouter(<CatalogQueryHarness />, {
    initialEntries: [
      '/collection?q=trail&category=Running&size=41&minPrice=80&maxPrice=140&minRating=4&sale=true&sort=rating&page=2',
    ],
  });

  expect(JSON.parse(screen.getByTestId('query').textContent)).toMatchObject({
    q: 'trail',
    category: 'Running',
    size: '41',
    minPrice: '80',
    maxPrice: '140',
    minRating: '4',
    sale: 'true',
    sort: 'rating',
    page: 2,
    limit: 20,
  });
});

test('writes catalog query updates and page changes back to the URL', () => {
  renderWithRouter(<CatalogQueryHarness />, {
    initialEntries: ['/collection'],
  });

  fireEvent.click(screen.getByText('Search'));
  expect(screen.getByTestId('location')).toHaveTextContent('?q=trail&sort=price-asc');

  fireEvent.click(screen.getByText('Page 3'));
  expect(screen.getByTestId('location')).toHaveTextContent('?q=trail&sort=price-asc&page=3');
});

test('keeps route-forced filters out of the shareable URL', () => {
  renderWithRouter(<CatalogQueryHarness forcedParams={{ gender: 'male' }} />, {
    initialEntries: ['/men?gender=female&page=2'],
  });

  expect(JSON.parse(screen.getByTestId('query').textContent)).toMatchObject({
    gender: 'male',
    page: 2,
  });

  fireEvent.click(screen.getByText('Search'));

  expect(screen.getByTestId('location')).toHaveTextContent('?q=trail&sort=price-asc');
});
