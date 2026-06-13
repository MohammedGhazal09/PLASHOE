import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import QuickViewModal from './QuickViewModal';

const mockAddItem = jest.fn();
const mockOpenCart = jest.fn();
const mockToastSuccess = jest.fn();
const mockToastError = jest.fn();

jest.mock('../store/cartStore', () => ({
  useCartStore: () => ({
    addItem: mockAddItem,
    openCart: mockOpenCart,
  }),
}));

jest.mock('react-hot-toast', () => ({
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
  jest.clearAllMocks();
  mockAddItem.mockResolvedValue({ success: true });
});

test('renders normalized quick-view product fields', () => {
  render(<QuickViewModal product={product} onClose={jest.fn()} />);

  expect(screen.getByAltText('Backend Runner')).toHaveAttribute('src', '/images/runner.jpg');
  expect(screen.getByText('$150.00')).toBeInTheDocument();
  expect(screen.getByText('$120.00')).toBeInTheDocument();
  expect(screen.getByText('20% OFF')).toBeInTheDocument();
});

test('adds normalized quick-view payload to cart and closes modal', async () => {
  const handleClose = jest.fn();
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
