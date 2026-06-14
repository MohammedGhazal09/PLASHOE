import { vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import ProductGrid from './ProductGrid';

vi.mock('./ProductCard', () => ({
  default: ({ product, onQuickView }) => (
    <button type="button" onClick={() => onQuickView(product)}>
      {product.name}
    </button>
  ),
}));

vi.mock('./QuickViewModal', () => ({
  default: ({ product }) => <div>Quick view: {product.name}</div>,
}));

const products = [
  {
    id: 'shoe-1',
    name: 'Running Shoe',
    category: 'Running',
    rating: 4,
    price: { current: 90, original: 120 },
  },
  {
    id: 'shoe-2',
    name: 'Training Shoe',
    category: 'Training',
    rating: 5,
    price: { current: 70, original: 70 },
  },
];

test('renders backend-supported controls without legacy local filters', () => {
  render(
    <ProductGrid
      products={products}
      query={{ page: 1, limit: 20 }}
      pagination={{ page: 1, limit: 20, total: 2, count: 2, pages: 1 }}
      onQueryChange={vi.fn()}
      onPageChange={vi.fn()}
    />
  );

  expect(screen.getByLabelText('Sort products')).toBeInTheDocument();
  expect(screen.getByLabelText('Filter by category')).toBeInTheDocument();
  expect(screen.queryByText('Name')).not.toBeInTheDocument();
  expect(screen.queryByText('All Ratings')).not.toBeInTheDocument();
  expect(screen.queryByText('Price:')).not.toBeInTheDocument();
});

test('emits controlled query changes with page reset', () => {
  const handleQueryChange = vi.fn();

  render(
    <ProductGrid
      products={products}
      query={{ gender: 'male', page: 2, limit: 20 }}
      pagination={{ page: 2, limit: 20, total: 40, count: 20, pages: 2 }}
      onQueryChange={handleQueryChange}
      onPageChange={vi.fn()}
    />
  );

  fireEvent.change(screen.getByLabelText('Sort products'), {
    target: { value: 'price-asc' },
  });

  expect(handleQueryChange).toHaveBeenCalledWith({
    gender: 'male',
    page: 1,
    limit: 20,
    sort: 'price-asc',
  });
});

test('emits previous and next page changes from pagination metadata', () => {
  const handlePageChange = vi.fn();

  render(
    <ProductGrid
      products={products}
      query={{ page: 2, limit: 20 }}
      pagination={{ page: 2, limit: 20, total: 60, count: 20, pages: 3 }}
      onQueryChange={vi.fn()}
      onPageChange={handlePageChange}
    />
  );

  fireEvent.click(screen.getByText('Previous'));
  fireEvent.click(screen.getByText('Next'));

  expect(handlePageChange).toHaveBeenNthCalledWith(1, 1);
  expect(handlePageChange).toHaveBeenNthCalledWith(2, 3);
});

test('keeps local fallback filtering isolated when the grid is used without callbacks', () => {
  render(<ProductGrid products={products} source="fallback" />);

  fireEvent.change(screen.getByLabelText('Filter by category'), {
    target: { value: 'Running' },
  });

  expect(screen.getByText('Running Shoe')).toBeInTheDocument();
  expect(screen.queryByText('Training Shoe')).not.toBeInTheDocument();
});
