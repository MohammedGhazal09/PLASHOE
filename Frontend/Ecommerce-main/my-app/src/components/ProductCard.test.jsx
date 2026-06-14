import { vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import ProductCard from './ProductCard';

const { mockAddItem, mockOpenCart, mockToastSuccess, mockToastError } = vi.hoisted(() => ({
  mockAddItem: vi.fn(),
  mockOpenCart: vi.fn(),
  mockToastSuccess: vi.fn(),
  mockToastError: vi.fn(),
}));

vi.mock('../store/cartStore', () => ({
  useCartStore: () => ({
    addItem: mockAddItem,
    openCart: mockOpenCart,
  }),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: (...args) => mockToastSuccess(...args),
    error: (...args) => mockToastError(...args),
  },
  success: (...args) => mockToastSuccess(...args),
  error: (...args) => mockToastError(...args),
}));

const product = {
  id: 'local-male-0',
  name: 'Normalized Runner',
  image: '/database/Male/0.jpg',
  price: { current: 60, original: 90 },
  rating: 4.5,
  sizes: [40, 41],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAddItem.mockResolvedValue({ success: true });
});

test('renders normalized product image and price fields', () => {
  render(<ProductCard product={product} />);

  expect(screen.getByAltText('Normalized Runner')).toHaveAttribute(
    'src',
    '/database/Male/0.jpg'
  );
  expect(screen.getByText('$90.00')).toBeInTheDocument();
  expect(screen.getByText('$60.00')).toBeInTheDocument();
});

test('adds a normalized cart-compatible product payload', async () => {
  render(<ProductCard product={product} />);

  fireEvent.click(screen.getByText('ADD TO CART'));

  await waitFor(() =>
    expect(mockAddItem).toHaveBeenCalledWith(
      {
        _id: 'local-male-0',
        name: 'Normalized Runner',
        image: '/database/Male/0.jpg',
        price: { current: 60, original: 90 },
      },
      1,
      40
    )
  );
  await waitFor(() =>
    expect(mockToastSuccess).toHaveBeenCalledWith('Normalized Runner added to cart!')
  );
  expect(mockOpenCart).toHaveBeenCalled();
});

test('uses the first available product size when size 40 is unavailable', async () => {
  render(<ProductCard product={{ ...product, sizes: [41, 42] }} />);

  fireEvent.click(screen.getByText('ADD TO CART'));

  await waitFor(() =>
    expect(mockAddItem).toHaveBeenCalledWith(
      {
        _id: 'local-male-0',
        name: 'Normalized Runner',
        image: '/database/Male/0.jpg',
        price: { current: 60, original: 90 },
      },
      1,
      41
    )
  );
});
