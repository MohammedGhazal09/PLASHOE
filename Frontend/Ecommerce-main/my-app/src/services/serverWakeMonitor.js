export const SERVER_WAKE_NOTICE_DELAY_MS = 8000;

export const SERVER_WAKE_NOTICE_MESSAGE =
  'PLASHOE is waking up its server after a quiet period. This can take up to 40 seconds. Your connection is fine. Thanks for waiting.';

const createInitialSnapshot = () => ({
  pending: false,
  visible: false,
  message: SERVER_WAKE_NOTICE_MESSAGE,
});

let pendingCount = 0;
let noticeTimer = null;
let dismissedForCycle = false;
let snapshot = createInitialSnapshot();
const listeners = new Set();

const emit = () => {
  snapshot = {
    pending: pendingCount > 0,
    visible: snapshot.visible,
    message: SERVER_WAKE_NOTICE_MESSAGE,
  };

  listeners.forEach((listener) => listener(snapshot));
};

const clearNoticeTimer = () => {
  if (noticeTimer) {
    clearTimeout(noticeTimer);
    noticeTimer = null;
  }
};

const scheduleNotice = () => {
  if (noticeTimer || dismissedForCycle || snapshot.visible || pendingCount === 0) {
    return;
  }

  noticeTimer = setTimeout(() => {
    noticeTimer = null;

    if (pendingCount === 0 || dismissedForCycle) {
      return;
    }

    snapshot = {
      ...snapshot,
      pending: true,
      visible: true,
    };
    emit();
  }, SERVER_WAKE_NOTICE_DELAY_MS);
};

export const serverWakeMonitor = {
  startRequest() {
    const wasIdle = pendingCount === 0;
    pendingCount += 1;

    if (wasIdle) {
      dismissedForCycle = false;
      snapshot = {
        ...snapshot,
        visible: false,
      };
    }

    scheduleNotice();
    emit();
  },

  finishRequest() {
    if (pendingCount === 0) {
      return;
    }

    pendingCount -= 1;

    if (pendingCount === 0) {
      clearNoticeTimer();
      dismissedForCycle = false;
      snapshot = {
        ...snapshot,
        visible: false,
      };
    }

    emit();
  },

  dismiss() {
    if (!snapshot.visible) {
      return;
    }

    dismissedForCycle = pendingCount > 0;
    clearNoticeTimer();
    snapshot = {
      ...snapshot,
      visible: false,
    };
    emit();
  },

  subscribe(listener) {
    listeners.add(listener);
    listener(snapshot);

    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot() {
    return snapshot;
  },

  resetForTests() {
    clearNoticeTimer();
    pendingCount = 0;
    dismissedForCycle = false;
    snapshot = createInitialSnapshot();
    emit();
  },
};
