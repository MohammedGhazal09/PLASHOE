import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleNotch, faXmark } from '@fortawesome/free-solid-svg-icons';
import { useServerWakeNotice } from '../hooks/useServerWakeNotice';
import { serverWakeMonitor } from '../services/serverWakeMonitor';

export default function ServerWakeNotice() {
  const { visible, message } = useServerWakeNotice();

  if (!visible) {
    return null;
  }

  return (
    <section
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label="Server status"
      className="fixed left-4 right-4 top-20 z-[60] mx-auto flex max-w-xl items-start gap-3 rounded-md border border-primary/30 bg-dark px-4 py-3 text-left text-white shadow-lg sm:left-auto sm:mx-0 sm:w-[28rem]"
    >
      <FontAwesomeIcon
        icon={faCircleNotch}
        className="mt-1 h-4 w-4 flex-shrink-0 animate-spin text-primary"
        aria-hidden="true"
      />
      <p className="flex-1 text-sm leading-6">{message}</p>
      <button
        type="button"
        onClick={() => serverWakeMonitor.dismiss()}
        className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-md text-white transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label="Dismiss server status notice"
        title="Dismiss notice"
      >
        <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
      </button>
    </section>
  );
}
