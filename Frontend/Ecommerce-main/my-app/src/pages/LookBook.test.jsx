import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import { beforeEach, expect, test, vi } from 'vitest';
import { lookbookApi } from '../api/lookbookApi';
import { renderWithRouter } from '../test/routerTestUtils';
import LookBook from './LookBook';

const {
  mockAddItem,
  mockOpenCart,
} = vi.hoisted(() => ({
  mockAddItem: vi.fn(),
  mockOpenCart: vi.fn(),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock('../store/cartStore', () => ({
  useCartStore: () => ({
    addItem: mockAddItem,
    openCart: mockOpenCart,
  }),
}));

vi.mock('../api/lookbookApi', () => ({
  lookbookApi: {
    getEntries: vi.fn(),
  },
}));

const product = {
  _id: '64f000000000000000000021',
  name: 'City Runner',
  gender: 'male',
  category: 'Running',
  image: '/images/city-runner.jpg',
  price: { current: 120, original: 140 },
  sizes: [41, 42],
  stock: 5,
};

const bundleProduct = {
  _id: '64f000000000000000000022',
  name: 'Trail Slip-On',
  gender: 'female',
  category: 'Sneaker',
  image: '/images/trail-slip-on.jpg',
  price: { current: 90, original: 90 },
  sizes: [40, 41],
  stock: 3,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAddItem.mockResolvedValue({ success: true });
  lookbookApi.getEntries.mockResolvedValue({
    success: true,
    data: [
      {
        _id: 'look-1',
        title: 'City Commute',
        description: 'A tagged scene for daily movement.',
        image: '/images/lookbook-city.jpg',
        status: 'active',
        hotspots: [{ product, x: 36, y: 62, label: 'Daily runner' }],
        bundle: {
          title: 'Commute Set',
          description: 'Pair the full look.',
          items: [
            { product, defaultSize: 42, quantity: 1 },
            { product: bundleProduct, defaultSize: 41, quantity: 1 },
          ],
        },
      },
    ],
  });
});

test('renders shoppable lookbook entries and adds a tagged product to cart', async () => {
  const user = userEvent.setup();
  renderWithRouter(<LookBook />);

  expect(await screen.findByRole('heading', { name: /the lookbook/i })).toBeInTheDocument();
  expect(screen.getByRole('link', { name: /explore scenes/i })).toHaveAttribute(
    'href',
    '#lookbook-scenes'
  );
  expect(await screen.findByText('City Commute')).toBeInTheDocument();
  expect(screen.getAllByText('City Runner')).toHaveLength(2);
  await user.selectOptions(screen.getAllByLabelText(/size/i)[0], '42');
  await user.click(screen.getByRole('button', { name: /add tagged product/i }));

  await waitFor(() => {
    expect(mockAddItem).toHaveBeenCalledWith(
      expect.objectContaining({
        _id: product._id,
        name: 'City Runner',
      }),
      1,
      42
    );
  });
  expect(mockOpenCart).toHaveBeenCalled();
  expect(toast.success).toHaveBeenCalledWith('City Runner added to cart.');
});

test('adds available bundle items with selected sizes', async () => {
  const user = userEvent.setup();
  renderWithRouter(<LookBook />);

  expect(await screen.findByText('Commute Set')).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /add available bundle items/i }));

  await waitFor(() => {
    expect(mockAddItem).toHaveBeenCalledTimes(2);
  });
  expect(mockAddItem).toHaveBeenNthCalledWith(
    1,
    expect.objectContaining({ _id: product._id }),
    1,
    42
  );
  expect(mockAddItem).toHaveBeenNthCalledWith(
    2,
    expect.objectContaining({ _id: bundleProduct._id }),
    1,
    41
  );
  expect(toast.success).toHaveBeenCalledWith('2 bundle item(s) added to cart.');
});
