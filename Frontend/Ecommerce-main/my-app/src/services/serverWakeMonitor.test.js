import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';
import { SERVER_WAKE_NOTICE_DELAY_MS, serverWakeMonitor } from './serverWakeMonitor';

describe('serverWakeMonitor', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    serverWakeMonitor.resetForTests();
  });

  afterEach(() => {
    serverWakeMonitor.resetForTests();
    vi.useRealTimers();
  });

  test('does not show the notice before the delay', () => {
    serverWakeMonitor.startRequest();

    vi.advanceTimersByTime(SERVER_WAKE_NOTICE_DELAY_MS - 1);

    expect(serverWakeMonitor.getSnapshot()).toMatchObject({
      pending: true,
      visible: false,
    });
  });

  test('shows the notice after the delay while a request is pending', () => {
    serverWakeMonitor.startRequest();

    vi.advanceTimersByTime(SERVER_WAKE_NOTICE_DELAY_MS);

    expect(serverWakeMonitor.getSnapshot()).toMatchObject({
      pending: true,
      visible: true,
    });
  });

  test('hides the notice when the request finishes', () => {
    serverWakeMonitor.startRequest();
    vi.advanceTimersByTime(SERVER_WAKE_NOTICE_DELAY_MS);

    serverWakeMonitor.finishRequest();

    expect(serverWakeMonitor.getSnapshot()).toMatchObject({
      pending: false,
      visible: false,
    });
  });

  test('keeps the notice visible until all concurrent requests finish', () => {
    serverWakeMonitor.startRequest();
    serverWakeMonitor.startRequest();
    vi.advanceTimersByTime(SERVER_WAKE_NOTICE_DELAY_MS);

    serverWakeMonitor.finishRequest();

    expect(serverWakeMonitor.getSnapshot()).toMatchObject({
      pending: true,
      visible: true,
    });

    serverWakeMonitor.finishRequest();

    expect(serverWakeMonitor.getSnapshot()).toMatchObject({
      pending: false,
      visible: false,
    });
  });

  test('dismisses for the current pending cycle and can show again later', () => {
    serverWakeMonitor.startRequest();
    vi.advanceTimersByTime(SERVER_WAKE_NOTICE_DELAY_MS);

    serverWakeMonitor.dismiss();
    vi.advanceTimersByTime(SERVER_WAKE_NOTICE_DELAY_MS * 2);

    expect(serverWakeMonitor.getSnapshot()).toMatchObject({
      pending: true,
      visible: false,
    });

    serverWakeMonitor.finishRequest();
    serverWakeMonitor.startRequest();
    vi.advanceTimersByTime(SERVER_WAKE_NOTICE_DELAY_MS);

    expect(serverWakeMonitor.getSnapshot()).toMatchObject({
      pending: true,
      visible: true,
    });
  });
});
