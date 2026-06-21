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
    gender: 'male',
    category: 'Running',
    description: 'Lightweight road runner',
    rating: 4,
    price: { current: 90, original: 120 },
    sizes: [40, 41],
    isOnSale: true,
  },
  {
    id: 'shoe-2',
    name: 'Training Shoe',
    gender: 'male',
    category: 'Training',
    description: 'Gym trainer',
    rating: 5,
    price: { current: 70, original: 70 },
    sizes: [42, 43],
    isOnSale: false,
  },
];

test('renders backend-supported discovery controls', () => {
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
  expect(screen.getByLabelText('Search products')).toBeInTheDocument();
  expect(screen.getByLabelText('Filter by category')).toBeInTheDocument();
  expect(screen.getByLabelText('Filter by size')).toBeInTheDocument();
  expect(screen.getByLabelText('Minimum price')).toBeInTheDocument();
  expect(screen.getByLabelText('Maximum price')).toBeInTheDocument();
  expect(screen.getByLabelText('Minimum rating')).toBeInTheDocument();
  expect(screen.getByLabelText('Sale products only')).toBeInTheDocument();
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

test('applies active controlled filters and sort to currently rendered products', () => {
  render(
    <ProductGrid
      products={[
        ...products,
        {
          id: 'shoe-3',
          name: 'Budget Runner',
          gender: 'male',
          category: 'Running',
          description: 'Budget road runner',
          rating: 2,
          price: { current: 50, original: 50 },
          sizes: [41],
          isOnSale: false,
        },
      ]}
      query={{ category: 'Running', sort: 'price-asc', page: 1, limit: 20 }}
      pagination={{ page: 1, limit: 20, total: 3, count: 3, pages: 1 }}
      onQueryChange={vi.fn()}
      onPageChange={vi.fn()}
    />
  );

  expect(screen.queryByText('Training Shoe')).not.toBeInTheDocument();
  expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
    'Budget Runner',
    'Running Shoe',
  ]);
  expect(screen.getByText('Showing 2 of 2 products')).toBeInTheDocument();
});

test('applies advanced search, size, price, rating, and sale filters', () => {
  render(
    <ProductGrid
      products={[
        ...products,
        {
          id: 'shoe-3',
          name: 'Trail Runner',
          gender: 'male',
          category: 'Running',
          description: 'Trail traction shoe',
          rating: 4.8,
          price: { current: 110, original: 150 },
          sizes: [41, 42],
          isOnSale: true,
        },
      ]}
      query={{
        q: 'trail',
        size: '41',
        minPrice: '100',
        maxPrice: '120',
        minRating: '4',
        sale: 'true',
        page: 1,
        limit: 20,
      }}
      pagination={{ page: 1, limit: 20, total: 3, count: 3, pages: 1 }}
      onQueryChange={vi.fn()}
      onPageChange={vi.fn()}
    />
  );

  expect(screen.getByText('Trail Runner')).toBeInTheDocument();
  expect(screen.queryByText('Running Shoe')).not.toBeInTheDocument();
  expect(screen.queryByText('Training Shoe')).not.toBeInTheDocument();
});

test('emits advanced query changes with page reset', () => {
  const handleQueryChange = vi.fn();

  render(
    <ProductGrid
      products={products}
      query={{ page: 3, limit: 20 }}
      pagination={{ page: 3, limit: 20, total: 40, count: 20, pages: 3 }}
      onQueryChange={handleQueryChange}
      onPageChange={vi.fn()}
    />
  );

  fireEvent.change(screen.getByLabelText('Search products'), {
    target: { value: 'trail' },
  });
  fireEvent.change(screen.getByLabelText('Filter by size'), {
    target: { value: '41' },
  });
  fireEvent.change(screen.getByLabelText('Minimum price'), {
    target: { value: '80' },
  });
  fireEvent.change(screen.getByLabelText('Maximum price'), {
    target: { value: '140' },
  });
  fireEvent.change(screen.getByLabelText('Minimum rating'), {
    target: { value: '4' },
  });
  fireEvent.click(screen.getByLabelText('Sale products only'));

  expect(handleQueryChange).toHaveBeenCalledWith({ page: 1, limit: 20, q: 'trail' });
  expect(handleQueryChange).toHaveBeenCalledWith({ page: 1, limit: 20, size: '41' });
  expect(handleQueryChange).toHaveBeenCalledWith({ page: 1, limit: 20, minPrice: '80' });
  expect(handleQueryChange).toHaveBeenCalledWith({ page: 1, limit: 20, maxPrice: '140' });
  expect(handleQueryChange).toHaveBeenCalledWith({ page: 1, limit: 20, minRating: '4' });
  expect(handleQueryChange).toHaveBeenCalledWith({ page: 1, limit: 20, sale: 'true' });
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

test('renders clear loading and fallback error states', () => {
  render(
    <ProductGrid
      products={products}
      loading={true}
      error={new Error('network')}
      source="fallback"
    />
  );

  expect(screen.getByRole('status')).toHaveTextContent('Updating catalog');
  expect(screen.getByRole('alert')).toHaveTextContent('Live catalog unavailable');
});
