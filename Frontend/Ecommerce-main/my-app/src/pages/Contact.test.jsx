import { vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import L from 'leaflet';
import toast from 'react-hot-toast';
import { contactApi } from '../api/contactApi';
import Contact, { getContactTileLayer } from './Contact';

const toastMock = vi.hoisted(() => ({
  success: vi.fn(),
  error: vi.fn(),
}));

vi.mock('leaflet', () => {
  const mockMap = {
    setView() {
      return mockMap;
    },
    remove() {},
  };
  const mockTileLayer = {
    addTo: vi.fn(() => {
      return mockTileLayer;
    }),
  };
  const mockMarker = {
    addTo() {
      return mockMarker;
    },
    bindPopup() {
      return mockMarker;
    },
    openPopup() {
      return mockMarker;
    },
  };
  const mockLeaflet = {
    map() {
      return mockMap;
    },
    tileLayer: vi.fn(() => {
      return mockTileLayer;
    }),
    marker() {
      return mockMarker;
    },
    __mockTileLayer: mockTileLayer,
  };

  return {
    __esModule: true,
    default: mockLeaflet,
    ...mockLeaflet,
  };
});

vi.mock('react-hot-toast', () => ({
  default: toastMock,
  success: toastMock.success,
  error: toastMock.error,
}));

vi.mock('../config/config', () => ({
  config: {
    map: {
      apiKey: '',
      center: {
        lat: 24.7136,
        lng: 46.6753,
      },
      zoom: 14,
    },
    company: {
      address: 'Launch Suite, Verification Tower',
      phone: '+966-555-0101',
      email: 'launch@plashoe.test',
    },
  },
}));

vi.mock('../api/contactApi', () => ({
  contactApi: {
    submit: vi.fn(),
  },
}));

const fillContactForm = (container) => {
  fireEvent.change(container.querySelector('input[name="name"]'), {
    target: { value: 'Contact User' },
  });
  fireEvent.change(container.querySelector('input[name="email"]'), {
    target: { value: 'contact@example.com' },
  });
  fireEvent.change(container.querySelector('input[name="subject"]'), {
    target: { value: 'Sizing question' },
  });
  fireEvent.change(container.querySelector('textarea[name="message"]'), {
    target: { value: 'Do you ship to Riyadh?' },
  });
};

beforeEach(() => {
  vi.clearAllMocks();
  L.tileLayer.mockImplementation(() => L.__mockTileLayer);
});

test('validates required fields before submitting', () => {
  const { container } = render(<Contact />);

  fireEvent.submit(container.querySelector('form'));

  expect(toast.error).toHaveBeenCalledWith('Please fill in all required fields');
  expect(contactApi.submit).not.toHaveBeenCalled();
});

test('uses OpenStreetMap tiles when no MapTiler key is configured', () => {
  const tileLayer = getContactTileLayer({
    apiKey: '',
  });

  expect(tileLayer).toMatchObject({
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: expect.stringContaining('OpenStreetMap'),
  });
});

test('renders public company contact details from config', () => {
  render(<Contact />);

  expect(screen.getByText('Launch Suite, Verification Tower')).toBeInTheDocument();
  expect(screen.getByText('+966-555-0101')).toBeInTheDocument();
  expect(screen.getByText('launch@plashoe.test')).toBeInTheDocument();
});

test('submits contact details and clears fields on success', async () => {
  contactApi.submit.mockResolvedValue({ success: true });
  const { container } = render(<Contact />);

  fillContactForm(container);
  fireEvent.click(screen.getByRole('button', { name: /send message/i }));

  await waitFor(() => {
    expect(contactApi.submit).toHaveBeenCalledWith(
      'Contact User',
      'contact@example.com',
      'Sizing question',
      'Do you ship to Riyadh?'
    );
  });
  await waitFor(() => {
    expect(toast.success).toHaveBeenCalledWith('Message sent successfully!');
    expect(container.querySelector('input[name="name"]')).toHaveValue('');
    expect(container.querySelector('input[name="email"]')).toHaveValue('');
    expect(container.querySelector('input[name="subject"]')).toHaveValue('');
    expect(container.querySelector('textarea[name="message"]')).toHaveValue('');
  });
});

test('preserves entered details when contact submit fails', async () => {
  contactApi.submit.mockRejectedValue(new Error('Network unavailable'));
  const { container } = render(<Contact />);

  fillContactForm(container);
  fireEvent.click(screen.getByRole('button', { name: /send message/i }));

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Network unavailable');
  });
  expect(container.querySelector('input[name="name"]')).toHaveValue('Contact User');
  expect(container.querySelector('input[name="email"]')).toHaveValue('contact@example.com');
  expect(container.querySelector('input[name="subject"]')).toHaveValue('Sizing question');
  expect(container.querySelector('textarea[name="message"]')).toHaveValue('Do you ship to Riyadh?');
});
