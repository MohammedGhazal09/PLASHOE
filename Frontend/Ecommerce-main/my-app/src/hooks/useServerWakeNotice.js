import { useEffect, useState } from 'react';
import { serverWakeMonitor } from '../services/serverWakeMonitor';

export const useServerWakeNotice = () => {
  const [notice, setNotice] = useState(() => serverWakeMonitor.getSnapshot());

  useEffect(() => serverWakeMonitor.subscribe(setNotice), []);

  return notice;
};
