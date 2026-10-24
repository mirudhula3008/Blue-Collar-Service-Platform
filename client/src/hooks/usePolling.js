import { useCallback, useEffect, useRef, useState } from 'react';
import { errorMessage } from '../api/client';
import { translate } from '../context/LanguageContext';

/**
 * Calls `fetcher` now, every `intervalMs` while the tab is visible, and when the
 * tab regains focus. Returns { data, setData, error, loading, refresh }.
 */
export default function usePolling(fetcher, intervalMs = 15000) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    try {
      setData(await fetcherRef.current());
      setError(null);
    } catch (err) {
      setError(errorMessage(err, translate('common.loadError')));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      if (document.visibilityState === 'visible') refresh();
    }, intervalMs);
    const onVisible = () => document.visibilityState === 'visible' && refresh();
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [refresh, intervalMs]);

  return { data, setData, error, loading, refresh };
}
