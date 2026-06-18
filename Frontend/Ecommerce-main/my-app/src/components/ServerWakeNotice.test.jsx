import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import ServerWakeNotice from './ServerWakeNotice';
import {
  SERVER_WAKE_NOTICE_DELAY_MS,
  SERVER_WAKE_NOTICE_MESSAGE,
  serverWakeMonitor,
} from '../services/serverWakeMonitor';

beforeEach(() => {
  vi.useFakeTimers();
  serverWakeMonitor.resetForTests();
});

afterEach(() => {
  act(() => {
    serverWakeMonitor.resetForTests();
  });
  vi.useRealTimers();
});

test('shows an accessible server wake notice after a slow request and dismisses it', async () => {
  render(<ServerWakeNotice />);

  expect(screen.queryByText(SERVER_WAKE_NOTICE_MESSAGE)).not.toBeInTheDocument();

  act(() => {
    serverWakeMonitor.startRequest();
    vi.advanceTimersByTime(SERVER_WAKE_NOTICE_DELAY_MS);
  });

  expect(screen.getByRole('status', { name: /server status/i })).toHaveTextContent(
    SERVER_WAKE_NOTICE_MESSAGE
  );

  fireEvent.click(screen.getByRole('button', { name: /dismiss server status notice/i }));

  expect(screen.queryByText(SERVER_WAKE_NOTICE_MESSAGE)).not.toBeInTheDocument();
});
