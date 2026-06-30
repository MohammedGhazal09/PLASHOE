import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, expect, test, vi } from 'vitest';
import { adminApi } from '../../api/adminApi';
import { renderWithRouter } from '../../test/routerTestUtils';
import AdminCoupons from './AdminCoupons';
import AdminLookbook from './AdminLookbook';
import AdminMessages from './AdminMessages';
import AdminProducts from './AdminProducts';

vi.mock('../../api/adminApi', () => ({
  adminApi: {
    getProducts: vi.fn(),
    createProduct: vi.fn(),
    updateProduct: vi.fn(),
    deleteProduct: vi.fn(),
    getLookbookEntries: vi.fn(),
    createLookbookEntry: vi.fn(),
    updateLookbookEntry: vi.fn(),
    deleteLookbookEntry: vi.fn(),
    getCoupons: vi.fn(),
    createCoupon: vi.fn(),
    deleteCoupon: vi.fn(),
    getContactMessages: vi.fn(),
    markContactMessageRead: vi.fn(),
    deleteContactMessage: vi.fn(),
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
  adminApi.getProducts.mockResolvedValue({ success: true, data: [] });
  adminApi.createProduct.mockResolvedValue({ success: true, data: { _id: 'product-1' } });
  adminApi.getLookbookEntries.mockResolvedValue({ success: true, data: [] });
  adminApi.createLookbookEntry.mockResolvedValue({ success: true, data: { _id: 'lookbook-1' } });
  adminApi.getCoupons.mockResolvedValue({ success: true, data: [] });
  adminApi.createCoupon.mockResolvedValue({ success: true, data: { _id: 'coupon-1' } });
  adminApi.getContactMessages.mockResolvedValue({
    success: true,
    data: [
      {
        _id: 'message-1',
        name: 'Customer',
        email: 'customer@example.com',
        subject: 'Sizing',
        message: 'Do these run small?',
        isRead: false,
      },
    ],
  });
  adminApi.markContactMessageRead.mockResolvedValue({
    success: true,
    data: { _id: 'message-1', isRead: true },
  });
});

test('creates a lookbook entry through the admin form', async () => {
  const user = userEvent.setup();
  adminApi.getProducts.mockResolvedValue({
    success: true,
    data: [
      {
        _id: '64f000000000000000000021',
        name: 'City Runner',
        category: 'Running',
        sizes: [42],
        stock: 4,
        price: { current: 99 },
      },
    ],
  });
  renderWithRouter(<AdminLookbook />);

  expect(await screen.findByText(/hotspot product/i)).toBeInTheDocument();
  await user.type(screen.getByLabelText(/^title$/i), 'City Commute');
  await user.type(screen.getByLabelText(/image url/i), '/images/lookbook-city.jpg');
  await user.type(screen.getByLabelText(/^description$/i), 'Tagged commute scene');
  const selectButtons = await screen.findAllByRole('button', { name: /select city runner/i });
  await user.click(selectButtons[0]);
  await user.type(screen.getByLabelText(/bundle title/i), 'Commute Set');
  await user.click(selectButtons[1]);
  await user.click(screen.getByRole('button', { name: /save lookbook entry/i }));

  await waitFor(() => {
    expect(adminApi.createLookbookEntry).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'City Commute',
        image: '/images/lookbook-city.jpg',
        description: 'Tagged commute scene',
        hotspots: [
          {
            productId: '64f000000000000000000021',
            x: 50,
            y: 50,
            label: 'City Runner',
          },
        ],
        bundle: {
          title: 'Commute Set',
          items: [
            {
              productId: '64f000000000000000000021',
              defaultSize: 42,
              quantity: 1,
            },
          ],
        },
      })
    );
  });
});

test('creates a product with backend-supported fields', async () => {
  const user = userEvent.setup();
  renderWithRouter(<AdminProducts />);

  fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'Trail Runner' } });
  fireEvent.change(screen.getByLabelText(/image url/i), { target: { value: '/images/trail.jpg' } });
  fireEvent.change(screen.getByLabelText(/original price/i), { target: { value: '120' } });
  fireEvent.change(screen.getByLabelText(/current price/i), { target: { value: '99' } });
  fireEvent.change(screen.getByLabelText(/stock/i), { target: { value: '10' } });
  fireEvent.change(screen.getByLabelText(/^materials$/i), {
    target: { value: 'Upper: Recycled knit textile' },
  });
  fireEvent.change(screen.getByLabelText(/care instructions/i), {
    target: { value: 'Spot clean only' },
  });
  fireEvent.change(screen.getByLabelText(/sustainability summary/i), {
    target: { value: 'Upper material includes supplier-documented recycled textile.' },
  });
  fireEvent.change(screen.getByLabelText(/sustainability source/i), {
    target: { value: 'Supplier material declaration' },
  });
  fireEvent.change(screen.getByLabelText(/impact metrics/i), {
    target: { value: 'Recycled upper textile | Documented | | Supplier material declaration' },
  });
  fireEvent.change(screen.getByLabelText(/manufacturing location/i), {
    target: { value: 'Portugal' },
  });
  fireEvent.change(screen.getByLabelText(/manufacturing source/i), {
    target: { value: 'Supplier onboarding record' },
  });
  fireEvent.change(screen.getByLabelText(/durability summary/i), {
    target: { value: 'Care-tested for everyday city wear.' },
  });
  fireEvent.change(screen.getByLabelText(/durability source/i), {
    target: { value: 'PLASHOE care standard' },
  });
  await user.click(screen.getByRole('button', { name: /save product/i }));

  await waitFor(() => {
    expect(adminApi.createProduct).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Trail Runner',
        gender: 'male',
        category: 'Running',
        image: '/images/trail.jpg',
        price: { original: 120, current: 99 },
        stock: 10,
        materials: [{ label: 'Upper', value: 'Recycled knit textile' }],
        careInstructions: ['Spot clean only'],
        sustainability: {
          summary: 'Upper material includes supplier-documented recycled textile.',
          source: 'Supplier material declaration',
          impactMetrics: [
            {
              label: 'Recycled upper textile',
              value: 'Documented',
              source: 'Supplier material declaration',
            },
          ],
          manufacturing: {
            location: 'Portugal',
            source: 'Supplier onboarding record',
          },
          durability: {
            summary: 'Care-tested for everyday city wear.',
            source: 'PLASHOE care standard',
          },
        },
      })
    );
  });
});

test('creates a coupon through the admin form', async () => {
  const user = userEvent.setup();
  renderWithRouter(<AdminCoupons />);

  await user.type(screen.getByLabelText(/code/i), 'save10');
  await user.type(screen.getByLabelText(/discount/i), '10');
  await user.type(screen.getByLabelText(/valid from/i), '2026-07-01');
  await user.type(screen.getByLabelText(/valid until/i), '2026-08-31');
  await user.click(screen.getByRole('button', { name: /create coupon/i }));

  await waitFor(() => {
    expect(adminApi.createCoupon).toHaveBeenCalledWith(
      expect.objectContaining({
        code: 'save10',
        discountPercentage: 10,
        validFrom: '2026-07-01',
        validUntil: '2026-08-31',
        isActive: true,
      })
    );
  });
});

test('marks a contact message as read', async () => {
  const user = userEvent.setup();
  renderWithRouter(<AdminMessages />);

  expect(await screen.findByText(/do these run small/i)).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: /mark as read/i }));

  await waitFor(() => {
    expect(adminApi.markContactMessageRead).toHaveBeenCalledWith('message-1');
  });
});
