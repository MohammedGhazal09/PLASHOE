import { fireEvent, render, screen, waitFor } from '@testing-library/react';

jest.mock('leaflet', () => {
  const mockMap = {
    setView() {
      return mockMap;
    },
    remove() {},
  };
  const mockTileLayer = {
    addTo() {
      return mockTileLayer;
    },
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
    tileLayer() {
      return mockTileLayer;
    },
    marker() {
      return mockMarker;
    },
  };

  return {
    __esModule: true,
    default: mockLeaflet,
    ...mockLeaflet,
  };
});

jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

jest.mock('../api/ordersApi', () => ({
  contactApi: {
    submit: jest.fn(),
  },
}));

const toast = require('react-hot-toast');
const { contactApi } = require('../api/ordersApi');
const Contact = require('./Contact').default;

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
  jest.clearAllMocks();
});

test('validates required fields before submitting', () => {
  const { container } = render(<Contact />);

  fireEvent.submit(container.querySelector('form'));

  expect(toast.error).toHaveBeenCalledWith('Please fill in all required fields');
  expect(contactApi.submit).not.toHaveBeenCalled();
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
