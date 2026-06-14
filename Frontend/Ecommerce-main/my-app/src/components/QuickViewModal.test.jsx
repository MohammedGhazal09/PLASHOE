import { vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import QuickViewModal from './QuickViewModal';

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
  id: 'backend-1',
  name: 'Backend Runner',
  image: '/images/runner.jpg',
  category: 'Running',
  price: { current: 120, original: 150 },
  rating: 5,
  sizes: [41, 42],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAddItem.mockResolvedValue({ success: true });
});

test('renders normalized quick-view product fields', () => {
  render(<QuickViewModal product={product} onClose={vi.fn()} />);

  expect(screen.getByAltText('Backend Runner')).toHaveAttribute('src', '/images/runner.jpg');
  expect(screen.getByText('$150.00')).toBeInTheDocument();
  expect(screen.getByText('$120.00')).toBeInTheDocument();
  expect(screen.getByText('20% OFF')).toBeInTheDocument();
});

test('adds normalized quick-view payload to cart and closes modal', async () => {
  const handleClose = vi.fn();
  render(<QuickViewModal product={product} onClose={handleClose} />);

  fireEvent.click(screen.getByText('ADD TO CART - $120.00'));

  await waitFor(() =>
    expect(mockAddItem).toHaveBeenCalledWith(
      {
        _id: 'backend-1',
        name: 'Backend Runner',
        image: '/images/runner.jpg',
        price: { current: 120, original: 150 },
      },
      1,
      41
    )
  );
  await waitFor(() =>
    expect(mockToastSuccess).toHaveBeenCalledWith('Backend Runner added to cart!')
  );
  expect(handleClose).toHaveBeenCalled();
  expect(mockOpenCart).toHaveBeenCalled();
});
